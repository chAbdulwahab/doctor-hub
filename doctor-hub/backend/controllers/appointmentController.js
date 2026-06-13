import { query } from '../config/db.js';

export const bookAppointment = async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    return res.status(403).json({ message: 'Only registered patients can book appointments.' });
  }

  const { doctorId, clinicId, scheduleId, appointmentDate, appointmentTime, reasonForVisit } = req.body;

  if (!doctorId || !clinicId || !appointmentDate || !appointmentTime) {
    return res.status(400).json({ message: 'Doctor, clinic, date, and time are required.' });
  }

  try {
    // 1. Check double booking for the doctor: same date, same time, active statuses
    const doubleBookRes = await query(
      `SELECT id FROM appointments 
       WHERE doctor_id = $1 
         AND appointment_date = $2 
         AND appointment_time = $3 
         AND status NOT IN ('cancelled', 'rejected')`,
      [doctorId, appointmentDate, appointmentTime]
    );

    if (doubleBookRes.rows.length > 0) {
      return res.status(409).json({ message: 'This time slot is already booked for this doctor.' });
    }

    // 2. Check patient double booking: same patient, same date, same time
    const patientDoubleBookRes = await query(
      `SELECT id FROM appointments 
       WHERE patient_id = $1 
         AND appointment_date = $2 
         AND appointment_time = $3 
         AND status NOT IN ('cancelled', 'rejected')`,
      [patientId, appointmentDate, appointmentTime]
    );

    if (patientDoubleBookRes.rows.length > 0) {
      return res.status(409).json({ message: 'You have already booked another appointment at this time.' });
    }

    // 3. Create the appointment record
    const result = await query(
      `INSERT INTO appointments (patient_id, doctor_id, clinic_id, schedule_id, appointment_date, appointment_time, status, reason_for_visit)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7) RETURNING *`,
      [patientId, doctorId, clinicId, scheduleId || null, appointmentDate, appointmentTime, reasonForVisit || null]
    );

    return res.status(201).json({
      message: 'Appointment booked successfully. Status: PENDING. Please submit payment info.',
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    return res.status(500).json({ message: 'Failed to book appointment.', error: error.message });
  }
};

export const listAppointments = async (req, res) => {
  const { role, userId, patientId, doctorId } = req.user;

  let queryText = 'SELECT * FROM vw_appointments_detail';
  const queryParams = [];

  if (role === 'patient') {
    queryText += ' WHERE patient_id = $1';
    queryParams.push(patientId);
  } else if (role === 'doctor') {
    queryText += ' WHERE doctor_id = $1';
    queryParams.push(doctorId);
  } else if (role === 'assistant') {
    queryText += ' WHERE doctor_id = $1';
    queryParams.push(doctorId); // Assistant is scoped to their doctor's ID
  } else if (role === 'admin' || role === 'super_admin') {
    // Admin sees all
  } else {
    return res.status(403).json({ message: 'Unauthorized.' });
  }

  queryText += ' ORDER BY appointment_date DESC, appointment_time DESC';

  try {
    const result = await query(queryText, queryParams);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('List appointments error:', error);
    return res.status(500).json({ message: 'Failed to retrieve appointments.' });
  }
};

export const getAppointmentById = async (req, res) => {
  const { id } = req.params;
  const { role, patientId, doctorId } = req.user;

  try {
    const appointmentRes = await query(
      `SELECT a.*, 
              u_pat.full_name AS patient_name, u_pat.phone AS patient_phone, u_pat.email AS patient_email,
              u_doc.full_name AS doctor_name, doc.specialization, doc.treatment_type,
              c.clinic_name, c.address AS clinic_address, c.city AS clinic_city,
              p.screenshot_url, p.status AS payment_status, p.amount AS payment_amount, p.rejection_reason
       FROM appointments a
       JOIN patients pat ON pat.id = a.patient_id
       JOIN users u_pat ON u_pat.id = pat.user_id
       JOIN doctors doc ON doc.id = a.doctor_id
       JOIN users u_doc ON u_doc.id = doc.user_id
       JOIN clinics c ON c.id = a.clinic_id
       LEFT JOIN payments p ON p.appointment_id = a.id
       WHERE a.id = $1`,
      [id]
    );

    if (appointmentRes.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const appointment = appointmentRes.rows[0];

    // Access control check
    if (role === 'patient' && appointment.patient_id !== patientId) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    if ((role === 'doctor' || role === 'assistant') && appointment.doctor_id !== doctorId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    return res.status(200).json(appointment);
  } catch (error) {
    console.error('Get appointment by ID error:', error);
    return res.status(500).json({ message: 'Failed to retrieve appointment details.' });
  }
};

export const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  const { role, userId, patientId, doctorId } = req.user;

  try {
    const checkRes = await query('SELECT patient_id, doctor_id, status FROM appointments WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const appointment = checkRes.rows[0];

    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return res.status(400).json({ message: `Cannot cancel an appointment that is already ${appointment.status}.` });
    }

    // Verify who is canceling
    if (role === 'patient' && appointment.patient_id !== patientId) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    if ((role === 'doctor' || role === 'assistant') && appointment.doctor_id !== doctorId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await query(
      `UPDATE appointments 
       SET status = 'cancelled', cancelled_by = $1, cancellation_reason = $2, updated_at = NOW() 
       WHERE id = $3`,
      [userId, req.body.reason || 'Cancelled by user', id]
    );

    return res.status(200).json({ message: 'Appointment cancelled successfully.' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return res.status(500).json({ message: 'Failed to cancel appointment.' });
  }
};
