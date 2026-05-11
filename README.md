# FitCore — Gym Management SaaS

A complete, production-ready gym management system built with Node.js, React, PostgreSQL, Redis, Razorpay, and Claude AI.

---

## Features

| Module | What it does |
|---|---|
| **Members** | Full CRUD, member codes, photo, status tracking |
| **Memberships** | Basic / Premium / Elite / Annual plans |
| **Billing** | Razorpay UPI/card/netbanking, auto-renewal mandates, GST invoices |
| **Classes** | Schedule, capacity, waitlist, auto session generation |
| **Attendance** | QR check-in, biometric, card, hourly analytics |
| **Trainers** | Profiles, specialties, performance, ratings |
| **Branches** | Multi-branch, per-branch scoping for staff |
| **Notifications** | WhatsApp + SMS (Twilio) + Email (SMTP) |
| **AI Insights** | Claude API — churn detection, revenue forecast, schedule optimisation |
| **Cron Jobs** | Expiry reminders, auto-expire, re-engagement, auto-renewal |

---

## Tech Stack

```
Backend   Node.js + Express + PostgreSQL + Redis
Frontend  React 18 + React Router + React Query + Recharts + Tailwind CSS
Payments  Razorpay (UPI, cards, e-mandates, webhooks)
Notify    Twilio WhatsApp + SMS · Nodemailer SMTP
AI        Anthropic Claude API (insights + AI assistant)
Infra     Docker Compose · Nginx · Node-cron
Invoices  PDFKit (GST-compliant, HSN 999312)
```

---

## Quick Start (Docker)

```bash
# 1. Clone and enter project
git clone https://github.com/yourorg/fitcore.git
cd fitcore

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your keys

# 3. Start everything
docker-compose up --build

# App runs at:
#   Frontend  → http://localhost:3000
#   Backend   → http://localhost:5000
#   DB        → localhost:5432
```

---

## Manual Setup (Development)

### Backend
```bash
cd backend
npm install

# Set up PostgreSQL database
createdb fitcore
psql fitcore < src/utils/schema.sql

# Copy and fill env
cp .env.example .env

# Start
npm run dev    # development (nodemon)
npm start      # production
```

### Frontend
```bash
cd frontend
npm install

# Set API URL
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

npm start      # development
npm run build  # production build
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/fitcore

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_secret_key_min_32_chars

# Razorpay (get from razorpay.com/dashboard)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_secret

# Twilio (get from twilio.com/console)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_SMS_FROM=+1234567890

# Email (Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourgym.in
SMTP_PASS=your_app_password

# Claude AI
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login → JWT token |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/change-password` | Change password |
| POST | `/api/auth/users` | Create staff user (admin only) |

### Members
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/members` | List (paginated, searchable, filterable) |
| GET | `/api/members/:id` | Get member + attendance history |
| POST | `/api/members` | Create member |
| PUT | `/api/members/:id` | Update member |
| GET | `/api/members/:id/renewal-info` | Renewal data + available plans |
| POST | `/api/members/:id/renew/initiate` | Create Razorpay order |
| POST | `/api/members/:id/renew/complete` | Verify + activate renewal |

### Attendance
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/attendance/qr/:member_id` | Generate QR code |
| POST | `/api/attendance/checkin` | Process QR check-in (kiosk) |
| PUT | `/api/attendance/checkout/:id` | Record check-out |
| GET | `/api/attendance` | Logs (filterable by date/branch) |
| GET | `/api/attendance/today` | Today's stats + hourly breakdown |

### Billing
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/billing` | Transaction list |
| GET | `/api/billing/stats` | Revenue stats + monthly chart |
| GET | `/api/billing/:id/invoice` | Download PDF invoice |

### AI
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ai/insights` | Claude-powered insights |
| POST | `/api/ai/ask` | Streaming AI Q&A |

---

## Automated Cron Jobs

| Time | Job |
|---|---|
| 7:00 AM | Process Razorpay auto-renewal mandates |
| 9:00 AM | Send expiry reminders (7d, 3d, 1d before) |
| 10:00 AM | Re-engagement WhatsApp for 21-day inactive members |
| 8:00 PM | Mark expired memberships |
| Sunday midnight | Generate next week's class sessions |

---

## Folder Structure

```
fitcore/
├── backend/
│   ├── src/
│   │   ├── config/        # DB + Redis connections
│   │   ├── controllers/   # Business logic
│   │   ├── middleware/     # Auth, error handling
│   │   ├── routes/        # Express routers
│   │   ├── services/      # Notifications, invoices, cron
│   │   └── utils/         # Helpers, schema.sql
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout, shared UI
│   │   ├── pages/         # One file per route
│   │   ├── store/         # Zustand global state
│   │   └── utils/         # Axios API client
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Default Login

After running the schema seed:

```
Email:    admin@fitcore.in
Password: admin123
Role:     super_admin
```

---

## Production Checklist

- [ ] Change all `.env` secrets
- [ ] Enable HTTPS (use Certbot + Nginx)
- [ ] Set `NODE_ENV=production`
- [ ] Configure S3 for invoice PDF storage
- [ ] Set up Razorpay webhook URL: `https://yourdomain.com/webhooks/razorpay`
- [ ] Whitelist Twilio WhatsApp sender
- [ ] Add DB backups (pg_dump cron)
- [ ] Set up monitoring (e.g. UptimeRobot)

---

Built with ❤️ for gym owners across India.
