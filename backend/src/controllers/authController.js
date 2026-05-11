const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, query, getIsConnected } = require('../config/db');

const login = async (req, res) => {
  const { email, password } = req.body;

  // Mock login for demo if DB is not connected
  if (!getIsConnected()) {
    if (email === 'admin@fitcore.in' && password === 'admin123') {
      const token = jwt.sign({ userId: 1, role: 'super_admin' }, process.env.JWT_SECRET, {
        expiresIn: '7d'
      });
      return res.json({
        token,
        user: { id: 1, name: 'Demo Admin', email: 'admin@fitcore.in', role: 'super_admin', branch_id: 1 }
      });
    } else {
      return res.status(401).json({ 
        error: 'Database disconnected. Please use demo credentials: admin@fitcore.in / admin123' 
      });
    }
  }

  const user = await queryOne(
    'SELECT * FROM users WHERE email = $1 AND is_active = TRUE', [email]
  );
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, branch_id: user.branch_id }
  });
};

const getMe = async (req, res) => {
  res.json(req.user);
};

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
  const valid = await bcrypt.compare(current_password, user.password_hash);
  if (!valid) return res.status(400).json({ error: 'Current password incorrect' });
  const hash = await bcrypt.hash(new_password, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
  res.json({ success: true });
};

const createUser = async (req, res) => {
  const { name, email, phone, password, role, branch_id } = req.body;
  const hash = await bcrypt.hash(password, 12);
  const user = await queryOne(
    `INSERT INTO users (name, email, phone, password_hash, role, branch_id)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role, branch_id`,
    [name, email, phone, hash, role, branch_id]
  );
  res.status(201).json(user);
};

module.exports = { login, getMe, changePassword, createUser };
