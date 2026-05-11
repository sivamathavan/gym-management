const { Router } = require('express');
const crypto = require('crypto');
const { query, queryOne, withTransaction } = require('../config/db');
const notificationService = require('../services/notificationService');
const invoiceService = require('../services/invoiceService');
const dayjs = require('dayjs');
const r = Router();

r.post('/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body).digest('hex');

  if (expected !== signature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const { event, payload } = req.body;

  if (event === 'payment.captured') {
    const payment = payload.payment.entity;
    const { member_id, plan_id, discount, points_used } = payment.notes || {};

    if (member_id) {
      await withTransaction(async (client) => {
        const member = await queryOne('SELECT * FROM members WHERE id = $1', [member_id]);
        const plan = await queryOne('SELECT * FROM membership_plans WHERE id = $1', [plan_id]);
        if (!member || !plan) return;

        const newEnd = dayjs(member.membership_end).isAfter(dayjs())
          ? dayjs(member.membership_end).add(plan.duration_days, 'day').format('YYYY-MM-DD')
          : dayjs().add(plan.duration_days, 'day').format('YYYY-MM-DD');

        const finalAmt = payment.amount / 100;

        await client.query(
          `UPDATE members SET plan_id=$1, membership_end=$2, status='active',
           loyalty_points = loyalty_points + $3, updated_at=NOW() WHERE id=$4`,
          [plan_id, newEnd, Math.floor(finalAmt / 100), member_id]
        );

        // Generate sequential invoice number
        const inv = await client.query(
          `SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number,'-',3) AS INTEGER)),0)+1 as next FROM payments`
        );
        const invoiceNumber = `INV-${dayjs().format('YYYY')}-${String(inv.rows[0].next).padStart(4,'0')}`;

        const pmtRow = await client.query(
          `INSERT INTO payments (member_id, plan_id, amount, discount, points_used,
            final_amount, method, status, razorpay_order_id, razorpay_payment_id, invoice_number)
           VALUES ($1,$2,$3,$4,$5,$6,'upi','captured',$7,$8,$9) RETURNING *`,
          [member_id, plan_id, plan.price, discount||0, points_used||0,
           finalAmt, payment.order_id, payment.id, invoiceNumber]
        );

        const invoiceUrl = await invoiceService.generate(pmtRow.rows[0], member, plan);
        await notificationService.sendRenewalConfirmation({ ...member, membership_end: newEnd }, pmtRow.rows[0], invoiceUrl);
      });
    }
  }

  if (event === 'payment.failed') {
    const payment = payload.payment.entity;
    const { member_id } = payment.notes || {};
    if (member_id) {
      const member = await queryOne('SELECT * FROM members WHERE id = $1', [member_id]);
      if (member) await notificationService.sendPaymentFailed(member, payment.amount / 100);
    }
  }

  res.json({ received: true });
});

module.exports = r;
