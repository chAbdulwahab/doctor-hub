import { query } from '../config/db.js';

export const sendMessage = async (req, res) => {
  const senderId = req.user.userId;
  const { appointmentId, messageText } = req.body;

  if (!appointmentId || !messageText) {
    return res.status(400).json({ message: 'Appointment ID and message text are required.' });
  }

  try {
    // 1. Fetch appointment details to verify context & determine receiver
    const appRes = await query(
      `SELECT a.patient_id, a.doctor_id, a.status, 
              pat.user_id AS patient_user_id, doc.user_id AS doctor_user_id
       FROM appointments a
       JOIN patients pat ON pat.id = a.patient_id
       JOIN doctors doc ON doc.id = a.doctor_id
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (appRes.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment context not found.' });
    }

    const appointment = appRes.rows[0];

    // Check status: must be confirmed or completed
    if (appointment.status !== 'confirmed' && appointment.status !== 'completed') {
      return res.status(400).json({ message: 'Communication is only allowed for confirmed appointments.' });
    }

    // Determine receiver and verify sender is part of this appointment
    let receiverId = null;
    if (senderId === appointment.patient_user_id) {
      receiverId = appointment.doctor_user_id;
    } else if (senderId === appointment.doctor_user_id) {
      receiverId = appointment.patient_user_id;
    } else {
      // Check if sender is an assistant of the doctor
      const assistantRes = await query(
        'SELECT id FROM assistants WHERE user_id = $1 AND doctor_id = $2',
        [senderId, appointment.doctor_id]
      );
      if (assistantRes.rows.length > 0) {
        receiverId = appointment.patient_user_id; // Assistant messages as the doctor scope
      } else {
        return res.status(403).json({ message: 'You are not authorized to send messages in this appointment.' });
      }
    }

    const result = await query(
      `INSERT INTO messages (appointment_id, sender_id, receiver_id, message_text, is_read)
       VALUES ($1, $2, $3, $4, FALSE) RETURNING *`,
      [appointmentId, senderId, receiverId, messageText]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ message: 'Failed to send message.' });
  }
};

export const getMessagesByAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { userId, role, patientId, doctorId } = req.user;

  try {
    // Check permission
    const appRes = await query(
      `SELECT a.patient_id, a.doctor_id, 
              pat.user_id AS patient_user_id, doc.user_id AS doctor_user_id
       FROM appointments a
       JOIN patients pat ON pat.id = a.patient_id
       JOIN doctors doc ON doc.id = a.doctor_id
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (appRes.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const appointment = appRes.rows[0];

    let authorized = false;
    if (userId === appointment.patient_user_id || userId === appointment.doctor_user_id) {
      authorized = true;
    } else if (role === 'assistant') {
      const assCheck = await query('SELECT id FROM assistants WHERE user_id = $1 AND doctor_id = $2', [userId, appointment.doctor_id]);
      if (assCheck.rows.length > 0) {
        authorized = true;
      }
    } else if (role === 'admin' || role === 'super_admin') {
      authorized = true;
    }

    if (!authorized) {
      return res.status(403).json({ message: 'Unauthorized access to chat thread.' });
    }

    // Retrieve messages
    const messagesRes = await query(
      `SELECT m.*, u.full_name AS sender_name, u.role AS sender_role
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.appointment_id = $1
       ORDER BY m.created_at ASC`,
      [appointmentId]
    );

    // Mark messages received by current user as read
    await query(
      'UPDATE messages SET is_read = TRUE WHERE appointment_id = $1 AND receiver_id = $2 AND is_read = FALSE',
      [appointmentId, userId]
    );

    return res.status(200).json(messagesRes.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ message: 'Failed to retrieve messages.' });
  }
};
