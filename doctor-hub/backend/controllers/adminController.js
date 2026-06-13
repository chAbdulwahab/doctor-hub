import { query } from '../config/db.js';

export const listAllDoctors = async (req, res) => {
  try {
    const result = await query(
      `SELECT d.id AS doctor_id, d.pmdc_number, d.specialization, d.treatment_type, 
              d.experience_years, d.consultation_fee, d.status AS doctor_status, 
              u.id AS user_id, u.full_name, u.email, u.phone, u.is_active, u.created_at
       FROM doctors d
       JOIN users u ON u.id = d.user_id
       ORDER BY u.created_at DESC`
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Admin list doctors error:', error);
    return res.status(500).json({ message: 'Failed to retrieve doctors list.' });
  }
};

export const approveDoctor = async (req, res) => {
  const { id } = req.params; // doctor ID
  const { status } = req.body; // 'active' or 'rejected'

  const allowedStatuses = ['active', 'suspended', 'rejected'];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Choose from: active, suspended, rejected' });
  }

  try {
    const doctorRes = await query('SELECT user_id FROM doctors WHERE id = $1', [id]);
    if (doctorRes.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    const userId = doctorRes.rows[0].user_id;

    await query('BEGIN');

    // Update status in doctors table
    await query(
      `UPDATE doctors SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );

    // Update verification state in users table
    const isVerified = status === 'active';
    await query(
      `UPDATE users SET is_verified = $1, updated_at = NOW() WHERE id = $2`,
      [isVerified, userId]
    );

    await query('COMMIT');

    return res.status(200).json({ message: `Doctor profile status updated to ${status}.` });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Approve doctor error:', error);
    return res.status(500).json({ message: 'Failed to update doctor profile status.' });
  }
};

export const listAllUsers = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, full_name, email, phone, role, is_active, is_verified, created_at 
       FROM users 
       ORDER BY role, created_at DESC`
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Admin list users error:', error);
    return res.status(500).json({ message: 'Failed to retrieve users list.' });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params; // User ID

  // Double check user role of the active session
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only Super Admins can permanently delete accounts.' });
  }

  try {
    // Delete user (cascade references will handle patients, doctors, assistants)
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json({ message: 'User and all associated profile details deleted permanently.' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Failed to delete user.' });
  }
};
