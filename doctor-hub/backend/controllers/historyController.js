import { query } from '../config/db.js';

export const addHistoryRecord = async (req, res) => {
  const doctorId = req.user.doctorId;
  if (!doctorId) {
    return res.status(403).json({ message: 'Only registered doctors can add medical history records.' });
  }

  const {
    patientId,
    appointmentId,
    visitDate,
    chiefComplaint,
    diagnosis,
    symptoms,
    vitalSigns,
    labResults,
    treatmentGiven,
    followUpDate,
    doctorNotes,
    attachments
  } = req.body;

  if (!patientId || !diagnosis) {
    return res.status(400).json({ message: 'Patient ID and diagnosis are required.' });
  }

  try {
    // Optional check: verify appointment exists and belongs to this doctor
    if (appointmentId) {
      const appCheck = await query('SELECT doctor_id FROM appointments WHERE id = $1', [appointmentId]);
      if (appCheck.rows.length === 0 || appCheck.rows[0].doctor_id !== doctorId) {
        return res.status(403).json({ message: 'Invalid appointment reference.' });
      }
    }

    const result = await query(
      `INSERT INTO medical_history (
        patient_id, doctor_id, appointment_id, visit_date, chief_complaint, 
        diagnosis, symptoms, vital_signs, lab_results, treatment_given, 
        follow_up_date, doctor_notes, attachments
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        patientId,
        doctorId,
        appointmentId || null,
        visitDate || new Date().toISOString().split('T')[0],
        chiefComplaint || null,
        diagnosis,
        symptoms || [],
        vitalSigns ? JSON.stringify(vitalSigns) : null,
        labResults || null,
        treatmentGiven || null,
        followUpDate || null,
        doctorNotes || null,
        attachments || []
      ]
    );

    // If there is an appointment, mark status as completed in transaction
    if (appointmentId) {
      await query(
        `UPDATE appointments SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [appointmentId]
      );
    }

    return res.status(201).json({
      message: 'Medical history record added successfully and is now saved.',
      record: result.rows[0]
    });
  } catch (error) {
    console.error('Add medical history error:', error);
    return res.status(500).json({ message: 'Failed to add medical history record.', error: error.message });
  }
};

export const getPatientHistory = async (req, res) => {
  const { patientId } = req.params;
  const { role, doctorId } = req.user;

  // Doctors and assistants can view history
  if (role !== 'doctor' && role !== 'assistant' && role !== 'admin' && role !== 'super_admin') {
    return res.status(403).json({ message: 'Unauthorized access to medical history.' });
  }

  try {
    const result = await query(
      `SELECT mh.*, u.full_name AS doctor_name, d.specialization
       FROM medical_history mh
       JOIN doctors d ON d.id = mh.doctor_id
       JOIN users u ON u.id = d.user_id
       WHERE mh.patient_id = $1
       ORDER BY mh.visit_date DESC, mh.created_at DESC`,
      [patientId]
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get patient history error:', error);
    return res.status(500).json({ message: 'Failed to retrieve patient medical history.' });
  }
};

export const getOwnHistory = async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    return res.status(403).json({ message: 'Only patients can view their own medical history.' });
  }

  try {
    const result = await query(
      `SELECT mh.*, u.full_name AS doctor_name, d.specialization
       FROM medical_history mh
       JOIN doctors d ON d.id = mh.doctor_id
       JOIN users u ON u.id = d.user_id
       WHERE mh.patient_id = $1
       ORDER BY mh.visit_date DESC, mh.created_at DESC`,
      [patientId]
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get own history error:', error);
    return res.status(500).json({ message: 'Failed to retrieve medical history.' });
  }
};
