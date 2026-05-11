const { query, queryOne, getIsConnected } = require('../config/db');
const { set, get } = require('../config/redis');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const mockData = require('../utils/mockData');
const dayjs = require('dayjs');

// Generate QR token for member check-in (valid 5 min)
const generateQR = async (req, res) => {
  if (!getIsConnected()) {
    const member = mockData.members.find(m => m.id == req.params.member_id) || mockData.members[0];
    const token = jwt.sign({ member_id: member.id, type: 'checkin' }, process.env.JWT_SECRET || 'demo', { expiresIn: '5m' });
    const qrUrl = await QRCode.toDataURL(token);
    return res.json({ qr: qrUrl, token, expires_in: 300, member: { name: member.name, code: member.member_code } });
  }

  const { member_id } = req.params;
  const member = await queryOne(
    'SELECT id, name, member_code, status, membership_end FROM members WHERE id = $1',
    [member_id]
  );

  if (!member) return res.status(404).json({ error: 'Member not found' });
  if (member.status !== 'active') return res.status(400).json({ error: 'Membership not active' });
  if (dayjs(member.membership_end).isBefore(dayjs())) {
    return res.status(400).json({ error: 'Membership expired' });
  }

  const token = jwt.sign(
    { member_id: member.id, type: 'checkin' },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );

  const qrUrl = await QRCode.toDataURL(token);
  res.json({ qr: qrUrl, token, expires_in: 300, member: { name: member.name, code: member.member_code } });
};

// Process check-in via QR token
const checkIn = async (req, res) => {
  if (!getIsConnected()) {
    return res.json({
      success: true,
      member: { name: 'Rahul Sharma', code: 'FC101', total_visits: 121 },
      check_in_time: new Date()
    });
  }

  const { token, branch_id, method = 'qr' } = req.body;
  let memberId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'checkin') throw new Error('Invalid token type');
    memberId = decoded.member_id;
  } catch {
    return res.status(400).json({ error: 'Invalid or expired QR code' });
  }

  const recentKey = `checkin:${memberId}`;
  const recent = await get(recentKey);
  if (recent) return res.status(409).json({ error: 'Already checked in recently', check_in: recent });

  const member = await queryOne(
    'SELECT id, name, member_code, status, membership_end, total_visits FROM members WHERE id = $1',
    [memberId]
  );
  if (!member || member.status !== 'active') return res.status(400).json({ error: 'Membership not active' });

  const attendance = await queryOne(
    `INSERT INTO attendance (member_id, branch_id, method) VALUES ($1, $2, $3) RETURNING *`,
    [memberId, branch_id, method]
  );
  await query(`UPDATE members SET total_visits = total_visits + 1, loyalty_points = loyalty_points + 1 WHERE id = $1`, [memberId]);
  await set(recentKey, attendance, 1800);

  res.json({ success: true, member: { name: member.name, code: member.member_code, total_visits: member.total_visits + 1 }, check_in_time: attendance.check_in_at });
};

// Manual check-out
const checkOut = async (req, res) => {
  if (!getIsConnected()) {
    return res.json({ success: true, duration_minutes: 45 });
  }
  const { attendance_id } = req.params;
  const result = await queryOne(
    `UPDATE attendance SET check_out_at = NOW() WHERE id = $1 AND check_out_at IS NULL RETURNING *`,
    [attendance_id]
  );
  if (!result) return res.status(404).json({ error: 'Active check-in not found' });
  res.json({ success: true, duration_minutes: dayjs().diff(dayjs(result.check_in_at), 'minute') });
};

// Get attendance logs
const getAttendance = async (req, res) => {
  if (!getIsConnected()) {
    return res.json({ 
      attendance: mockData.attendance, 
      pagination: { total: mockData.attendance.length, page: 1, limit: 50 } 
    });
  }
  const { member_id, branch_id, date, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;
  if (member_id) { where += ` AND a.member_id = $${idx++}`; params.push(member_id); }
  if (branch_id) { where += ` AND a.branch_id = $${idx++}`; params.push(branch_id); }
  if (date)      { where += ` AND DATE(a.check_in_at) = $${idx++}`; params.push(date); }
  const total = parseInt((await query(`SELECT COUNT(*) FROM attendance a ${where}`, params)).rows[0].count);
  const result = await query(
    `SELECT a.*, m.name as member_name, m.member_code, b.name as branch_name
     FROM attendance a LEFT JOIN members m ON a.member_id = m.id LEFT JOIN branches b ON a.branch_id = b.id
     ${where} ORDER BY a.check_in_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
    [...params, limit, offset]
  );
  res.json({ attendance: result.rows, pagination: { total, page: +page, limit: +limit } });
};

// Today's stats
const getTodayStats = async (req, res) => {
  if (!getIsConnected()) {
    return res.json({
      total_checkins: 45,
      unique_members: 42,
      morning: 12,
      midday: 15,
      evening: 18,
      hourly: [
        { hour: 6, count: 2 }, { hour: 7, count: 5 }, { hour: 8, count: 3 },
        { hour: 17, count: 8 }, { hour: 18, count: 6 }, { hour: 19, count: 4 }
      ]
    });
  }
  const stats = await queryOne(
    `SELECT
       COUNT(*) as total_checkins,
       COUNT(DISTINCT member_id) as unique_members,
       COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM check_in_at) BETWEEN 6 AND 9) as morning,
       COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM check_in_at) BETWEEN 10 AND 14) as midday,
       COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM check_in_at) BETWEEN 17 AND 21) as evening
     FROM attendance WHERE DATE(check_in_at) = CURRENT_DATE`
  );
  const hourly = await query(
    `SELECT EXTRACT(HOUR FROM check_in_at) as hour, COUNT(*) as count
     FROM attendance WHERE DATE(check_in_at) = CURRENT_DATE
     GROUP BY 1 ORDER BY 1`
  );
  res.json({ ...stats, hourly: hourly.rows });
};

module.exports = { generateQR, checkIn, checkOut, getAttendance, getTodayStats };
