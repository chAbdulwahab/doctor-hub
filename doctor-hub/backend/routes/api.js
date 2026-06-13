import { Router } from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as doctorController from '../controllers/doctorController.js';
import * as clinicController from '../controllers/clinicController.js';
import * as appointmentController from '../controllers/appointmentController.js';
import * as paymentController from '../controllers/paymentController.js';
import * as historyController from '../controllers/historyController.js';
import * as prescriptionController from '../controllers/prescriptionController.js';
import * as messageController from '../controllers/messageController.js';
import * as assistantController from '../controllers/assistantController.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// --- Authentication ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// --- Doctors ---
router.get('/doctors', doctorController.listDoctors);
router.get('/doctors/:id', doctorController.getDoctorById);
router.post('/doctors/profile', verifyToken, checkRole(['doctor']), doctorController.createDoctorProfile);
router.put('/doctors/profile', verifyToken, checkRole(['doctor']), doctorController.updateDoctorProfile);

// --- Clinics & Schedules ---
router.post('/clinics', verifyToken, checkRole(['doctor']), clinicController.addClinic);
router.get('/clinics/:doctorId', clinicController.getDoctorClinics);
router.post('/schedules', verifyToken, checkRole(['doctor']), clinicController.addSchedule);
router.get('/schedules/:clinicId', clinicController.getClinicSchedules);

// --- Appointments ---
router.post('/appointments', verifyToken, checkRole(['patient']), appointmentController.bookAppointment);
router.get('/appointments', verifyToken, appointmentController.listAppointments);
router.get('/appointments/:id', verifyToken, appointmentController.getAppointmentById);
router.put('/appointments/:id/cancel', verifyToken, appointmentController.cancelAppointment);

// --- Payments ---
router.post('/payments', verifyToken, checkRole(['patient']), paymentController.upload.single('screenshot'), paymentController.uploadPaymentScreenshot);
router.get('/payments/:appointmentId', verifyToken, paymentController.getPaymentDetailsByAppointment);
router.put('/payments/:id/verify', verifyToken, checkRole(['assistant', 'doctor']), paymentController.verifyPayment);
router.put('/payments/:id/reject', verifyToken, checkRole(['assistant', 'doctor']), paymentController.rejectPayment);

// --- Medical History ---
router.get('/history', verifyToken, checkRole(['patient']), historyController.getOwnHistory);
router.get('/history/:patientId', verifyToken, checkRole(['doctor', 'assistant', 'admin', 'super_admin']), historyController.getPatientHistory);
router.post('/history', verifyToken, checkRole(['doctor']), historyController.addHistoryRecord);

// --- Prescriptions ---
router.post('/prescriptions', verifyToken, checkRole(['doctor']), prescriptionController.addPrescription);
router.get('/prescriptions/:appointmentId', verifyToken, prescriptionController.getPrescriptionByAppointment);

// --- Communication ---
router.post('/messages', verifyToken, messageController.sendMessage);
router.get('/messages/:appointmentId', verifyToken, messageController.getMessagesByAppointment);

// --- Assistants (Doctor Scope) ---
router.post('/assistants', verifyToken, checkRole(['doctor']), assistantController.createAssistant);
router.get('/assistants', verifyToken, checkRole(['doctor']), assistantController.getMyAssistants);

// --- Admin & Super Admin ---
router.get('/admin/doctors', verifyToken, checkRole(['admin', 'super_admin']), adminController.listAllDoctors);
router.put('/admin/doctors/:id/approve', verifyToken, checkRole(['admin', 'super_admin']), adminController.approveDoctor);
router.get('/admin/users', verifyToken, checkRole(['admin', 'super_admin']), adminController.listAllUsers);
router.delete('/admin/users/:id', verifyToken, checkRole(['super_admin']), adminController.deleteUser);

export default router;
