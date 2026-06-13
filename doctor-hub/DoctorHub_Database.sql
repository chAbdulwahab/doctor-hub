-- ============================================================
-- DOCTOR HUB - COMPLETE DATABASE SCRIPT
-- Database: PostgreSQL (compatible with MySQL with minor changes)
-- Description: Full schema for Doctor Hub healthcare platform
-- ============================================================

-- Drop tables in reverse order to avoid FK conflicts
DROP TABLE IF EXISTS doctor_reviews CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS prescription_items CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS medical_history CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS clinics CASCADE;
DROP TABLE IF EXISTS assistants CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- ENUMS
-- ============================================================

DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'assistant', 'admin', 'super_admin');

DROP TYPE IF EXISTS treatment_type CASCADE;
CREATE TYPE treatment_type AS ENUM ('allopathic', 'homeopathic', 'herbal');

DROP TYPE IF EXISTS appointment_status CASCADE;
CREATE TYPE appointment_status AS ENUM (
    'pending',
    'payment_uploaded',
    'payment_verified',
    'confirmed',
    'completed',
    'cancelled',
    'rejected'
);

DROP TYPE IF EXISTS payment_status CASCADE;
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected');

DROP TYPE IF EXISTS day_of_week CASCADE;
CREATE TYPE day_of_week AS ENUM (
    'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday'
);

DROP TYPE IF EXISTS doctor_status CASCADE;
CREATE TYPE doctor_status AS ENUM ('pending_approval', 'active', 'suspended', 'rejected');

-- ============================================================
-- TABLE 1: USERS
-- Central authentication table for all roles
-- ============================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(100)        NOT NULL,
    email           VARCHAR(150)        UNIQUE NOT NULL,
    phone           VARCHAR(20)         UNIQUE,
    password_hash   TEXT                NOT NULL,          -- bcrypt hash
    role            user_role           NOT NULL DEFAULT 'patient',
    profile_image   TEXT,                                   -- URL to profile image
    is_active       BOOLEAN             NOT NULL DEFAULT TRUE,
    is_verified     BOOLEAN             NOT NULL DEFAULT FALSE,
    reset_token     VARCHAR(255),                           -- for forgot password
    reset_token_expiry TIMESTAMP,
    created_at      TIMESTAMP           NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP           NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups (login)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ============================================================
-- TABLE 2: DOCTORS
-- Extended profile for users with role = 'doctor'
-- ============================================================
CREATE TABLE doctors (
    id                  SERIAL PRIMARY KEY,
    user_id             INT             NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    pmdc_number         VARCHAR(50)     UNIQUE,             -- Pakistan Medical & Dental Council reg no
    specialization      VARCHAR(150)    NOT NULL,           -- e.g., "Cardiologist", "General Physician"
    treatment_type      treatment_type  NOT NULL,
    diseases_treated    TEXT[],                             -- Array: ['diabetes','hypertension']
    experience_years    INT             DEFAULT 0,
    bio                 TEXT,
    consultation_fee    DECIMAL(10,2)   DEFAULT 0.00,
    status              doctor_status   NOT NULL DEFAULT 'pending_approval',
    rating              DECIMAL(3,2)    DEFAULT 0.00,       -- Average rating out of 5
    total_reviews       INT             DEFAULT 0,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctors_user_id         ON doctors(user_id);
CREATE INDEX idx_doctors_specialization  ON doctors(specialization);
CREATE INDEX idx_doctors_treatment_type  ON doctors(treatment_type);
CREATE INDEX idx_doctors_status          ON doctors(status);

-- ============================================================
-- TABLE 3: PATIENTS
-- Extended profile for users with role = 'patient'
-- ============================================================
CREATE TABLE patients (
    id              SERIAL PRIMARY KEY,
    user_id         INT             NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth   DATE,
    gender          VARCHAR(10)     CHECK (gender IN ('male', 'female', 'other')),
    blood_group     VARCHAR(5),                             -- A+, B-, O+, AB+, etc.
    allergies       TEXT[],                                 -- Known allergies
    chronic_diseases TEXT[],                                -- e.g., ['diabetes','asthma']
    emergency_contact_name  VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_user_id ON patients(user_id);

-- ============================================================
-- TABLE 4: ASSISTANTS
-- Doctor's assistants — linked to a specific doctor
-- ============================================================
CREATE TABLE assistants (
    id              SERIAL PRIMARY KEY,
    user_id         INT             NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    doctor_id       INT             NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assistants_user_id   ON assistants(user_id);
CREATE INDEX idx_assistants_doctor_id ON assistants(doctor_id);

-- ============================================================
-- TABLE 5: CLINICS
-- A doctor can have multiple clinic locations
-- ============================================================
CREATE TABLE clinics (
    id              SERIAL PRIMARY KEY,
    doctor_id       INT             NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    clinic_name     VARCHAR(150)    NOT NULL,
    address         TEXT            NOT NULL,
    city            VARCHAR(100)    NOT NULL,
    province        VARCHAR(100),
    contact_phone   VARCHAR(20),
    map_link        TEXT,                                   -- Google Maps URL (optional)
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clinics_doctor_id ON clinics(doctor_id);
CREATE INDEX idx_clinics_city      ON clinics(city);

-- ============================================================
-- TABLE 6: SCHEDULES
-- Available time slots per clinic per day
-- ============================================================
CREATE TABLE schedules (
    id              SERIAL PRIMARY KEY,
    clinic_id       INT             NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id       INT             NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week     day_of_week     NOT NULL,
    start_time      TIME            NOT NULL,               -- e.g., 09:00
    end_time        TIME            NOT NULL,               -- e.g., 17:00
    slot_duration   INT             NOT NULL DEFAULT 30,    -- minutes per appointment
    fee             DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    -- A doctor cannot have two overlapping schedules at the same clinic on the same day
    CONSTRAINT chk_schedule_times CHECK (end_time > start_time)
);

CREATE INDEX idx_schedules_clinic_id  ON schedules(clinic_id);
CREATE INDEX idx_schedules_doctor_id  ON schedules(doctor_id);
CREATE INDEX idx_schedules_day        ON schedules(day_of_week);

-- ============================================================
-- TABLE 7: APPOINTMENTS
-- Core booking record
-- ============================================================
CREATE TABLE appointments (
    id                  SERIAL PRIMARY KEY,
    patient_id          INT                 NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id           INT                 NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    clinic_id           INT                 NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
    schedule_id         INT                 REFERENCES schedules(id) ON DELETE SET NULL,
    appointment_date    DATE                NOT NULL,
    appointment_time    TIME                NOT NULL,
    status              appointment_status  NOT NULL DEFAULT 'pending',
    reason_for_visit    TEXT,                               -- Patient's complaint/reason
    notes               TEXT,                               -- Doctor notes after visit
    cancelled_by        INT                 REFERENCES users(id),    -- who cancelled
    cancellation_reason TEXT,
    confirmed_by        INT                 REFERENCES users(id),    -- assistant who confirmed
    confirmed_at        TIMESTAMP,
    completed_at        TIMESTAMP,
    created_at          TIMESTAMP           NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP           NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient_id       ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id        ON appointments(doctor_id);
CREATE INDEX idx_appointments_clinic_id        ON appointments(clinic_id);
CREATE INDEX idx_appointments_status           ON appointments(status);
CREATE INDEX idx_appointments_appointment_date ON appointments(appointment_date);

-- Prevent double-booking: same doctor, same date, same time
CREATE UNIQUE INDEX idx_appointments_no_double_book
    ON appointments(doctor_id, appointment_date, appointment_time)
    WHERE status NOT IN ('cancelled', 'rejected');

-- ============================================================
-- TABLE 8: PAYMENTS
-- Payment screenshot upload and verification
-- ============================================================
CREATE TABLE payments (
    id                  SERIAL PRIMARY KEY,
    appointment_id      INT             NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE RESTRICT,
    patient_id          INT             NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    amount              DECIMAL(10,2)   NOT NULL,
    payment_method      VARCHAR(50),                        -- JazzCash, Easypaisa, Bank Transfer, Cash
    screenshot_url      TEXT            NOT NULL,           -- URL to uploaded screenshot image
    status              payment_status  NOT NULL DEFAULT 'pending',
    verified_by         INT             REFERENCES users(id),   -- assistant who verified
    verified_at         TIMESTAMP,
    rejection_reason    TEXT,                               -- if rejected, why
    transaction_ref     VARCHAR(100),                       -- optional transaction ID from screenshot
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX idx_payments_patient_id     ON payments(patient_id);
CREATE INDEX idx_payments_status         ON payments(status);

-- ============================================================
-- TABLE 9: MEDICAL HISTORY
-- IMMUTABLE: records can only be added, never edited or deleted
-- ============================================================
CREATE TABLE medical_history (
    id                  SERIAL PRIMARY KEY,
    patient_id          INT             NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id           INT             NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    appointment_id      INT             REFERENCES appointments(id) ON DELETE SET NULL,
    visit_date          DATE            NOT NULL DEFAULT CURRENT_DATE,
    chief_complaint     TEXT,                               -- Reason for visit
    diagnosis           TEXT            NOT NULL,
    symptoms            TEXT[],                             -- List of symptoms
    vital_signs         JSONB,                              -- { bp, pulse, temp, weight, height }
    lab_results         TEXT,                               -- Summary of any lab work
    treatment_given     TEXT,
    follow_up_date      DATE,
    doctor_notes        TEXT,
    attachments         TEXT[],                             -- URLs to uploaded reports/images
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
    -- NOTE: No updated_at — this record is write-once (immutable)
);

CREATE INDEX idx_medical_history_patient_id     ON medical_history(patient_id);
CREATE INDEX idx_medical_history_doctor_id      ON medical_history(doctor_id);
CREATE INDEX idx_medical_history_appointment_id ON medical_history(appointment_id);
CREATE INDEX idx_medical_history_visit_date     ON medical_history(visit_date);

-- ============================================================
-- TABLE 10: PRESCRIPTIONS
-- IMMUTABLE: linked to an appointment, cannot be edited
-- ============================================================
CREATE TABLE prescriptions (
    id                  SERIAL PRIMARY KEY,
    appointment_id      INT             NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
    patient_id          INT             NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id           INT             NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    prescription_date   DATE            NOT NULL DEFAULT CURRENT_DATE,
    diagnosis           TEXT,
    general_notes       TEXT,                               -- Doctor's overall advice
    follow_up_in_days   INT,                                -- e.g., "come back in 7 days"
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
    -- NOTE: No updated_at — prescriptions are immutable once saved
);

CREATE INDEX idx_prescriptions_appointment_id ON prescriptions(appointment_id);
CREATE INDEX idx_prescriptions_patient_id     ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id      ON prescriptions(doctor_id);

-- ============================================================
-- TABLE 11: PRESCRIPTION ITEMS
-- Each medicine line item in a prescription
-- ============================================================
CREATE TABLE prescription_items (
    id                  SERIAL PRIMARY KEY,
    prescription_id     INT             NOT NULL REFERENCES prescriptions(id) ON DELETE RESTRICT,
    medicine_name       VARCHAR(200)    NOT NULL,
    dosage              VARCHAR(100)    NOT NULL,           -- e.g., "500mg"
    frequency           VARCHAR(100)    NOT NULL,           -- e.g., "Twice daily"
    duration            VARCHAR(100),                       -- e.g., "7 days"
    route               VARCHAR(50),                        -- oral, injection, topical, etc.
    instructions        TEXT,                               -- e.g., "Take after meals"
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescription_items_prescription_id ON prescription_items(prescription_id);

-- ============================================================
-- TABLE 12: MESSAGES
-- Patient-Doctor communication per appointment
-- ============================================================
CREATE TABLE messages (
    id              SERIAL PRIMARY KEY,
    appointment_id  INT             NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
    sender_id       INT             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    receiver_id     INT             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    message_text    TEXT            NOT NULL,
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
    -- NOTE: Messages are not editable or deletable (audit trail)
);

CREATE INDEX idx_messages_appointment_id ON messages(appointment_id);
CREATE INDEX idx_messages_sender_id      ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id    ON messages(receiver_id);
CREATE INDEX idx_messages_is_read        ON messages(is_read);

-- ============================================================
-- TABLE 13: DOCTOR REVIEWS (Bonus / Analytics)
-- Patient ratings for doctors
-- ============================================================
CREATE TABLE doctor_reviews (
    id              SERIAL PRIMARY KEY,
    patient_id      INT             NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id       INT             NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_id  INT             NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    rating          INT             NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text     TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    -- One review per appointment
    CONSTRAINT uq_review_per_appointment UNIQUE (patient_id, appointment_id)
);

CREATE INDEX idx_doctor_reviews_doctor_id ON doctor_reviews(doctor_id);
CREATE INDEX idx_doctor_reviews_patient_id ON doctor_reviews(patient_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables that have updated_at
CREATE TRIGGER trg_users_updated_at          BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_doctors_updated_at        BEFORE UPDATE ON doctors        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_patients_updated_at       BEFORE UPDATE ON patients       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_assistants_updated_at     BEFORE UPDATE ON assistants     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_clinics_updated_at        BEFORE UPDATE ON clinics        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_schedules_updated_at      BEFORE UPDATE ON schedules      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_appointments_updated_at   BEFORE UPDATE ON appointments   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_payments_updated_at       BEFORE UPDATE ON payments       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update doctor rating when a new review is added
CREATE OR REPLACE FUNCTION refresh_doctor_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE doctors
    SET
        rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM doctor_reviews WHERE doctor_id = NEW.doctor_id),
        total_reviews = (SELECT COUNT(*) FROM doctor_reviews WHERE doctor_id = NEW.doctor_id)
    WHERE id = NEW.doctor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_doctor_rating
AFTER INSERT OR UPDATE ON doctor_reviews
FOR EACH ROW EXECUTE FUNCTION refresh_doctor_rating();

-- ============================================================
-- SEED DATA — Roles & Sample Users
-- ============================================================

-- Super Admin
INSERT INTO users (full_name, email, phone, password_hash, role, is_active, is_verified)
VALUES (
    'Super Admin',
    'superadmin@doctorhub.com',
    '+923000000001',
    '$2b$12$examplehashedpassword001',   -- Replace with actual bcrypt hash of 'Admin@1234'
    'super_admin',
    TRUE,
    TRUE
);

-- Admin
INSERT INTO users (full_name, email, phone, password_hash, role, is_active, is_verified)
VALUES (
    'System Admin',
    'admin@doctorhub.com',
    '+923000000002',
    '$2b$12$examplehashedpassword002',
    'admin',
    TRUE,
    TRUE
);

-- Sample Doctor User
INSERT INTO users (full_name, email, phone, password_hash, role, is_active, is_verified)
VALUES (
    'Dr. Ahmed Raza',
    'dr.ahmed@doctorhub.com',
    '+923001234567',
    '$2b$12$examplehashedpassword003',
    'doctor',
    TRUE,
    TRUE
);

-- Sample Doctor Profile
INSERT INTO doctors (user_id, pmdc_number, specialization, treatment_type, diseases_treated, experience_years, bio, consultation_fee, status)
VALUES (
    3,                          -- user_id of Dr. Ahmed
    'PMDC-12345',
    'General Physician',
    'allopathic',
    ARRAY['fever', 'diabetes', 'hypertension', 'cold', 'flu'],
    10,
    'Dr. Ahmed Raza is a general physician with 10 years of experience specializing in diabetes management.',
    800.00,
    'active'
);

-- Sample Patient User
INSERT INTO users (full_name, email, phone, password_hash, role, is_active, is_verified)
VALUES (
    'Ali Hassan',
    'ali.hassan@gmail.com',
    '+923109876543',
    '$2b$12$examplehashedpassword004',
    'patient',
    TRUE,
    TRUE
);

-- Sample Patient Profile
INSERT INTO patients (user_id, date_of_birth, gender, blood_group, allergies, chronic_diseases)
VALUES (
    4,                          -- user_id of Ali Hassan
    '1995-03-15',
    'male',
    'O+',
    ARRAY['penicillin'],
    ARRAY['hypertension']
);

-- Sample Clinic
INSERT INTO clinics (doctor_id, clinic_name, address, city, contact_phone, is_active)
VALUES (
    1,
    'City Care Clinic',
    'Plot 12, Block 5, Gulshan-e-Iqbal',
    'Karachi',
    '+922134567890',
    TRUE
);

-- Sample Schedule
INSERT INTO schedules (clinic_id, doctor_id, day_of_week, start_time, end_time, slot_duration, fee, is_active)
VALUES
    (1, 1, 'monday',    '09:00', '13:00', 30, 800.00, TRUE),
    (1, 1, 'wednesday', '09:00', '13:00', 30, 800.00, TRUE),
    (1, 1, 'friday',    '14:00', '18:00', 30, 800.00, TRUE);

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- View: Doctor public profile (for search/listing)
CREATE OR REPLACE VIEW vw_doctor_profiles AS
SELECT
    d.id                    AS doctor_id,
    u.full_name             AS doctor_name,
    u.profile_image,
    d.specialization,
    d.treatment_type,
    d.diseases_treated,
    d.experience_years,
    d.consultation_fee,
    d.rating,
    d.total_reviews,
    d.status
FROM doctors d
JOIN users u ON u.id = d.user_id
WHERE d.status = 'active' AND u.is_active = TRUE;

-- View: Appointments with full details
CREATE OR REPLACE VIEW vw_appointments_detail AS
SELECT
    a.id                    AS appointment_id,
    a.appointment_date,
    a.appointment_time,
    a.status                AS appointment_status,
    a.reason_for_visit,

    pu.full_name            AS patient_name,
    pu.email                AS patient_email,
    pat.id                  AS patient_id,

    du.full_name            AS doctor_name,
    doc.specialization,
    doc.treatment_type,
    doc.id                  AS doctor_id,
    doc.consultation_fee,

    c.clinic_name,
    c.city,

    p.status                AS payment_status,
    p.screenshot_url

FROM appointments a
JOIN patients pat ON pat.id = a.patient_id
JOIN users pu ON pu.id = pat.user_id
JOIN doctors doc ON doc.id = a.doctor_id
JOIN users du ON du.id = doc.user_id
JOIN clinics c ON c.id = a.clinic_id
LEFT JOIN payments p ON p.appointment_id = a.id;

-- View: Patient medical history with doctor info
CREATE OR REPLACE VIEW vw_patient_history AS
SELECT
    mh.id                   AS history_id,
    mh.visit_date,
    mh.chief_complaint,
    mh.diagnosis,
    mh.symptoms,
    mh.vital_signs,
    mh.treatment_given,
    mh.follow_up_date,
    mh.doctor_notes,
    mh.created_at,

    pu.full_name            AS patient_name,
    pat.id                  AS patient_id,

    du.full_name            AS doctor_name,
    doc.specialization

FROM medical_history mh
JOIN patients pat ON pat.id = mh.patient_id
JOIN users pu ON pu.id = pat.user_id
JOIN doctors doc ON doc.id = mh.doctor_id
JOIN users du ON du.id = doc.user_id;

-- ============================================================
-- SUMMARY OF TABLES CREATED
-- ============================================================
-- 1.  users                — all users (patient, doctor, assistant, admin, super_admin)
-- 2.  doctors              — doctor profiles, linked to users
-- 3.  patients             — patient profiles, linked to users
-- 4.  assistants           — doctor's assistants, linked to users + doctors
-- 5.  clinics              — clinic locations, linked to doctors
-- 6.  schedules            — available slots per clinic/day
-- 7.  appointments         — booking records with full status lifecycle
-- 8.  payments             — payment screenshot upload & verification
-- 9.  medical_history      — IMMUTABLE patient medical records
-- 10. prescriptions        — IMMUTABLE prescription headers per appointment
-- 11. prescription_items   — medicine line items per prescription
-- 12. messages             — patient-doctor communication per appointment
-- 13. doctor_reviews       — patient ratings for completed appointments
-- ============================================================
