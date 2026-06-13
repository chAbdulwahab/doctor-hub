import { query } from '../config/db.js';

export const addPrescription = async (req, res) => {
  const doctorId = req.user.doctorId;
  if (!doctorId) {
    return res.status(403).json({ message: 'Only registered doctors can create prescriptions.' });
  }

  const { appointmentId, patientId, diagnosis, generalNotes, followUpInDays, items } = req.body;

  if (!appointmentId || !patientId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Appointment ID, Patient ID, and at least one prescription item are required.' });
  }

  try {
    // Check if prescription already exists for this appointment
    const existing = await query('SELECT id FROM prescriptions WHERE appointment_id = $1', [appointmentId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'A prescription already exists for this appointment. It cannot be modified.' });
    }

    // Verify appointment belongs to doctor
    const appCheck = await query('SELECT doctor_id FROM appointments WHERE id = $1', [appointmentId]);
    if (appCheck.rows.length === 0 || appCheck.rows[0].doctor_id !== doctorId) {
      return res.status(403).json({ message: 'Invalid appointment reference.' });
    }

    await query('BEGIN');

    // 1. Create prescription header
    const prescriptionRes = await query(
      `INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, diagnosis, general_notes, follow_up_in_days)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [appointmentId, patientId, doctorId, diagnosis || null, generalNotes || null, followUpInDays || null]
    );

    const prescriptionId = prescriptionRes.rows[0].id;

    // 2. Insert line items
    const insertedItems = [];
    for (const item of items) {
      const { medicineName, dosage, frequency, duration, route, instructions } = item;
      if (!medicineName || !dosage || !frequency) {
        throw new Error('Each prescription item must have medicineName, dosage, and frequency.');
      }

      const itemRes = await query(
        `INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, route, instructions)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [prescriptionId, medicineName, dosage, frequency, duration || null, route || null, instructions || null]
      );
      insertedItems.push(itemRes.rows[0]);
    }

    await query('COMMIT');

    return res.status(201).json({
      message: 'Prescription created successfully. Records are immutable and saved.',
      prescription: prescriptionRes.rows[0],
      items: insertedItems
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Add prescription error:', error);
    return res.status(500).json({ message: 'Failed to create prescription.', error: error.message });
  }
};

export const getPrescriptionByAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { role, patientId, doctorId } = req.user;

  try {
    const prescriptionRes = await query(
      `SELECT p.*, u_doc.full_name AS doctor_name, doc.specialization, doc.treatment_type, c.clinic_name
       FROM prescriptions p
       JOIN appointments a ON a.id = p.appointment_id
       JOIN clinics c ON c.id = a.clinic_id
       JOIN doctors doc ON doc.id = p.doctor_id
       JOIN users u_doc ON u_doc.id = doc.user_id
       WHERE p.appointment_id = $1`,
      [appointmentId]
    );

    if (prescriptionRes.rows.length === 0) {
      return res.status(404).json({ message: 'No prescription found for this appointment.' });
    }

    const prescription = prescriptionRes.rows[0];

    // Access control
    if (role === 'patient' && prescription.patient_id !== patientId) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }
    if ((role === 'doctor' || role === 'assistant') && prescription.doctor_id !== doctorId) {
      return res.status(403).json({ message: 'Unauthorized access.' });
    }

    // Load prescription items
    const itemsRes = await query(
      'SELECT * FROM prescription_items WHERE prescription_id = $1 ORDER BY id ASC',
      [prescription.id]
    );

    return res.status(200).json({
      ...prescription,
      items: itemsRes.rows
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    return res.status(500).json({ message: 'Failed to retrieve prescription.' });
  }
};
