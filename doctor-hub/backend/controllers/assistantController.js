import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

export const createAssistant = async (req, res) => {
  const doctorId = req.user.doctorId; // Decoded by middleware from doctors table
  if (!doctorId) {
    return res.status(403).json({ message: 'Only registered doctors can create assistant accounts.' });
  }

  const { fullName, email, phone, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Full name, email, and password are required.' });
  }

  try {
    // Check if email already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email is already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await query('BEGIN');

    // Create assistant user
    const userInsert = await query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, is_active, is_verified)
       VALUES ($1, $2, $3, $4, 'assistant', TRUE, TRUE) RETURNING id`,
      [fullName, email, phone || null, hashedPassword]
    );

    const assistantUserId = userInsert.rows[0].id;

    // Link assistant to doctor
    const assistantInsert = await query(
      `INSERT INTO assistants (user_id, doctor_id, is_active)
       VALUES ($1, $2, TRUE) RETURNING *`,
      [assistantUserId, doctorId]
    );

    await query('COMMIT');

    return res.status(201).json({
      message: 'Assistant account created successfully.',
      assistant: {
        id: assistantInsert.rows[0].id,
        fullName,
        email,
        phone
      }
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Create assistant error:', error);
    return res.status(500).json({ message: 'Failed to create assistant account.', error: error.message });
  }
};

export const getMyAssistants = async (req, res) => {
  const doctorId = req.user.doctorId;
  if (!doctorId) {
    return res.status(403).json({ message: 'Only registered doctors can view assistant lists.' });
  }

  try {
    const result = await query(
      `SELECT a.id AS assistant_id, a.is_active, u.id AS user_id, u.full_name, u.email, u.phone, u.created_at
       FROM assistants a
       JOIN users u ON u.id = a.user_id
       WHERE a.doctor_id = $1
       ORDER BY u.created_at DESC`,
      [doctorId]
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get assistants error:', error);
    return res.status(500).json({ message: 'Failed to retrieve assistants list.' });
  }
};
