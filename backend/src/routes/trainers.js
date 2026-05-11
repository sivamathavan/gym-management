const { Router } = require('express');
const { query, queryOne, getIsConnected } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const mockData = require('../utils/mockData');
const r = Router();
r.use(authenticate);

r.get('/', async (req, res) => {
  if (!getIsConnected()) {
    return res.json(mockData.trainers);
  }
  const result = await query(
    `SELECT t.*, u.name, u.email, u.phone, b.name as branch_name,
       COUNT(DISTINCT c.id) as class_count,
       COUNT(DISTINCT cs.id) FILTER (WHERE cs.session_date >= NOW()-INTERVAL '30 days') as sessions_this_month
     FROM trainers t
     JOIN users u ON t.user_id = u.id
     LEFT JOIN branches b ON t.branch_id = b.id
     LEFT JOIN classes c ON c.trainer_id = t.id
     LEFT JOIN class_sessions cs ON cs.class_id = c.id
     GROUP BY t.id, u.name, u.email, u.phone, b.name
     ORDER BY u.name`
  );
  res.json(result.rows);
});

r.put('/:id', requireRole('super_admin','branch_manager'), async (req, res) => {
  const { specialties, bio, is_available } = req.body;
  const t = await queryOne(
    `UPDATE trainers SET specialties=$1, bio=$2, is_available=$3 WHERE id=$4 RETURNING *`,
    [specialties, bio, is_available, req.params.id]
  );
  res.json(t);
});

module.exports = r;
