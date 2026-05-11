// routes/dashboard.js
const { Router } = require('express');
const { authenticate, scopeBranch } = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboardController');
const r = Router();
r.get('/', authenticate, scopeBranch, getDashboard);
module.exports = r;
