// routes/branches.js
const { Router } = require('express');
const { query, queryOne, getIsConnected } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const mockData = require('../utils/mockData');
const r = Router();
r.use(authenticate);

r.get('/', async (req, res) => {
  if (!getIsConnected()) {
    return res.json(mockData.branches);
  }
  const result = await query(
    `SELECT b.*,
       COUNT(DISTINCT m.id) FILTER (WHERE m.status='active') as active_members,
       COUNT(DISTINCT c.id) FILTER (WHERE c.is_active=TRUE) as active_classes,
       COUNT(DISTINCT t.id) as trainer_count
     FROM branches b
     LEFT JOIN members m ON m.branch_id = b.id
     LEFT JOIN classes c ON c.branch_id = b.id
     LEFT JOIN trainers t ON t.branch_id = b.id
     WHERE b.is_active = TRUE
     GROUP BY b.id ORDER BY b.name`
  );
  res.json(result.rows);
});

r.post('/', requireRole('super_admin'), async (req, res) => {
  const { name, address, city, phone, email } = req.body;
  const b = await queryOne(
    'INSERT INTO branches (name, address, city, phone, email) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [name, address, city, phone, email]
  );
  res.status(201).json(b);
});

module.exports = r;
