import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer storage
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only JPEG, JPG, and PNG image files are allowed.'));
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

export const uploadPaymentScreenshot = async (req, res) => {
  const patientId = req.user.patientId;
  const { appointmentId, amount, paymentMethod, transactionRef } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'Payment screenshot image is required.' });
  }

  if (!appointmentId || !amount) {
    // Clean up uploaded file if validation fails
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Appointment ID and amount are required.' });
  }

  try {
    // Verify appointment belongs to patient and is in 'pending' status
    const appCheck = await query(
      'SELECT patient_id, status FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (appCheck.rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const appointment = appCheck.rows[0];
    if (appointment.patient_id !== patientId) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Unauthorized. This booking is not yours.' });
    }

    // Accept payments for pending or rejected (re-upload) appointments
    if (appointment.status !== 'pending' && appointment.status !== 'rejected') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: `Cannot upload payment for appointment with status ${appointment.status}.` });
    }

    const screenshotUrl = `/uploads/${req.file.filename}`;

    await query('BEGIN');

    // Upsert payment record: one appointment = one payment record
    const paymentCheck = await query('SELECT id FROM payments WHERE appointment_id = $1', [appointmentId]);
    
    if (paymentCheck.rows.length > 0) {
      // Update existing record
      await query(
        `UPDATE payments 
         SET amount = $1, payment_method = $2, screenshot_url = $3, status = 'pending', rejection_reason = NULL, transaction_ref = $4, updated_at = NOW()
         WHERE appointment_id = $5`,
        [amount, paymentMethod || 'JazzCash', screenshotUrl, transactionRef || null, appointmentId]
      );
    } else {
      // Insert new record
      await query(
        `INSERT INTO payments (appointment_id, patient_id, amount, payment_method, screenshot_url, status, transaction_ref)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
        [appointmentId, patientId, amount, paymentMethod || 'JazzCash', screenshotUrl, transactionRef || null]
      );
    }

    // Update appointment status to 'payment_uploaded'
    await query(
      `UPDATE appointments SET status = 'payment_uploaded', updated_at = NOW() WHERE id = $1`,
      [appointmentId]
    );

    await query('COMMIT');

    return res.status(200).json({
      message: 'Payment screenshot uploaded successfully. Awaiting verification.',
      screenshotUrl
    });
  } catch (error) {
    await query('ROLLBACK');
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload payment screenshot error:', error);
    return res.status(500).json({ message: 'Failed to process payment upload.' });
  }
};

export const getPaymentDetailsByAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { role, doctorId, patientId } = req.user;

  try {
    const paymentRes = await query('SELECT * FROM payments WHERE appointment_id = $1', [appointmentId]);
    if (paymentRes.rows.length === 0) {
      return res.status(404).json({ message: 'No payment record found for this appointment.' });
    }

    const payment = paymentRes.rows[0];

    // Access control: only patient who owns it, or doctor/assistant assigned to it
    if (role === 'patient' && payment.patient_id !== patientId) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (role === 'doctor' || role === 'assistant') {
      const appRes = await query('SELECT doctor_id FROM appointments WHERE id = $1', [appointmentId]);
      if (appRes.rows[0].doctor_id !== doctorId) {
        return res.status(403).json({ message: 'Unauthorized.' });
      }
    }

    return res.status(200).json(payment);
  } catch (error) {
    console.error('Get payment details error:', error);
    return res.status(500).json({ message: 'Failed to retrieve payment details.' });
  }
};

export const verifyPayment = async (req, res) => {
  const { id } = req.params; // payment ID
  const { userId, role, doctorId } = req.user;

  // Only assistant or doctor can verify
  if (role !== 'assistant' && role !== 'doctor') {
    return res.status(403).json({ message: 'Only assistants or doctors can verify payments.' });
  }

  try {
    await query('BEGIN');

    // Get payment details
    const paymentCheck = await query(
      'SELECT appointment_id, status FROM payments WHERE id = $1',
      [id]
    );

    if (paymentCheck.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    const payment = paymentCheck.rows[0];

    // Check if the payment belongs to the assistant's doctor
    const appCheck = await query(
      'SELECT doctor_id FROM appointments WHERE id = $1',
      [payment.appointment_id]
    );

    if (appCheck.rows[0].doctor_id !== doctorId) {
      await query('ROLLBACK');
      return res.status(403).json({ message: 'Unauthorized. This payment is for another doctor.' });
    }

    // Update payment record to 'verified'
    await query(
      `UPDATE payments 
       SET status = 'verified', verified_by = $1, verified_at = NOW(), updated_at = NOW() 
       WHERE id = $2`,
      [userId, id]
    );

    // Update appointment status to 'confirmed' and set confirmed_by / confirmed_at
    await query(
      `UPDATE appointments 
       SET status = 'confirmed', confirmed_by = $1, confirmed_at = NOW(), updated_at = NOW() 
       WHERE id = $2`,
      [userId, payment.appointment_id]
    );

    await query('COMMIT');

    return res.status(200).json({ message: 'Payment verified successfully. Booking confirmed!' });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Verify payment error:', error);
    return res.status(500).json({ message: 'Failed to verify payment.' });
  }
};

export const rejectPayment = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const { userId, role, doctorId } = req.user;

  if (!reason) {
    return res.status(400).json({ message: 'Rejection reason is required.' });
  }

  if (role !== 'assistant' && role !== 'doctor') {
    return res.status(403).json({ message: 'Only assistants or doctors can reject payments.' });
  }

  try {
    await query('BEGIN');

    const paymentCheck = await query(
      'SELECT appointment_id, status FROM payments WHERE id = $1',
      [id]
    );

    if (paymentCheck.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    const payment = paymentCheck.rows[0];

    const appCheck = await query(
      'SELECT doctor_id FROM appointments WHERE id = $1',
      [payment.appointment_id]
    );

    if (appCheck.rows[0].doctor_id !== doctorId) {
      await query('ROLLBACK');
      return res.status(403).json({ message: 'Unauthorized. This payment is for another doctor.' });
    }

    // Update payment to 'rejected'
    await query(
      `UPDATE payments 
       SET status = 'rejected', verified_by = $1, verified_at = NOW(), rejection_reason = $2, updated_at = NOW() 
       WHERE id = $3`,
      [userId, reason, id]
    );

    // Update appointment status to 'rejected'
    await query(
      `UPDATE appointments 
       SET status = 'rejected', updated_at = NOW() 
       WHERE id = $1`,
      [payment.appointment_id]
    );

    await query('COMMIT');

    return res.status(200).json({ message: 'Payment rejected. Patient will be prompted to re-upload.' });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Reject payment error:', error);
    return res.status(500).json({ message: 'Failed to reject payment.' });
  }
};
