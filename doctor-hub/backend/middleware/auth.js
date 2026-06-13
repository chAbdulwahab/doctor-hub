import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'doctor_hub_secret_key_2026');
    req.user = decoded;

    // Resolve profile IDs based on role for easy access in controllers
    if (decoded.role === 'patient') {
      const patientRes = await query('SELECT id FROM patients WHERE user_id = $1', [decoded.userId]);
      if (patientRes.rows.length > 0) {
        req.user.patientId = patientRes.rows[0].id;
      }
    } else if (decoded.role === 'doctor') {
      const doctorRes = await query('SELECT id FROM doctors WHERE user_id = $1', [decoded.userId]);
      if (doctorRes.rows.length > 0) {
        req.user.doctorId = doctorRes.rows[0].id;
      }
    } else if (decoded.role === 'assistant') {
      const assistantRes = await query('SELECT id, doctor_id FROM assistants WHERE user_id = $1', [decoded.userId]);
      if (assistantRes.rows.length > 0) {
        req.user.assistantId = assistantRes.rows[0].id;
        req.user.doctorId = assistantRes.rows[0].doctor_id; // Scope assistant to their doctor
      }
    }

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};
