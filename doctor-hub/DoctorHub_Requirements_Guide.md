# Doctor Hub — Full Project Requirements & Implementation Guide

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Technology Stack Recommendation](#2-technology-stack-recommendation)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Authentication System](#4-authentication-system)
5. [Core Modules](#5-core-modules)
   - 5.1 [Doctor Search & Filtering](#51-doctor-search--filtering)
   - 5.2 [Appointment Booking Workflow](#52-appointment-booking-workflow)
   - 5.3 [Payment Verification System](#53-payment-verification-system)
   - 5.4 [Medical History Management](#54-medical-history-management)
   - 5.5 [Prescription Management](#55-prescription-management)
   - 5.6 [Clinic & Schedule Management](#56-clinic--schedule-management)
   - 5.7 [Doctor Assistant Management](#57-doctor-assistant-management)
   - 5.8 [Patient–Doctor Communication](#58-patientdoctor-communication)
6. [REST API Specification](#6-rest-api-specification)
7. [Security Requirements](#7-security-requirements)
8. [Frontend UX Requirements](#8-frontend-ux-requirements)
9. [Database Schema Overview](#9-database-schema-overview)
10. [Future Enhancements](#10-future-enhancements)
11. [Marks Distribution Reference](#11-marks-distribution-reference)

---

## 1. Project Overview

**Doctor Hub** is a production-style healthcare consultation and patient history management platform. It allows patients to discover and consult doctors across three treatment types:

| Treatment Type | Description |
|---|---|
| Allopathic | Conventional / Western medicine |
| Homeopathic | Homeopathy-based treatment |
| Herbal | Natural / herbal medicine |

Patients can book appointments, upload payment proofs, share medical histories, and receive prescriptions — all within a secure, role-based system.

---

## 2. Technology Stack Recommendation

| Layer | Recommended Technology |
|---|---|
| Backend | Node.js + Express.js |
| Database | PostgreSQL (or MySQL) |
| Authentication | JWT (JSON Web Tokens) |
| Password Hashing | bcryptjs |
| File Uploads | Multer + Cloudinary (or local storage) |
| Frontend | React.js (or Next.js) |
| API Testing | Postman |
| ORM (optional) | Sequelize / Prisma |
| Deployment | Render / Railway / VPS |

---

## 3. User Roles & Permissions

The system implements **Role-Based Access Control (RBAC)** with five distinct roles:

### 3.1 Patient
- Register and log in
- Search doctors by name, disease, or treatment type
- Book appointments with doctors
- Upload payment screenshot for appointment confirmation
- View and share own medical history
- View prescriptions issued by doctors
- Cannot delete medical history or remove doctor prescriptions

### 3.2 Doctor
- Register and log in (admin approval may be required)
- Add and manage clinics
- Set available schedules (days/times)
- Add prescriptions to patient appointments
- Add new records to patient medical history
- Cannot edit previous prescriptions
- Manage assistants assigned to them

### 3.3 Assistant (Doctor's Assistant)
- Log in under a doctor's account scope
- Verify payment screenshots uploaded by patients
- Confirm or reject appointment bookings
- Manage booking statuses

### 3.4 Admin
- Manage doctor accounts (approve, suspend, delete)
- Manage patient accounts
- View system-wide appointments and reports

### 3.5 Super Admin
- Full system control
- Manage all users including admins
- Access all data and configurations
- System settings management

---

## 4. Authentication System

### 4.1 Endpoints
| Feature | Method | Endpoint |
|---|---|---|
| Register | POST | `/api/auth/register` |
| Login | POST | `/api/auth/login` |
| Forgot Password | POST | `/api/auth/forgot-password` |
| Reset Password | POST | `/api/auth/reset-password` |

### 4.2 JWT Flow
1. On login, server generates a signed JWT containing `user_id`, `role`, and `expiry`.
2. Client stores JWT in `localStorage` or `httpOnly` cookie.
3. Every protected request sends JWT in `Authorization: Bearer <token>` header.
4. Server validates JWT and extracts role before processing request.

### 4.3 Password Security
- Passwords hashed with **bcryptjs** (salt rounds: 10–12) before storing.
- Plain-text passwords never stored in the database.

### 4.4 Role-Based Middleware
```
authMiddleware → verifyToken → checkRole(['patient', 'doctor', ...]) → routeHandler
```

---

## 5. Core Modules

### 5.1 Doctor Search & Filtering

**Functionality:**
- Search doctors by name, specialization, disease, or treatment type.
- Filter by: Allopathic | Homeopathic | Herbal.
- Display doctor profiles: name, specialization, clinic, available slots, fee.

**Business Rules:**
- Only verified/active doctors appear in search results.
- Patients do not need to be logged in to browse doctors (optional).
- Booking requires authentication.

---

### 5.2 Appointment Booking Workflow

**Step-by-step Flow:**

```
Step 1: Patient searches for a doctor
Step 2: Patient filters by disease/treatment type
Step 3: Patient selects available time slot
Step 4: Patient books the appointment (status: PENDING)
Step 5: Patient uploads payment screenshot
Step 6: Assistant reviews and verifies payment
Step 7: Appointment status updated to CONFIRMED
Step 8: Patient and doctor notified
```

**Appointment Status Lifecycle:**
```
PENDING → PAYMENT_UPLOADED → VERIFIED → CONFIRMED → COMPLETED / CANCELLED
```

**Business Rules:**
- A patient cannot double-book the same slot.
- An appointment without payment verification stays `PENDING`.
- Only assistants or doctors can confirm appointments.
- Cancelled appointments are soft-deleted (status changed, not removed from DB).

---

### 5.3 Payment Verification System

**Functionality:**
- Patient uploads a screenshot/image of payment (bank transfer, JazzCash, Easypaisa, etc.).
- Image stored in file storage (Cloudinary or server disk).
- Assistant reviews uploaded image.
- Assistant marks payment as `VERIFIED` or `REJECTED`.
- On rejection, patient is notified and can re-upload.

**Business Rules:**
- Payment images are retained even after verification.
- One appointment = one payment record.
- Assistants cannot verify payments for doctors they are not assigned to.

---

### 5.4 Medical History Management

**Functionality:**
- Stores complete patient medical history across all visits.
- Each record is linked to a patient, doctor, and appointment.
- Doctors can add new entries after each consultation.
- Patients can view their full history.
- Patients can optionally share history with new doctors.

**Business Rules (STRICT):**
- Medical history **cannot be deleted** — ever.
- Doctors can **only add** new records, not edit or delete old ones.
- Patients **cannot remove** doctor-added records.
- History is read-only once saved.

---

### 5.5 Prescription Management

**Functionality:**
- Doctors issue prescriptions linked to an appointment.
- Prescription includes: medicine name, dosage, frequency, duration, notes.
- Patient views their prescriptions in their profile.

**Business Rules (STRICT):**
- Previous prescriptions **cannot be edited** after being saved.
- Patients **cannot delete** prescriptions.
- Only the issuing doctor can add a prescription (not assistants).
- Future enhancement: export as PDF.

---

### 5.6 Clinic & Schedule Management

**Functionality (Doctor):**
- Doctors can add multiple clinics (name, address, city, contact).
- For each clinic, doctors set their available schedules:
  - Day of week
  - Start time / End time
  - Slot duration (e.g., 30 minutes)
  - Fee per appointment

**Business Rules:**
- A doctor can have multiple clinics.
- Each clinic can have different schedules.
- Schedules determine what time slots patients can book.

---

### 5.7 Doctor Assistant Management

**Functionality:**
- A doctor can assign one or more assistants.
- Assistant accounts are created under the doctor's scope.
- Assistants are responsible for payment verification and booking confirmation.

**Business Rules:**
- Assistants are linked to a specific doctor.
- Assistants cannot perform medical actions (no prescriptions, no history edits).

---

### 5.8 Patient–Doctor Communication System

**Functionality:**
- Basic messaging between patient and doctor within an appointment context.
- Messages tied to an appointment thread.

**Business Rules:**
- Communication happens within confirmed appointments only.
- Messages are stored and cannot be deleted (audit trail).

---

## 6. REST API Specification

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login and get JWT |
| POST | `/api/auth/forgot-password` | No | Request password reset |
| POST | `/api/auth/reset-password` | No | Reset password with token |

### Doctors
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/doctors` | Optional | List/search doctors |
| GET | `/api/doctors/:id` | Optional | Get doctor profile |
| POST | `/api/doctors/profile` | Doctor | Create doctor profile |
| PUT | `/api/doctors/profile` | Doctor | Update doctor profile |

### Appointments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/appointments` | Patient | Book an appointment |
| GET | `/api/appointments` | Doctor/Patient | List appointments |
| GET | `/api/appointments/:id` | Auth | Get appointment details |
| PUT | `/api/appointments/:id/cancel` | Patient | Cancel appointment |
| PUT | `/api/appointments/:id/confirm` | Assistant | Confirm appointment |

### Payments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/payments` | Patient | Upload payment screenshot |
| GET | `/api/payments/:appointmentId` | Assistant | Get payment for appointment |
| PUT | `/api/payments/:id/verify` | Assistant | Verify payment |
| PUT | `/api/payments/:id/reject` | Assistant | Reject payment |

### Medical History
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/history` | Patient | Get own medical history |
| GET | `/api/history/:patientId` | Doctor | Get patient history |
| POST | `/api/history` | Doctor | Add new history record |

### Prescriptions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/prescriptions` | Doctor | Add prescription |
| GET | `/api/prescriptions/:appointmentId` | Auth | View prescription |

### Clinics & Schedules
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/clinics` | Doctor | Add clinic |
| GET | `/api/clinics/:doctorId` | Any | Get doctor's clinics |
| POST | `/api/schedules` | Doctor | Add schedule to clinic |
| GET | `/api/schedules/:clinicId` | Any | Get clinic schedules |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/doctors` | Admin | List all doctors |
| PUT | `/api/admin/doctors/:id/approve` | Admin | Approve doctor |
| GET | `/api/admin/users` | Admin | List all users |
| DELETE | `/api/admin/users/:id` | Super Admin | Delete user |

---

## 7. Security Requirements

| Feature | Implementation |
|---|---|
| Authentication | JWT (HS256, 24h expiry) |
| Password Storage | bcryptjs hash (never plain-text) |
| Input Validation | Express-validator / Joi middleware on all inputs |
| Route Protection | Auth middleware on all non-public routes |
| RBAC | Role check middleware per route |
| Medical Record Protection | No DELETE endpoints on history/prescriptions |
| File Upload Security | File type + size validation on payment screenshots |
| SQL Injection Prevention | Parameterized queries / ORM |
| CORS | Configured for allowed origins only |

---

## 8. Frontend UX Requirements

### Patient-Side Pages
- Home / Landing Page
- Doctor Search & Filter Page
- Doctor Profile Page
- Book Appointment Page
- Upload Payment Page
- My Appointments Page
- My Medical History Page
- My Prescriptions Page

### Doctor-Side Pages
- Doctor Dashboard
- Manage Clinics Page
- Manage Schedules Page
- Appointment List Page
- Write Prescription Page
- Patient History View Page
- Manage Assistants Page

### Assistant-Side Pages
- Assistant Dashboard
- Pending Payments Page
- Verify / Reject Payment Page
- Booking Confirmation Page

### Admin Pages
- Admin Dashboard
- Manage Doctors Page
- Manage Patients Page
- Reports / Analytics Page

---

## 9. Database Schema Overview

The system uses **10 core tables**. See the separate SQL script for full details.

| Table | Purpose |
|---|---|
| `users` | All users with roles |
| `doctors` | Doctor profiles and specializations |
| `patients` | Patient profiles |
| `assistants` | Assistants linked to doctors |
| `clinics` | Doctor clinic locations |
| `schedules` | Available time slots per clinic |
| `appointments` | Booking records with status lifecycle |
| `payments` | Payment screenshots and verification status |
| `medical_history` | Immutable patient medical records |
| `prescriptions` | Immutable prescriptions per appointment |
| `messages` | Patient–doctor communication per appointment |

---

## 10. Future Enhancements

| Feature | Description |
|---|---|
| AI Disease Prediction | Suggest doctors based on patient-entered symptoms |
| Video Consultation | Integrated video call within the platform |
| WhatsApp Notifications | Appointment reminders and status updates via WhatsApp API |
| E-Prescription PDF | Auto-generate downloadable PDF prescription |
| Analytics Dashboard | Appointment trends, doctor ratings, revenue reports |
| Mobile App | React Native patient and doctor apps |

---

## 11. Marks Distribution Reference

| Module | Marks |
|---|---|
| Architecture Design | 15 |
| Database Design | 15 |
| Authentication & RBAC | 10 |
| Workflow Logic | 15 |
| API & Backend | 10 |
| Frontend UX | 10 |
| Analytics & Reports | 10 |
| Code Quality | 5 |
| Deployment | 5 |
| Viva & Presentation | 5 |
| **Total** | **100** |

---

*Generated from Doctor Hub Final Semester Project Report*
