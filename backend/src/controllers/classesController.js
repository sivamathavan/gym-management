const { query, queryOne, withTransaction, getIsConnected } = require('../config/db');
const mockData = require('../utils/mockData');
const dayjs = require('dayjs');

const getClasses = async (req, res) => {
  if (!getIsConnected()) {
    return res.json(mockData.classes);
  }
  const { branch_id, trainer_id, date } = req.query;
  let where = 'WHERE c.is_active = TRUE';
  const params = [];
  let idx = 1;
  if (branch_id) { where += ` AND c.branch_id = $${idx++}`; params.push(branch_id); }
  if (trainer_id) { where += ` AND c.trainer_id = $${idx++}`; params.push(trainer_id); }

  const result = await query(
    `SELECT c.*, u.name as trainer_name, b.name as branch_name,
       (SELECT COUNT(*) FROM class_bookings cb
        JOIN class_sessions cs ON cb.session_id = cs.id
        WHERE cs.class_id = c.id AND cs.session_date = CURRENT_DATE AND cb.status = 'confirmed') as today_booked
     FROM classes c
     LEFT JOIN trainers t ON c.trainer_id = t.id
     LEFT JOIN users u ON t.user_id = u.id
     LEFT JOIN branches b ON c.branch_id = b.id
     ${where} ORDER BY c.start_time`, params
  );
  res.json(result.rows);
};

const createClass = async (req, res) => {
  const { name, description, trainer_id, branch_id, day_of_week, start_time, duration_min, capacity } = req.body;
  const result = await queryOne(
    `INSERT INTO classes (name, description, trainer_id, branch_id, day_of_week, start_time, duration_min, capacity)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [name, description, trainer_id, branch_id, day_of_week, start_time, duration_min || 60, capacity || 20]
  );
  // Generate sessions for next 30 days
  await generateSessions(result.id, result.day_of_week, result.start_time);
  res.status(201).json(result);
};

async function generateSessions(classId, daysOfWeek, startTime) {
  const sessions = [];
  for (let i = 0; i < 30; i++) {
    const date = dayjs().add(i, 'day');
    if (daysOfWeek.includes(date.day())) {
      sessions.push([classId, date.format('YYYY-MM-DD'), startTime]);
    }
  }
  for (const s of sessions) {
    await query(
      `INSERT INTO class_sessions (class_id, session_date, start_time)
       VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, s
    );
  }
}

const getSessionsForDate = async (req, res) => {
  if (!getIsConnected()) {
    return res.json(mockData.classes.map(c => ({ ...c, booked: c.today_booked, session_date: dayjs().format('YYYY-MM-DD') })));
  }
  const { date = dayjs().format('YYYY-MM-DD'), branch_id } = req.query;
  let where = `WHERE cs.session_date = $1`;
  const params = [date];
  if (branch_id) { where += ` AND c.branch_id = $2`; params.push(branch_id); }

  const result = await query(
    `SELECT cs.*, c.name, c.capacity, c.duration_min, u.name as trainer_name, b.name as branch_name,
       COUNT(cb.id) FILTER (WHERE cb.status='confirmed') as booked
     FROM class_sessions cs
     JOIN classes c ON cs.class_id = c.id
     LEFT JOIN trainers t ON c.trainer_id = t.id
     LEFT JOIN users u ON t.user_id = u.id
     LEFT JOIN branches b ON c.branch_id = b.id
     LEFT JOIN class_bookings cb ON cb.session_id = cs.id
     ${where} AND cs.status != 'cancelled'
     GROUP BY cs.id, c.id, u.name, b.name
     ORDER BY cs.start_time`, params
  );
  res.json(result.rows);
};

const bookClass = async (req, res) => {
  const { session_id, member_id } = req.body;

  const session = await queryOne(
    `SELECT cs.*, c.capacity,
       COUNT(cb.id) FILTER (WHERE cb.status='confirmed') as booked
     FROM class_sessions cs JOIN classes c ON cs.class_id = c.id
     LEFT JOIN class_bookings cb ON cb.session_id = cs.id
     WHERE cs.id = $1 GROUP BY cs.id, c.capacity`, [session_id]
  );

  if (!session) return res.status(404).json({ error: 'Session not found' });

  const status = parseInt(session.booked) >= session.capacity ? 'waitlisted' : 'confirmed';
  const booking = await queryOne(
    `INSERT INTO class_bookings (session_id, member_id, status) VALUES ($1,$2,$3)
     ON CONFLICT (session_id, member_id) DO UPDATE SET status = EXCLUDED.status RETURNING *`,
    [session_id, member_id, status]
  );
  res.status(201).json(booking);
};

const cancelBooking = async (req, res) => {
  const { id } = req.params;
  await query(`UPDATE class_bookings SET status = 'cancelled' WHERE id = $1`, [id]);

  // Promote first waitlisted
  const waitlisted = await queryOne(
    `SELECT cb.* FROM class_bookings cb
     JOIN class_bookings orig ON orig.id = $1
     WHERE cb.session_id = orig.session_id AND cb.status = 'waitlisted'
     ORDER BY cb.booked_at LIMIT 1`, [id]
  );
  if (waitlisted) {
    await query(`UPDATE class_bookings SET status = 'confirmed' WHERE id = $1`, [waitlisted.id]);
  }
  res.json({ success: true });
};

module.exports = { getClasses, createClass, getSessionsForDate, bookClass, cancelBooking };
