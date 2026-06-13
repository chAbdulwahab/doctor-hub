import { query } from '../config/db.js';

export const listDoctors = async (req, res) => {
  const { name, specialization, disease, treatmentType } = req.query;

  let queryText = 'SELECT * FROM vw_doctor_profiles WHERE status = \'active\'';
  const queryParams = [];
  let paramIndex = 1;

  if (name) {
    queryText += ` AND doctor_name ILIKE $${paramIndex}`;
    queryParams.push(`%${name}%`);
    paramIndex++;
  }

  if (specialization) {
    queryText += ` AND specialization ILIKE $${paramIndex}`;
    queryParams.push(`%${specialization}%`);
    paramIndex++;
  }

  if (treatmentType) {
    queryText += ` AND treatment_type = $${paramIndex}`;
    queryParams.push(treatmentType.toLowerCase());
    paramIndex++;
  }

  if (disease) {
    // Check if the disease is inside the diseases_treated array
    queryText += ` AND $${paramIndex} = ANY(diseases_treated)`;
    queryParams.push(disease.toLowerCase());
    paramIndex++;
  }

  queryText += ' ORDER BY rating DESC, experience_years DESC';

  try {
    const doctorsRes = await query(queryText, queryParams);
    return res.status(200).json(doctorsRes.rows);
  } catch (error) {
    console.error('List doctors error:', error);
    return res.status(500).json({ message: 'Error retrieving doctor directory.', error: error.message });
  }
};

export const getDoctorById = async (req, res) => {
  const { id } = req.params;

  try {
    // Get doctor profile details
    const doctorProfileRes = await query(
      `SELECT d.*, u.full_name, u.email, u.phone, u.profile_image 
       FROM doctors d 
       JOIN users u ON u.id = d.user_id 
       WHERE d.id = $1`,
      [id]
    );

    if (doctorProfileRes.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    const doctor = doctorProfileRes.rows[0];

    // Get doctor clinics
    const clinicsRes = await query(
      'SELECT * FROM clinics WHERE doctor_id = $1 AND is_active = TRUE',
      [id]
    );

    // Get doctor schedules
    const schedulesRes = await query(
      `SELECT s.*, c.clinic_name, c.address 
       FROM schedules s
       JOIN clinics c ON c.id = s.clinic_id
       WHERE s.doctor_id = $1 AND s.is_active = TRUE`,
      [id]
    );

    return res.status(200).json({
      ...doctor,
      clinics: clinicsRes.rows,
      schedules: schedulesRes.rows
    });
  } catch (error) {
    console.error('Get doctor by ID error:', error);
    return res.status(500).json({ message: 'Error retrieving doctor profile.' });
  }
};

export const createDoctorProfile = async (req, res) => {
  const userId = req.user.userId;
  const { pmdcNumber, specialization, treatmentType, diseasesTreated, experienceYears, bio, consultationFee } = req.body;

  try {
    const existing = await query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Doctor profile already exists. Use PUT to update.' });
    }

    const result = await query(
      `INSERT INTO doctors (user_id, pmdc_number, specialization, treatment_type, diseases_treated, experience_years, bio, consultation_fee, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_approval') RETURNING *`,
      [userId, pmdcNumber, specialization, treatmentType, diseasesTreated || [], experienceYears || 0, bio, consultationFee || 0.0]
    );

    return res.status(201).json({
      message: 'Profile created. Awaiting admin approval.',
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Create doctor profile error:', error);
    return res.status(500).json({ message: 'Failed to create doctor profile.' });
  }
};

export const updateDoctorProfile = async (req, res) => {
  const userId = req.user.userId;
  const { specialization, diseasesTreated, experienceYears, bio, consultationFee, fullName, phone, profileImage } = req.body;

  try {
    await query('BEGIN');

    // Update user details
    if (fullName || phone || profileImage) {
      const userUpdates = [];
      const userParams = [];
      let idx = 1;

      if (fullName) {
        userUpdates.push(`full_name = $${idx}`);
        userParams.push(fullName);
        idx++;
      }
      if (phone) {
        userUpdates.push(`phone = $${idx}`);
        userParams.push(phone);
        idx++;
      }
      if (profileImage) {
        userUpdates.push(`profile_image = $${idx}`);
        userParams.push(profileImage);
        idx++;
      }

      userParams.push(userId);
      await query(
        `UPDATE users SET ${userUpdates.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
        userParams
      );
    }

    // Update doctor details
    const docUpdates = [];
    const docParams = [];
    let idx = 1;

    if (specialization) {
      docUpdates.push(`specialization = $${idx}`);
      docParams.push(specialization);
      idx++;
    }
    if (diseasesTreated) {
      docUpdates.push(`diseases_treated = $${idx}`);
      docParams.push(diseasesTreated);
      idx++;
    }
    if (experienceYears !== undefined) {
      docUpdates.push(`experience_years = $${idx}`);
      docParams.push(experienceYears);
      idx++;
    }
    if (bio !== undefined) {
      docUpdates.push(`bio = $${idx}`);
      docParams.push(bio);
      idx++;
    }
    if (consultationFee !== undefined) {
      docUpdates.push(`consultation_fee = $${idx}`);
      docParams.push(consultationFee);
      idx++;
    }

    if (docUpdates.length > 0) {
      docParams.push(userId);
      await query(
        `UPDATE doctors SET ${docUpdates.join(', ')}, updated_at = NOW() WHERE user_id = $${idx}`,
        docParams
      );
    }

    await query('COMMIT');

    const updatedProfile = await query(
      `SELECT d.*, u.full_name, u.email, u.phone, u.profile_image 
       FROM doctors d 
       JOIN users u ON u.id = d.user_id 
       WHERE d.user_id = $1`,
      [userId]
    );

    return res.status(200).json({
      message: 'Profile updated successfully.',
      profile: updatedProfile.rows[0]
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Update doctor profile error:', error);
    return res.status(500).json({ message: 'Failed to update profile.' });
  }
};
