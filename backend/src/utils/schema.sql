-- FitCore Complete Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- BRANCHES
-- ─────────────────────────────────────────────
CREATE TABLE branches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  address     TEXT,
  city        VARCHAR(50),
  phone       VARCHAR(20),
  email       VARCHAR(100),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- USERS (Admins, Managers, Reception, Trainers)
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('super_admin','branch_manager','reception','trainer')),
  branch_id     UUID REFERENCES branches(id) ON DELETE SET NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  last_login    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- MEMBERSHIP PLANS
-- ─────────────────────────────────────────────
CREATE TABLE membership_plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2) NOT NULL,
  duration_days   INTEGER NOT NULL,
  features        JSONB DEFAULT '[]',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- MEMBERS
-- ─────────────────────────────────────────────
CREATE TABLE members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_code       VARCHAR(20) UNIQUE NOT NULL,
  name              VARCHAR(100) NOT NULL,
  email             VARCHAR(100) UNIQUE,
  phone             VARCHAR(20) NOT NULL,
  date_of_birth     DATE,
  gender            VARCHAR(10),
  address           TEXT,
  emergency_contact VARCHAR(20),
  photo_url         VARCHAR(255),
  branch_id         UUID REFERENCES branches(id),
  plan_id           UUID REFERENCES membership_plans(id),
  membership_start  DATE,
  membership_end    DATE,
  status            VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','expired','suspended','cancelled')),
  auto_renewal      BOOLEAN DEFAULT FALSE,
  razorpay_cust_id  VARCHAR(100),
  mandate_id        VARCHAR(100),
  loyalty_points    INTEGER DEFAULT 0,
  total_visits      INTEGER DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TRAINERS
-- ─────────────────────────────────────────────
CREATE TABLE trainers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  branch_id     UUID REFERENCES branches(id),
  specialties   TEXT[],
  bio           TEXT,
  rating        NUMERIC(3,2) DEFAULT 0,
  total_classes INTEGER DEFAULT 0,
  is_available  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CLASSES
-- ─────────────────────────────────────────────
CREATE TABLE classes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  trainer_id   UUID REFERENCES trainers(id),
  branch_id    UUID REFERENCES branches(id),
  day_of_week  INTEGER[], -- 0=Sun, 1=Mon...
  start_time   TIME NOT NULL,
  duration_min INTEGER DEFAULT 60,
  capacity     INTEGER DEFAULT 20,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CLASS SESSIONS (Individual occurrences)
-- ─────────────────────────────────────────────
CREATE TABLE class_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id    UUID REFERENCES classes(id),
  session_date DATE NOT NULL,
  start_time  TIME NOT NULL,
  status      VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CLASS BOOKINGS
-- ─────────────────────────────────────────────
CREATE TABLE class_bookings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID REFERENCES class_sessions(id),
  member_id    UUID REFERENCES members(id),
  status       VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed','waitlisted','cancelled','attended')),
  booked_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, member_id)
);

-- ─────────────────────────────────────────────
-- ATTENDANCE
-- ─────────────────────────────────────────────
CREATE TABLE attendance (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id    UUID REFERENCES members(id),
  branch_id    UUID REFERENCES branches(id),
  check_in_at  TIMESTAMP DEFAULT NOW(),
  check_out_at TIMESTAMP,
  method       VARCHAR(20) DEFAULT 'qr' CHECK (method IN ('qr','biometric','card','manual')),
  notes        TEXT
);

-- ─────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id           UUID REFERENCES members(id),
  plan_id             UUID REFERENCES membership_plans(id),
  amount              NUMERIC(10,2) NOT NULL,
  discount            NUMERIC(10,2) DEFAULT 0,
  points_used         INTEGER DEFAULT 0,
  final_amount        NUMERIC(10,2) NOT NULL,
  method              VARCHAR(20) CHECK (method IN ('upi','card','netbanking','cash','auto_debit')),
  status              VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','captured','failed','refunded')),
  razorpay_order_id   VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  invoice_number      VARCHAR(50) UNIQUE,
  invoice_url         VARCHAR(255),
  notes               TEXT,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id   UUID REFERENCES members(id),
  type        VARCHAR(50) NOT NULL,
  channel     VARCHAR(20) CHECK (channel IN ('whatsapp','sms','email','push')),
  subject     VARCHAR(255),
  body        TEXT,
  status      VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  sent_at     TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_branch ON members(branch_id);
CREATE INDEX idx_members_expiry ON members(membership_end);
CREATE INDEX idx_attendance_member ON attendance(member_id);
CREATE INDEX idx_attendance_date ON attendance(check_in_at);
CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_class_sessions_date ON class_sessions(session_date);
CREATE INDEX idx_bookings_member ON class_bookings(member_id);

-- ─────────────────────────────────────────────
-- SEED: Default branch and plans
-- ─────────────────────────────────────────────
INSERT INTO branches (name, address, city, phone) VALUES
  ('Anna Nagar', '42 Anna Main Road, Anna Nagar', 'Chennai', '+91 44 2345 6789'),
  ('T. Nagar', '15 Usman Road, T. Nagar', 'Chennai', '+91 44 2345 6790'),
  ('Adyar', '8 Gandhi Nagar, Adyar', 'Chennai', '+91 44 2345 6791');

INSERT INTO membership_plans (name, price, duration_days, features) VALUES
  ('Basic Monthly', 1200, 30, '["1 branch access","Group classes","Locker room"]'),
  ('Premium Monthly', 3000, 30, '["2 branch access","Group classes","1 PT session/month","Locker room","Towel service"]'),
  ('Elite Monthly', 6000, 30, '["All branches","Unlimited classes","4 PT sessions/month","Nutrition consult","Priority booking","Locker room","Towel service"]'),
  ('Elite Annual', 60000, 365, '["All branches","Unlimited classes","Unlimited PT","Nutrition consult","Priority booking","Guest passes 2x","Locker room","Towel service"]');
