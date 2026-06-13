import { query } from '../config/db.js';

export const addClinic = async (req, res) => {
  const doctorId = req.user.doctorId;
  const { clinicName, address, city, province, contactPhone, mapLink } = req.body;

  if (!clinicName || !address || !city) {
    return res.status(400).json({ message: 'Clinic name, address, and city are required.' });
  }

  try {
    const result = await query(
      `INSERT INTO clinics (doctor_id, clinic_name, address, city, province, contact_phone, map_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [doctorId, clinicName, address, city, province || null, contactPhone || null, mapLink || null]
    );

    return res.status(201).json({
      message: 'Clinic added successfully.',
      clinic: result.rows[0]
    });
  } catch (error) {
    console.error('Add clinic error:', error);
    return res.status(500).json({ message: 'Failed to add clinic.' });
  }
};

export const getDoctorClinics = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const result = await query(
      'SELECT * FROM clinics WHERE doctor_id = $1 AND is_active = TRUE',
      [doctorId]
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get doctor clinics error:', error);
    return res.status(500).json({ message: 'Failed to retrieve clinics.' });
  }
};

export const addSchedule = async (req, res) => {
  const doctorId = req.user.doctorId;
  const { clinicId, dayOfWeek, startTime, endTime, slotDuration, fee } = req.body;

  if (!clinicId || !dayOfWeek || !startTime || !endTime) {
    return res.status(400).json({ message: 'Clinic, day, start time, and end time are required.' });
  }

  if (startTime >= endTime) {
    return res.status(400).json({ message: 'End time must be after start time.' });
  }

  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  if (!validDays.includes(dayOfWeek.toLowerCase())) {
    return res.status(400).json({ message: 'Invalid day of the week.' });
  }

  try {
    // Check clinic belongs to doctor
    const clinicCheck = await query(
      'SELECT id FROM clinics WHERE id = $1 AND doctor_id = $2',
      [clinicId, doctorId]
    );

    if (clinicCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Unauthorized. Clinic does not belong to you.' });
    }

    // Check for overlap schedules
    const overlapCheck = await query(
      `SELECT id FROM schedules 
       WHERE doctor_id = $1 
         AND day_of_week = $2::day_of_week
         AND is_active = TRUE
         AND (
           (start_time <= $3 AND end_time > $3) OR
           (start_time < $4 AND end_time >= $4) OR
           (start_time >= $3 AND end_time <= $4)
         )`,
      [doctorId, dayOfWeek.toLowerCase(), startTime, endTime]
    );

    if (overlapCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Schedule overlaps with an existing schedule for this day.' });
    }

    const result = await query(
      `INSERT INTO schedules (clinic_id, doctor_id, day_of_week, start_time, end_time, slot_duration, fee)
       VALUES ($1, $2, $3::day_of_week, $4, $5, $6, $7) RETURNING *`,
      [clinicId, doctorId, dayOfWeek.toLowerCase(), startTime, endTime, slotDuration || 30, fee || 0.0]
    );

    return res.status(201).json({
      message: 'Schedule added successfully.',
      schedule: result.rows[0]
    });
  } catch (error) {
    console.error('Add schedule error:', error);
    return res.status(500).json({ message: 'Failed to add schedule.', error: error.message });
  }
};

export const getClinicSchedules = async (req, res) => {
  const { clinicId } = req.params;

  try {
    const result = await query(
      'SELECT * FROM schedules WHERE clinic_id = $1 AND is_active = TRUE ORDER BY day_of_week, start_time',
      [clinicId]
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get clinic schedules error:', error);
    return res.status(500).json({ message: 'Failed to retrieve clinic schedules.' });
  }
};
