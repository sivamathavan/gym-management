// routes/attendance.js
const express = require('express');
const r1 = express.Router();
const ac = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');

r1.get('/qr/:member_id', authenticate, ac.generateQR);
r1.post('/checkin', ac.checkIn); // public endpoint for kiosk
r1.put('/checkout/:attendance_id', authenticate, ac.checkOut);
r1.get('/', authenticate, ac.getAttendance);
r1.get('/today', authenticate, ac.getTodayStats);
module.exports = r1;

// ---

// routes/classes.js (separate file in real project)
// routes/billing.js
// routes/dashboard.js
// routes/ai.js
// routes/branches.js
// routes/trainers.js
// routes/webhooks.js
// All follow same pattern — see controllers for logic
