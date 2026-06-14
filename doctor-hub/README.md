# 🏥 Doctor Hub

A production-style **healthcare consultation and patient history management system** where patients can search doctors, book appointments, share medical histories, and receive prescriptions — all within a secure, role-based platform.
[
**Live Demo:** [https://doctor-hub-frontend.vercel.app](https://doctor-hub-x3vv.vercel.app/)  

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [Installation & Setup](#-installation--setup)
5. [Environment Variables](#-environment-variables)
6. [Database Setup](#-database-setup)
7. [Running the Project](#-running-the-project)
8. [Test Credentials](#-test-credentials)
9. [API Documentation](#-api-documentation)
10. [Project Structure](#-project-structure)
11. [UI Design System](#-ui-design-system)
12. [Deployment](#-deployment)
13. [Contributing](#-contributing)
14. [License](#-license)
15. [Contact](#-contact)

---

## 🎯 Overview

**Doctor Hub** is a semester project demonstrating a complete healthcare platform with:

- **Doctor Search & Filtering** by disease and treatment type (Allopathic, Homeopathic, Herbal)
- **Secure Appointment Booking** with full workflow (pending → payment upload → verification → confirmed)
- **Payment Verification System** via screenshot upload
- **Immutable Medical History** (write-once, never editable)
- **Immutable Prescriptions** with full audit trail
- **Role-Based Access Control (RBAC)** with 5 distinct user roles
- **Clinic & Schedule Management** for doctors
- **Doctor Assistant Management** for payment verification
- **Patient–Doctor Communication** within appointments
- **Production-ready security** (JWT, bcrypt, parameterized queries)

---

## ✨ Features

### For Patients
- ✅ Search doctors by name, specialization, or disease
- ✅ Filter by treatment type (Allopathic/Homeopathic/Herbal)
- ✅ View doctor profiles and available time slots
- ✅ Book appointments with automatic token generation
- ✅ Upload payment screenshots (JazzCash, Easypaisa, Bank Transfer, etc.)
- ✅ View appointment status in real-time
- ✅ Access complete medical history (immutable, secure)
- ✅ View prescriptions issued by doctors
- ✅ Message doctors within appointment threads
- ✅ Leave reviews and ratings for doctors

### For Doctors
- ✅ Register and create detailed profile (PMDC number, specialization, fees)
- ✅ Add multiple clinics with addresses and contact info
- ✅ Set schedules per clinic (days, times, slot duration, fees)
- ✅ View appointments and patient histories
- ✅ Add new medical history records for patients
- ✅ Issue prescriptions with medicines and dosages
- ✅ Manage assistants
- ✅ Track patient communication

### For Assistants
- ✅ Login under assigned doctor's account
- ✅ Verify/reject payment screenshots
- ✅ Confirm or reject bookings
- ✅ Manage appointment statuses

### For Admins
- ✅ Approve/reject new doctor registrations
- ✅ Suspend or delete user accounts
- ✅ View system-wide appointments and users
- ✅ Analytics and reports

### For Super Admins
- ✅ Full system control
- ✅ Manage all users including admins
- ✅ System configuration and settings

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js + Vite + Tailwind CSS |
| **Backend** | Node.js + Express.js |
| **Database** | PostgreSQL (Supabase) |
| **Authentication** | JWT + bcryptjs |
| **File Uploads** | Multer + Local Storage (or Cloudinary) |
| **Deployment** | Vercel (frontend) + Render (backend) |
| **ORM** | pg (node-postgres) |
| **API Testing** | Postman |

---

## 📦 Installation & Setup

### Prerequisites
- Node.js v18+ and npm
- Git
- PostgreSQL (or Supabase account — recommended)
- Vercel account (for frontend deployment)
- Render account (for backend deployment)

### Clone Repository

```bash
git clone https://github.com/yourusername/doctor-hub.git
cd doctor-hub
```

### Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file (see Section 5)
cp .env.example .env

# Initialize database with tables and seed data
npm run db:init

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend folder (from project root)
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update VITE_API_URL to your backend URL
# For local: http://localhost:5000
# For production: https://your-backend-url.onrender.com

# Start development server
npm run dev
```

---

## 🔐 Environment Variables

### Backend `.env`

```dotenv
# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=doctor_hub_secret_key_2026

# Database (Supabase or local PostgreSQL)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require

# File uploads (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend `.env`

```dotenv
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Doctor Hub
```

---

## 🗄️ Database Setup

### Option 1: Supabase (Recommended for Deployment)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** → click **New Query**
4. Paste the contents of `backend/database/schema.sql` (or the full SQL script provided)
5. Run the query
6. Copy your database connection string from **Settings → Database**
7. Add to `.env`: `DATABASE_URL=your_connection_string`

### Option 2: Local PostgreSQL

```bash
# Create database
createdb doctor_hub

# Connect and run schema
psql -U postgres -d doctor_hub < backend/database/schema.sql

# Update .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/doctor_hub
```

### Initialize Seed Data

```bash
cd backend
npm run db:init
```

This will:
- Create all tables with proper FK constraints
- Create ENUMS (roles, statuses, etc.)
- Add triggers for auto `updated_at` and doctor rating refresh
- Insert dummy users (super admin, admin, doctor, patient)
- Create seed clinics and schedules

---

## 🚀 Running the Project

### Development

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### Production

**Backend Deployment:**
```bash
# Push to Render or similar
git push heroku main
# Or use Render's GitHub integration
```

**Frontend Deployment:**
```bash
# Vercel auto-deploys on push to main
git push origin main
```

---

## 👥 Test Credentials

Use these dummy accounts to test the platform. **All passwords are shown below for testing only** — in production, users reset via "Forgot Password".

### Super Admin
- **Email:** `superadmin@doctorhub.com`
- **Password:** `Admin@1234`
- **Role:** Full system control, manage all users

### System Admin
- **Email:** `admin@doctorhub.com`
- **Password:** `Admin@1234`
- **Role:** Manage doctors and users, approve registrations

### Doctor
- **Email:** `dr.ahmed@doctorhub.com`
- **Password:** `Doctor@1234`
- **Role:** General Physician, Allopathic treatment
- **PMDC:** PMDC-12345
- **Clinic:** City Care Clinic, Karachi
- **Fee:** PKR 800

### Patient
- **Email:** `ali.hassan@gmail.com`
- **Password:** `Patient@1234`
- **Role:** Can book appointments, manage health records
- **Blood Group:** O+
- **Known Allergies:** Penicillin

### Assistant (to be created via doctor dashboard)
- Linked to Dr. Ahmed's account
- Can verify payments and confirm bookings

---

### How to Create More Test Users

1. Login as **Super Admin** or **System Admin**
2. Go to **Admin Dashboard → Manage Users**
3. Click **Add User** and fill in details
4. Assign role and status
5. System generates a temporary password (sent via email in production; shown in console in dev)

---

## 📡 API Documentation

### Base URL
- **Development:** `http://localhost:5000`
- **Production:** `https://doctor-hub-backend.onrender.com`

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login and get JWT |
| POST | `/api/auth/forgot-password` | No | Request password reset |
| POST | `/api/auth/reset-password` | No | Reset password with token |

### Doctor Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/doctors` | Optional | List/search all doctors |
| GET | `/api/doctors/:id` | Optional | Get doctor profile |
| POST | `/api/doctors/profile` | Doctor | Create doctor profile |
| PUT | `/api/doctors/profile` | Doctor | Update doctor profile |
| GET | `/api/doctors/:id/clinics` | Any | Get doctor's clinics |

### Appointment Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/appointments` | Patient | Book appointment |
| GET | `/api/appointments` | Patient/Doctor | List appointments |
| GET | `/api/appointments/:id` | Auth | Get appointment details |
| PUT | `/api/appointments/:id/cancel` | Patient | Cancel appointment |
| PUT | `/api/appointments/:id/confirm` | Assistant | Confirm appointment |

### Payment Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/payments` | Patient | Upload payment screenshot |
| GET | `/api/payments/:appointmentId` | Assistant | Get payment |
| PUT | `/api/payments/:id/verify` | Assistant | Verify payment |
| PUT | `/api/payments/:id/reject` | Assistant | Reject payment |

### Medical History Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/history` | Patient | Get own history |
| GET | `/api/history/:patientId` | Doctor | Get patient history |
| POST | `/api/history` | Doctor | Add history record |

### Prescription Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/prescriptions` | Doctor | Add prescription |
| GET | `/api/prescriptions/:appointmentId` | Auth | View prescription |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/doctors` | Admin | List all doctors |
| PUT | `/api/admin/doctors/:id/approve` | Admin | Approve doctor |
| DELETE | `/api/admin/users/:id` | Super Admin | Delete user |

---

## 📁 Project Structure

```
doctor-hub/
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API calls (fetch, axios)
│   │   ├── context/             # React Context for auth, user state
│   │   ├── styles/              # Global CSS
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── backend/
│   ├── controllers/             # Route handlers
│   ├── routes/                  # API routes
│   ├── middleware/              # Auth, validation, error handling
│   ├── config/                  # Database connection
│   ├── database/
│   │   └── schema.sql           # Full DB schema
│   ├── scripts/
│   │   └── init-db.js           # DB initialization script
│   ├── server.js                # Express app entry
│   ├── package.json
│   └── .env.example
│
├── docs/
│   ├── DoctorHub_Requirements_Guide.md
│   ├── DoctorHub_Database.sql
│   └── DoctorHub_UI_Redesign_Prompt.md
│
└── README.md (this file)
```

---

## 🎨 UI Design System

The frontend uses a **"Token & File" design system** inspired by clinic artifacts:

- **Color Palette:** Deep teal-green (#23534A), warm paper white (#F5F6F3), clinical accents
- **Typography:** Space Grotesk (display), Source Sans 3 (body), IBM Plex Mono (data/codes)
- **Signature Element:** Ink stamps for all status indicators (VERIFIED, CONFIRMED, LOCKED, etc.)
- **Components:** Token-stub cards (appointments), file-tab navigation, prescription pad layout

See `/docs/DoctorHub_UI_Redesign_Prompt.md` for the full design specification.

---

## 🚢 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) and connect your GitHub repo
3. Set environment variables in **Settings → Environment Variables**
4. Vercel auto-deploys on every push to `main`

**Live Link:** `https://doctor-hub-frontend.vercel.app`

### Backend (Render)

1. Go to [render.com](https://render.com)
2. Create a **New Web Service**, connect your GitHub repo
3. Set environment variables, including `DATABASE_URL` (Supabase connection string)
4. Render auto-deploys on push to `main`

**Live Link:** `https://doctor-hub-backend.onrender.com`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Use ES6+ syntax
- Follow consistent naming conventions
- Write meaningful commit messages
- Add comments for complex logic
- Test API endpoints with Postman before submitting PR

---

## 📋 Project Requirements Checklist

This project fulfills all semester requirements:

- ✅ **Architecture Design** — Full 3-tier architecture (frontend/backend/database)
- ✅ **Database Design** — 13 normalized PostgreSQL tables with constraints, triggers, views
- ✅ **Authentication & RBAC** — JWT-based auth with 5 distinct roles and permission checks
- ✅ **Workflow Logic** — Full appointment lifecycle, payment verification, immutable records
- ✅ **API & Backend** — RESTful Express API with 30+ endpoints
- ✅ **Frontend UX** — React UI with modern design system
- ✅ **Analytics & Reports** — Admin dashboards with doctor ratings, appointment trends
- ✅ **Code Quality** — Clean, modular, documented code
- ✅ **Deployment** — Live on Vercel + Render, production-ready
- ✅ **Documentation** — Comprehensive README, API docs, design system

---

## 📚 Additional Documentation

All documentation files are in `/docs/`:

| Document | Description |
|---|---|
| `DoctorHub_Requirements_Guide.md` | Full project requirements, modules, and specifications |
| `DoctorHub_Database.sql` | Complete database schema with seed data |
| `DoctorHub_UI_Redesign_Prompt.md` | UI design system and implementation prompt |

---

## 🐛 Troubleshooting

### Database Connection Error: `password authentication failed`
**Solution:** Reset your Supabase password in **Settings → Database → Reset Database Password** and update `.env`

### Frontend Can't Reach Backend: `CORS` or `404 errors`
**Solution:** Ensure `VITE_API_URL` in frontend `.env` matches your backend URL (local or production)

### `npm run db:init` fails
**Solution:** 
1. Check DATABASE_URL in `.env` is correct
2. Verify Supabase/PostgreSQL is running
3. Ensure `psql` client is installed (`psql --version`)
4. Run `npm install pg` in backend folder

### Port 5000 already in use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

---

## 📄 License

This project is licensed under the **MIT License** — see `LICENSE` file for details.

This is a semester project for educational purposes. Feel free to use as a reference or starting point for your own healthcare platform.

---

## 👨‍💻 Author

**Your Name**  
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

---

## 🎓 Semester Project Details

- **University:** [Your University]
- **Course:** [Course Name & Code]
- **Instructor:** [Instructor Name]
- **Submitted:** June 2026
- **Marks Distribution:** See requirements guide

---

## 🙏 Acknowledgments

- Supabase for free PostgreSQL hosting
- Vercel for frontend deployment
- Render for backend hosting
- React, Express, PostgreSQL communities
- Design inspiration from real clinic workflows

---

## 🔄 Future Enhancements

- [ ] AI disease prediction (symptom → doctor suggestion)
- [ ] Video consultation integration
- [ ] WhatsApp notification API
- [ ] E-prescription PDF generation
- [ ] Mobile app (React Native)
- [ ] Doctor ratings & reviews
- [ ] Prescription refill reminders
- [ ] Appointment calendar sync (Google Calendar, Outlook)
- [ ] Multi-language support (Urdu, English)
- [ ] SMS notifications

---
