import express from 'express';
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db, { initDb } from './db.js';
import { authenticateToken, requireRole, JWT_SECRET } from './auth.js';

initDb();

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// 1. AUTHENTICATION & USER MANAGEMENT
// ----------------------------------------------------

// User / Provider Registration
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone, role, nic, category } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const userRole = role === 'provider' ? 'provider' : role === 'admin' ? 'admin' : 'customer';

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)');
    const result = insertUser.run(name, email, password_hash, phone || '', userRole);
    const userId = result.lastInsertRowid;

    if (userRole === 'provider') {
      const insertProvider = db.prepare('INSERT INTO providers (user_id, nic, category, kyc_status) VALUES (?, ?, ?, ?)');
      insertProvider.run(userId, nic || '', category || 'Auto Care', 'pending');
    }

    const token = jwt.sign({ id: userId, email, role: userRole, name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: userId, name, email, role: userRole, phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  let providerInfo = null;
  if (user.role === 'provider') {
    providerInfo = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(user.id);
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }, provider: providerInfo });
});

// Get current user profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(req.user.id);
  let provider = null;
  if (user.role === 'provider') {
    provider = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(user.id);
  }
  res.json({ user, provider });
});

// ----------------------------------------------------
// 2. SERVICES & SUBSCRIPTIONS
// ----------------------------------------------------

app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories').all();
  res.json(categories);
});

app.get('/api/services', (req, res) => {
  const services = db.prepare(`
    SELECT s.*, c.name as category_name 
    FROM services s
    JOIN categories c ON s.category_id = c.id
  `).all();
  res.json(services);
});

app.get('/api/subscriptions', (req, res) => {
  const plans = db.prepare('SELECT * FROM subscription_plans').all();
  res.json(plans.map(p => ({ ...p, features: JSON.parse(p.features || '[]') })));
});

app.post('/api/subscriptions/subscribe', authenticateToken, (req, res) => {
  const { plan_id } = req.body;
  const userId = req.user.id;

  const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(plan_id);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const stmt = db.prepare('INSERT INTO user_subscriptions (user_id, plan_id, end_date) VALUES (?, ?, ?)');
  stmt.run(userId, plan_id, endDate.toISOString());

  res.json({ message: 'Subscribed successfully', plan, endDate });
});

// ----------------------------------------------------
// 3. BOOKINGS & PIN VERIFICATION
// ----------------------------------------------------

// Create Booking
app.post('/api/bookings', authenticateToken, (req, res) => {
  const { service_id, booking_date, booking_time } = req.body;
  const userId = req.user.id;

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);
  if (!service) return res.status(404).json({ error: 'Service not found' });

  // Generate 4-digit verification PIN
  const pin_code = Math.floor(1000 + Math.random() * 9000).toString();

  // Find an available approved provider for this service category
  const provider = db.prepare(`
    SELECT p.id FROM providers p
    JOIN categories c ON c.name = p.category
    WHERE c.id = ? AND p.kyc_status = 'approved' AND p.availability_status = 'available'
    LIMIT 1
  `).get(service.category_id);

  const provider_id = provider ? provider.id : null;
  const status = provider_id ? 'assigned' : 'pending';

  const stmt = db.prepare(`
    INSERT INTO bookings (user_id, provider_id, service_id, booking_date, booking_time, status, pin_code, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(userId, provider_id, service_id, booking_date, booking_time, status, pin_code, service.price);

  res.status(201).json({
    booking_id: result.lastInsertRowid,
    pin_code,
    status,
    total_price: service.price,
    message: 'Booking placed successfully'
  });
});

// Customer Bookings
app.get('/api/bookings/my', authenticateToken, (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, s.title as service_title, c.name as category_name,
           u.name as provider_name, u.phone as provider_phone
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN categories c ON s.category_id = c.id
    LEFT JOIN providers p ON b.provider_id = p.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE b.user_id = ?
    ORDER BY b.id DESC
  `).all(req.user.id);

  res.json(bookings);
});

// Provider Assigned Bookings
app.get('/api/bookings/assigned', authenticateToken, requireRole('provider'), (req, res) => {
  const provider = db.prepare('SELECT id FROM providers WHERE user_id = ?').get(req.user.id);
  if (!provider) return res.status(404).json({ error: 'Provider record not found' });

  const bookings = db.prepare(`
    SELECT b.*, s.title as service_title, s.description as service_desc,
           u.name as customer_name, u.phone as customer_phone
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN users u ON b.user_id = u.id
    WHERE b.provider_id = ? OR b.status = 'pending'
    ORDER BY b.id DESC
  `).all(provider.id);

  res.json(bookings);
});

// Provider Updates Status (Start / Complete with PIN)
app.put('/api/bookings/:id/status', authenticateToken, requireRole('provider'), (req, res) => {
  const { id } = req.params;
  const { status, pin_code, before_photo, after_photo } = req.body;

  const provider = db.prepare('SELECT id FROM providers WHERE user_id = ?').get(req.user.id);
  if (!provider) return res.status(404).json({ error: 'Provider record not found' });

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  // PIN Verification Check
  if (status === 'completed' || status === 'in_progress') {
    if (booking.pin_code !== pin_code) {
      return res.status(400).json({ error: 'Invalid PIN Code! Customer verification failed.' });
    }
  }

  // Update status & photos
  const updateStmt = db.prepare(`
    UPDATE bookings 
    SET status = ?, provider_id = ?, before_photo = COALESCE(?, before_photo), after_photo = COALESCE(?, after_photo)
    WHERE id = ?
  `);
  updateStmt.run(status, provider.id, before_photo || null, after_photo || null, id);

  if (status === 'completed') {
    // Credit earnings to provider (85% payout)
    const payout = booking.total_price * 0.85;
    db.prepare('UPDATE providers SET earnings = earnings + ? WHERE id = ?').run(payout, provider.id);
  }

  res.json({ message: `Booking status updated to ${status}` });
});

// ----------------------------------------------------
// 4. REVIEWS & COMPLAINTS
// ----------------------------------------------------

app.post('/api/reviews', authenticateToken, (req, res) => {
  const { booking_id, rating, comment } = req.body;
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(booking_id, req.user.id);

  if (!booking) return res.status(404).json({ error: 'Booking not found or not eligible for review' });
  if (booking.status !== 'completed') return res.status(400).json({ error: 'Only completed services can be reviewed' });

  try {
    const stmt = db.prepare('INSERT INTO reviews (booking_id, user_id, provider_id, rating, comment) VALUES (?, ?, ?, ?, ?)');
    stmt.run(booking_id, req.user.id, booking.provider_id, rating, comment);
    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Review already submitted for this booking' });
  }
});

app.post('/api/complaints', authenticateToken, (req, res) => {
  const { booking_id, subject, description } = req.body;
  const stmt = db.prepare('INSERT INTO complaints (user_id, booking_id, subject, description) VALUES (?, ?, ?, ?)');
  stmt.run(req.user.id, booking_id || null, subject, description);
  res.status(201).json({ message: 'Complaint registered successfully. Admin will review shortly.' });
});

// ----------------------------------------------------
// 5. ADMIN MODULE
// ----------------------------------------------------

app.get('/api/admin/providers', authenticateToken, requireRole('admin'), (req, res) => {
  const providers = db.prepare(`
    SELECT p.*, u.name, u.email, u.phone 
    FROM providers p
    JOIN users u ON p.user_id = u.id
  `).all();
  res.json(providers);
});

app.put('/api/admin/providers/:id/kyc', authenticateToken, requireRole('admin'), (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  db.prepare('UPDATE providers SET kyc_status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: `Provider KYC updated to ${status}` });
});

app.get('/api/admin/stats', authenticateToken, requireRole('admin'), (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "customer"').get().count;
  const totalProviders = db.prepare('SELECT COUNT(*) as count FROM providers WHERE kyc_status = "approved"').get().count;
  const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
  const totalRevenue = db.prepare('SELECT SUM(total_price) as sum FROM bookings WHERE status = "completed"').get().sum || 0;

  res.json({ totalUsers, totalProviders, totalBookings, totalRevenue });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Luxora Backend API server running on http://localhost:${PORT}`);
});
