import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'doctor_hub_secret_key_2026';

export const register = async (req, res) => {
  const { fullName, email, phone, password, role, ...profileData } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Full name, email, and password are required.' });
  }

  const validRoles = ['patient', 'doctor'];
  const userRole = validRoles.includes(role) ? role : 'patient';

  try {
    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // We use a transaction to create both User and Profile records
    await query('BEGIN');

    const userInsert = await query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, is_active, is_verified)
       VALUES ($1, $2, $3, $4, $5, TRUE, $6) RETURNING id`,
      [fullName, email, phone || null, hashedPassword, userRole, userRole === 'patient'] // Patients are verified instantly, doctors need approval
    );
    const userId = userInsert.rows[0].id;

    if (userRole === 'patient') {
      const { dateOfBirth, gender, bloodGroup, allergies, chronicDiseases } = profileData;
      await query(
        `INSERT INTO patients (user_id, date_of_birth, gender, blood_group, allergies, chronic_diseases)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, dateOfBirth || null, gender || null, bloodGroup || null, allergies || [], chronicDiseases || []]
      );
    } else if (userRole === 'doctor') {
      const { pmdcNumber, specialization, treatmentType, diseasesTreated, experienceYears, bio, consultationFee } = profileData;
      await query(
        `INSERT INTO doctors (user_id, pmdc_number, specialization, treatment_type, diseases_treated, experience_years, bio, consultation_fee, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_approval')`,
        [
          userId,
          pmdcNumber || null,
          specialization || 'General Physician',
          treatmentType || 'allopathic',
          diseasesTreated || [],
          experienceYears || 0,
          bio || null,
          consultationFee || 0.0
        ]
      );
    }

    await query('COMMIT');

    return res.status(201).json({
      message: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} registered successfully.${
        userRole === 'doctor' ? ' Doctor account pending administrator approval.' : ''
      }`
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: 'Your account has been deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Resolve profile details
    let profile = null;
    if (user.role === 'patient') {
      const patientRes = await query('SELECT * FROM patients WHERE user_id = $1', [user.id]);
      if (patientRes.rows.length > 0) profile = patientRes.rows[0];
    } else if (user.role === 'doctor') {
      const doctorRes = await query('SELECT * FROM doctors WHERE user_id = $1', [user.id]);
      if (doctorRes.rows.length > 0) {
        profile = doctorRes.rows[0];
        if (profile.status !== 'active') {
          return res.status(403).json({
            message: `Your account is ${profile.status.replace('_', ' ')}. Please contact support.`
          });
        }
      }
    } else if (user.role === 'assistant') {
      const assistantRes = await query('SELECT * FROM assistants WHERE user_id = $1', [user.id]);
      if (assistantRes.rows.length > 0) profile = assistantRes.rows[0];
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profile_image,
        profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'No user registered with this email.' });
    }

    // Generate token valid for 1 hour
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [resetToken, expiry, email]
    );

    // In production, send email. For development, return token in response.
    return res.status(200).json({
      message: 'Password reset link generated.',
      resetToken, // Return for easy testing
      info: 'In production, this token will be sent to your email.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error during forgot password request.' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  try {
    const userResult = await query(
      'SELECT id, reset_token_expiry FROM users WHERE reset_token = $1',
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    const user = userResult.rows[0];
    if (new Date() > new Date(user.reset_token_expiry)) {
      return res.status(400).json({ message: 'Token has expired.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error during password reset.' });
  }
};
