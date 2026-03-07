const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, preferred_language = 'hinglish' } = req.body;

    const exists = await query('SELECT id FROM customers WHERE email = $1', [email]);
    if (exists.rows.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO customers (name, email, phone, password_hash, preferred_language)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, email, phone, role, preferred_language`,
      [name, email, phone || null, password_hash, preferred_language]
    );

    const user = result.rows[0];
    const token = generateToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT id, name, email, phone, role, preferred_language, password_hash FROM customers WHERE email = $1',
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password_hash, ...userSafe } = user;
    const token = generateToken(userSafe);
    res.json({ token, user: userSafe });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};
