// routes/auth.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');

r.post('/login', c.login);
r.get('/me', authenticate, c.getMe);
r.put('/change-password', authenticate, c.changePassword);
r.post('/users', authenticate, requireRole('super_admin'), c.createUser);

module.exports = r;
