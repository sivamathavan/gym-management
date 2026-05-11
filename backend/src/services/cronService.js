const cron = require('node-cron');
const { query } = require('../config/db');
const notificationService = require('./notificationService');
const dayjs = require('dayjs');

function startCronJobs() {
  // ── 9 AM daily: Expiry reminders ─────────────
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Running expiry reminders');
    const expiring = await query(
      `SELECT m.*, mp.name as plan_name
       FROM members m JOIN membership_plans mp ON m.plan_id = mp.id
       WHERE m.status = 'active'
         AND m.membership_end BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`
    );
    for (const member of expiring.rows) {
      const daysLeft = dayjs(member.membership_end).diff(dayjs(), 'day');
      if ([7, 3, 1].includes(daysLeft)) {
        await notificationService.sendExpiryReminder(member, daysLeft);
      }
    }
    console.log(`[CRON] Sent expiry reminders to ${expiring.rows.length} members`);
  });

  // ── 8 PM daily: Mark expired memberships ─────
  cron.schedule('0 20 * * *', async () => {
    console.log('[CRON] Marking expired memberships');
    const result = await query(
      `UPDATE members SET status = 'expired', updated_at = NOW()
       WHERE status = 'active' AND membership_end < CURRENT_DATE
       RETURNING id`
    );
    console.log(`[CRON] Marked ${result.rowCount} memberships as expired`);
  });

  // ── 10 AM daily: Re-engagement for inactive members ──
  cron.schedule('0 10 * * *', async () => {
    console.log('[CRON] Re-engagement campaign');
    const inactive = await query(
      `SELECT m.*, (CURRENT_DATE - MAX(a.check_in_at)::date) as days_since
       FROM members m
       LEFT JOIN attendance a ON a.member_id = m.id
       WHERE m.status = 'active'
       GROUP BY m.id
       HAVING MAX(a.check_in_at) < NOW() - INTERVAL '21 days'
          OR MAX(a.check_in_at) IS NULL
       LIMIT 50`
    );
    for (const member of inactive.rows) {
      // Only send once per week
      const alreadySent = await query(
        `SELECT id FROM notifications
         WHERE member_id = $1 AND type = 'reengagement'
           AND created_at >= NOW() - INTERVAL '7 days'`,
        [member.id]
      );
      if (!alreadySent.rows.length) {
        await notificationService.sendReengagement(member, member.days_since || 21);
      }
    }
  });

  // ── Auto-renewal: Process mandates daily at 7 AM ──
  cron.schedule('0 7 * * *', async () => {
    console.log('[CRON] Processing auto-renewals');
    const autoRenew = await query(
      `SELECT m.*, mp.price FROM members m
       JOIN membership_plans mp ON m.plan_id = mp.id
       WHERE m.auto_renewal = TRUE AND m.mandate_id IS NOT NULL
         AND m.membership_end = CURRENT_DATE + INTERVAL '3 days'`
    );
    for (const member of autoRenew.rows) {
      try {
        const Razorpay = require('razorpay');
        const rz = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        // Trigger mandate charge
        await rz.payments.createRecurring({
          email: member.email,
          contact: member.phone,
          amount: member.price * 100,
          currency: 'INR',
          order_id: `auto_${member.id}_${Date.now()}`,
          recurring: 1,
          description: `Auto-renewal: ${member.plan_name}`,
          notify: { sms: true, email: true, whatsapp: false }
        });
        console.log(`[CRON] Auto-renewal triggered for ${member.name}`);
      } catch (err) {
        console.error(`[CRON] Auto-renewal failed for ${member.name}:`, err.message);
        await notificationService.sendPaymentFailed(member, member.price);
      }
    }
  });

  // ── Generate class sessions weekly (Sunday midnight) ─
  cron.schedule('0 0 * * 0', async () => {
    console.log('[CRON] Generating next week class sessions');
    const classes = await query('SELECT * FROM classes WHERE is_active = TRUE');
    for (const cls of classes.rows) {
      for (let i = 0; i < 7; i++) {
        const date = dayjs().add(i + 7, 'day');
        if (cls.day_of_week.includes(date.day())) {
          await query(
            `INSERT INTO class_sessions (class_id, session_date, start_time)
             VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
            [cls.id, date.format('YYYY-MM-DD'), cls.start_time]
          );
        }
      }
    }
  });

  console.log('✅ All cron jobs started');
}

module.exports = { startCronJobs };
