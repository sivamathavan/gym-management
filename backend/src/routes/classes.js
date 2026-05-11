// routes/classes.js
const express = require('express');
const router = express.Router();
const cc = require('../controllers/classesController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', cc.getClasses);
router.post('/', requireRole('super_admin','branch_manager'), cc.createClass);
router.get('/sessions', cc.getSessionsForDate);
router.post('/bookings', cc.bookClass);
router.delete('/bookings/:id', cc.cancelBooking);

module.exports = router;
