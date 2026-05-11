const { query, queryOne, withTransaction, getIsConnected } = require('../config/db');
const { set, get, del } = require('../config/redis');
const { generateMemberCode, generateInvoiceNumber } = require('../utils/helpers');
const notificationService = require('../services/notificationService');
const invoiceService = require('../services/invoiceService');
const mockData = require('../utils/mockData');
const dayjs = require('dayjs');

// ── List members ─────────────────────────────
const getMembers = async (req, res) => {
  if (!getIsConnected()) {
    let filtered = [...mockData.members];
    const { search } = req.query;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(s) || 
        m.email.toLowerCase().includes(s) || 
        m.phone.includes(s) || 
        m.member_code.toLowerCase().includes(s)
      );
    }
    return res.json({
      members: filtered,
      pagination: { total: filtered.length, page: 1, limit: 20, pages: 1 }
    });
  }

  const { page = 1, limit = 20, status, plan_id, branch_id, search } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params = [];
  let pIdx = 1;

  if (req.branchFilter) {
    whereClause += ` AND m.branch_id = $${pIdx++}`;
    params.push(req.branchFilter);
  } else if (branch_id) {
    whereClause += ` AND m.branch_id = $${pIdx++}`;
    params.push(branch_id);
  }

  if (status) {
    whereClause += ` AND m.status = $${pIdx++}`;
    params.push(status);
  }

  if (plan_id) {
    whereClause += ` AND m.plan_id = $${pIdx++}`;
    params.push(plan_id);
  }

  if (search) {
    whereClause += ` AND (m.name ILIKE $${pIdx} OR m.phone ILIKE $${pIdx} OR m.email ILIKE $${pIdx} OR m.member_code ILIKE $${pIdx})`;
    params.push(`%${search}%`);
    pIdx++;
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM members m ${whereClause}`, params
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT m.*, mp.name as plan_name, mp.price as plan_price, b.name as branch_name
     FROM members m
     LEFT JOIN membership_plans mp ON m.plan_id = mp.id
     LEFT JOIN branches b ON m.branch_id = b.id
     ${whereClause}
     ORDER BY m.created_at DESC
     LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
    [...params, limit, offset]
  );

  res.json({
    members: result.rows,
    pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / limit) }
  });
};

// ── Get single member ─────────────────────────
const getMember = async (req, res) => {
  if (!getIsConnected()) {
    const member = mockData.members.find(m => m.id == req.params.id) || mockData.members[0];
    return res.json({
      ...member,
      recent_attendance: mockData.attendance.filter(a => a.member_id == member.id),
      visits_this_month: 4
    });
  }
  const { id } = req.params;

  const cacheKey = `member:${id}`;
  const cached = await get(cacheKey);
  if (cached) return res.json(cached);

  const member = await queryOne(
    `SELECT m.*, mp.name as plan_name, mp.price as plan_price, mp.features,
            b.name as branch_name, b.address as branch_address
     FROM members m
     LEFT JOIN membership_plans mp ON m.plan_id = mp.id
     LEFT JOIN branches b ON m.branch_id = b.id
     WHERE m.id = $1`,
    [id]
  );

  if (!member) return res.status(404).json({ error: 'Member not found' });

  // Fetch recent attendance
  const recentAttendance = await query(
    `SELECT check_in_at, check_out_at, method
     FROM attendance WHERE member_id = $1
     ORDER BY check_in_at DESC LIMIT 10`,
    [id]
  );

  // Monthly stats
  const monthStats = await queryOne(
    `SELECT COUNT(*) as visits_this_month
     FROM attendance
     WHERE member_id = $1
       AND check_in_at >= date_trunc('month', NOW())`,
    [id]
  );

  const data = {
    ...member,
    recent_attendance: recentAttendance.rows,
    visits_this_month: parseInt(monthStats.visits_this_month)
  };

  await set(cacheKey, data, 300);
  res.json(data);
};

// ── Create member ─────────────────────────────
const createMember = async (req, res) => {
  const {
    name, email, phone, date_of_birth, gender, address,
    emergency_contact, branch_id, plan_id, notes
  } = req.body;

  const member = await withTransaction(async (client) => {
    const plan = await queryOne('SELECT * FROM membership_plans WHERE id = $1', [plan_id]);
    if (!plan) throw new Error('Plan not found');

    const memberCode = await generateMemberCode(client);
    const memberStart = dayjs().format('YYYY-MM-DD');
    const memberEnd = dayjs().add(plan.duration_days, 'day').format('YYYY-MM-DD');

    const result = await client.query(
      `INSERT INTO members
         (member_code, name, email, phone, date_of_birth, gender, address,
          emergency_contact, branch_id, plan_id, membership_start, membership_end, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'active',$13)
       RETURNING *`,
      [memberCode, name, email, phone, date_of_birth, gender, address,
       emergency_contact, branch_id, plan_id, memberStart, memberEnd, notes]
    );
    return result.rows[0];
  });

  // Send welcome WhatsApp
  await notificationService.sendWelcome(member);

  await del(`dashboard:*`);
  res.status(201).json(member);
};

// ── Update member ─────────────────────────────
const updateMember = async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const allowed = ['name','email','phone','date_of_birth','gender','address',
                   'emergency_contact','branch_id','auto_renewal','notes','status'];

  const updates = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = $${idx++}`);
      values.push(fields[key]);
    }
  }

  if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await queryOne(
    `UPDATE members SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  await del(`member:${id}`);
  res.json(result);
};

// ── Renewal flow ──────────────────────────────
const getRenewalInfo = async (req, res) => {
  const { id } = req.params;

  const member = await queryOne(
    `SELECT m.*, mp.name as current_plan_name, mp.price as current_plan_price,
            mp.duration_days
     FROM members m
     LEFT JOIN membership_plans mp ON m.plan_id = mp.id
     WHERE m.id = $1`,
    [id]
  );

  if (!member) return res.status(404).json({ error: 'Member not found' });

  const plans = await query('SELECT * FROM membership_plans WHERE is_active = TRUE ORDER BY price');

  const monthVisits = await queryOne(
    `SELECT COUNT(*) as cnt FROM attendance
     WHERE member_id = $1 AND check_in_at >= date_trunc('month', NOW())`,
    [id]
  );

  res.json({
    member,
    available_plans: plans.rows,
    visits_this_month: parseInt(monthVisits.cnt),
    days_to_expiry: dayjs(member.membership_end).diff(dayjs(), 'day'),
    loyalty_discount: Math.min(member.loyalty_points, Math.floor(member.loyalty_points * 1))
  });
};

const initiateRenewal = async (req, res) => {
  const { id } = req.params;
  const { plan_id, use_points } = req.body;

  const member = await queryOne('SELECT * FROM members WHERE id = $1', [id]);
  const plan = await queryOne('SELECT * FROM membership_plans WHERE id = $1', [plan_id]);

  if (!member || !plan) return res.status(404).json({ error: 'Not found' });

  const discount = use_points ? Math.min(member.loyalty_points, Math.floor(plan.price * 0.1)) : 0;
  const finalAmount = plan.price - discount;

  const Razorpay = require('razorpay');
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  const order = await razorpay.orders.create({
    amount: finalAmount * 100,
    currency: 'INR',
    receipt: `renewal_${member.member_code}_${Date.now()}`,
    notes: { member_id: id, plan_id, discount, points_used: use_points ? member.loyalty_points : 0 }
  });

  res.json({
    order_id: order.id,
    amount: finalAmount,
    discount,
    original_amount: plan.price,
    plan,
    razorpay_key: process.env.RAZORPAY_KEY_ID
  });
};

const completeRenewal = async (req, res) => {
  const { id } = req.params;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id, discount, points_used } = req.body;

  const crypto = require('crypto');
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSig !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  const result = await withTransaction(async (client) => {
    const member = await queryOne('SELECT * FROM members WHERE id = $1', [id]);
    const plan = await queryOne('SELECT * FROM membership_plans WHERE id = $1', [plan_id]);

    const newStart = dayjs(member.membership_end).isAfter(dayjs())
      ? member.membership_end
      : dayjs().format('YYYY-MM-DD');
    const newEnd = dayjs(newStart).add(plan.duration_days, 'day').format('YYYY-MM-DD');
    const finalAmount = plan.price - (discount || 0);
    const invoiceNumber = await generateInvoiceNumber(client);

    await client.query(
      `UPDATE members SET
         plan_id = $1, membership_start = $2, membership_end = $3,
         status = 'active', loyalty_points = loyalty_points - $4 + $5,
         updated_at = NOW()
       WHERE id = $6`,
      [plan_id, newStart, newEnd, points_used || 0, Math.floor(finalAmount / 100), id]
    );

    const payment = await client.query(
      `INSERT INTO payments
         (member_id, plan_id, amount, discount, points_used, final_amount,
          method, status, razorpay_order_id, razorpay_payment_id, invoice_number)
       VALUES ($1,$2,$3,$4,$5,$6,'upi','captured',$7,$8,$9)
       RETURNING *`,
      [id, plan_id, plan.price, discount||0, points_used||0, finalAmount,
       razorpay_order_id, razorpay_payment_id, invoiceNumber]
    );

    return { member: { ...member, membership_end: newEnd }, payment: payment.rows[0], plan };
  });

  // Generate invoice PDF and send confirmation
  const invoiceUrl = await invoiceService.generate(result.payment, result.member, result.plan);
  await notificationService.sendRenewalConfirmation(result.member, result.payment, invoiceUrl);

  await del(`member:${id}`);
  res.json({ success: true, ...result, invoice_url: invoiceUrl });
};

// ── Member stats ──────────────────────────────
const getMemberStats = async (req, res) => {
  if (!getIsConnected()) {
    return res.json({
      active: 142, expired: 12, expiring_soon: 5, new_this_month: 28
    });
  }
  const stats = await queryOne(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'active') as active,
       COUNT(*) FILTER (WHERE status = 'expired') as expired,
       COUNT(*) FILTER (WHERE membership_end BETWEEN NOW() AND NOW() + INTERVAL '7 days') as expiring_soon,
       COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as new_this_month
     FROM members`
  );
  res.json(stats);
};

module.exports = {
  getMembers, getMember, createMember, updateMember,
  getRenewalInfo, initiateRenewal, completeRenewal, getMemberStats
};
