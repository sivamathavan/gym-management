// ── routes/billing.js ────────────────────────
const express = require('express');
const router = express.Router();
const bc = require('../controllers/billingController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', bc.getPayments);
router.get('/stats', bc.getRevenueStats);
router.get('/:id/invoice', bc.downloadInvoice);
module.exports = router;
