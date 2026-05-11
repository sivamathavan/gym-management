const { query, queryOne, withTransaction, getIsConnected } = require('../config/db');
const invoiceService = require('../services/invoiceService');
const mockData = require('../utils/mockData');
const dayjs = require('dayjs');

const getPayments = async (req, res) => {
  if (!getIsConnected()) {
    return res.json({ 
      payments: mockData.payments, 
      pagination: { total: mockData.payments.length, page: 1, limit: 20 } 
    });
  }
  const { page = 1, limit = 20, status, member_id, from, to } = req.query;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (member_id) { where += ` AND p.member_id = $${idx++}`; params.push(member_id); }
  if (status)    { where += ` AND p.status = $${idx++}`; params.push(status); }
  if (from)      { where += ` AND p.created_at >= $${idx++}`; params.push(from); }
  if (to)        { where += ` AND p.created_at <= $${idx++}`; params.push(to + 'T23:59:59'); }

  const total = parseInt((await query(`SELECT COUNT(*) FROM payments p ${where}`, params)).rows[0].count);
  const result = await query(
    `SELECT p.*, m.name as member_name, m.member_code, mp.name as plan_name
     FROM payments p
     LEFT JOIN members m ON p.member_id = m.id
     LEFT JOIN membership_plans mp ON p.plan_id = mp.id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT $${idx} OFFSET $${idx+1}`,
    [...params, limit, offset]
  );

  res.json({ payments: result.rows, pagination: { total, page: +page, limit: +limit } });
};

const getRevenueStats = async (req, res) => {
  if (!getIsConnected()) {
    return res.json({
      monthly_revenue: [
        { month: '2024-01-01', revenue: 65000, transactions: 15 },
        { month: '2024-02-01', revenue: 72000, transactions: 18 },
        { month: '2024-03-01', revenue: 85000, transactions: 22 }
      ],
      plan_breakdown: [
        { name: 'Premium Monthly', revenue: 45000, count: 9 },
        { name: 'Annual Elite', revenue: 30000, count: 2 },
        { name: 'Basic Monthly', revenue: 10000, count: 4 }
      ],
      today_stats: { today: 4200, this_month: 85400, failed_today: 1, refunded_this_month: 0 }
    });
  }
  const { period = 'month' } = req.query;

  const monthlyRevenue = await query(
    `SELECT
       date_trunc('month', created_at) as month,
       SUM(final_amount) as revenue,
       COUNT(*) as transactions
     FROM payments
     WHERE status = 'captured'
       AND created_at >= NOW() - INTERVAL '6 months'
     GROUP BY 1 ORDER BY 1`
  );

  const planBreakdown = await query(
    `SELECT mp.name, SUM(p.final_amount) as revenue, COUNT(*) as count
     FROM payments p
     JOIN membership_plans mp ON p.plan_id = mp.id
     WHERE p.status = 'captured'
       AND p.created_at >= date_trunc('month', NOW())
     GROUP BY mp.name ORDER BY revenue DESC`
  );

  const todayStats = await queryOne(
    `SELECT
       SUM(final_amount) FILTER (WHERE created_at >= CURRENT_DATE) as today,
       SUM(final_amount) FILTER (WHERE created_at >= date_trunc('month', NOW())) as this_month,
       COUNT(*) FILTER (WHERE status='failed' AND created_at >= CURRENT_DATE) as failed_today,
       SUM(final_amount) FILTER (WHERE status='refunded' AND created_at >= date_trunc('month', NOW())) as refunded_this_month
     FROM payments`
  );

  res.json({ monthly_revenue: monthlyRevenue.rows, plan_breakdown: planBreakdown.rows, today_stats: todayStats });
};

const downloadInvoice = async (req, res) => {
  const payment = await queryOne(
    `SELECT p.*, m.name as member_name, m.email, m.phone, m.member_code,
            m.address, mp.name as plan_name
     FROM payments p
     JOIN members m ON p.member_id = m.id
     JOIN membership_plans mp ON p.plan_id = mp.id
     WHERE p.id = $1`,
    [req.params.id]
  );

  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  const pdfBuffer = await invoiceService.generateBuffer(payment);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${payment.invoice_number}.pdf"`);
  res.send(pdfBuffer);
};

module.exports = { getPayments, getRevenueStats, downloadInvoice };
