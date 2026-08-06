import express from 'express';
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db, { initDb } from './db.js';
import { authenticateToken, requireRole, JWT_SECRET } from './auth.js';

initDb();

// Runtime tables (not in db.js seed) — created idempotently
db.exec(`
  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    code TEXT,
    discount_pct REAL DEFAULT 0,
    active INTEGER DEFAULT 1
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
// Seed a welcome promotion if none exist
if (db.prepare('SELECT COUNT(*) as c FROM promotions').get().c === 0) {
  db.prepare(`INSERT INTO promotions (title, description, code, discount_pct)
    VALUES (?, ?, ?, ?)`).run(
    'Welcome to Luxora',
    '15% off your first subscription — a gift for joining the concierge network.',
    'LUXORA15',
    15
  );
}

// Helper: push a notification
function notify(userId, message, link = null) {
  try {
    db.prepare('INSERT INTO notifications (user_id, message, link) VALUES (?, ?, ?)')
      .run(userId, message, link);
  } catch (_) { /* non-fatal */ }
}

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

  if (provider_id) {
    const pUser = db.prepare('SELECT user_id FROM providers WHERE id = ?').get(provider_id);
    if (pUser) notify(pUser.user_id, `New booking assigned: ${service.title} on ${booking_date} at ${booking_time}.`);
  }

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
    notify(booking.user_id, `Your ${booking.service_id ? 'service' : 'booking'} #${id} has been completed. Leave a review!`, '/reviews');
  } else if (status === 'in_progress') {
    notify(booking.user_id, `Your provider has started service on booking #${id}.`);
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
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('customer').count;
  const totalProviders = db.prepare('SELECT COUNT(*) as count FROM providers WHERE kyc_status = ?').get('approved').count;
  const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
  const totalRevenue = db.prepare('SELECT SUM(total_price) as sum FROM bookings WHERE status = ?').get('completed').sum || 0;

  res.json({ totalUsers, totalProviders, totalBookings, totalRevenue });
});

// ----------------------------------------------------
// 6. CUSTOMER DASHBOARD
// ----------------------------------------------------

app.get('/api/customer/dashboard', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const profile = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(userId);

  const activeSubs = db.prepare(`
    SELECT us.*, sp.title, sp.type, sp.price_monthly, sp.description
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = ? AND us.status = 'active'
    ORDER BY us.start_date DESC
  `).all(userId).map(s => ({ ...s, features: [] }));

  const bookings = db.prepare(`
    SELECT b.*, s.title as service_title, s.description as service_desc, c.name as category_name,
           u.name as provider_name, u.phone as provider_phone
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN categories c ON s.category_id = c.id
    LEFT JOIN providers p ON b.provider_id = p.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE b.user_id = ?
    ORDER BY b.booking_date ASC, b.booking_time ASC
  `).all(userId);

  const now = new Date();
  const upcoming = bookings.filter(b => {
    if (b.status === 'completed' || b.status === 'cancelled') return false;
    const d = new Date(`${b.booking_date}T${b.booking_time || '00:00'}`);
    return d >= now;
  });
  const past = bookings.filter(b => !upcoming.includes(b));

  const reviews = db.prepare(`
    SELECT r.*, s.title as service_title, u.name as provider_name
    FROM reviews r
    JOIN bookings b ON r.booking_id = b.id
    JOIN services s ON b.service_id = s.id
    LEFT JOIN providers p ON r.provider_id = p.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `).all(userId);

  res.json({ profile, activeSubscriptions: activeSubs, upcomingBookings: upcoming, pastBookings: past, reviews });
});

// Customer cancels own pending booking
app.put('/api/bookings/:id/cancel', authenticateToken, (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status !== 'pending' && booking.status !== 'assigned') {
    return res.status(400).json({ error: 'Only pending or assigned bookings can be cancelled' });
  }
  db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  res.json({ message: 'Booking cancelled' });
});

// ----------------------------------------------------
// 7. PROVIDER ENHANCEMENTS
// ----------------------------------------------------

app.put('/api/provider/availability', authenticateToken, requireRole('provider'), (req, res) => {
  const { availability_status } = req.body;
  const allowed = ['available', 'busy', 'offline'];
  if (!allowed.includes(availability_status)) return res.status(400).json({ error: 'Invalid availability status' });
  const provider = db.prepare('SELECT id FROM providers WHERE user_id = ?').get(req.user.id);
  if (!provider) return res.status(404).json({ error: 'Provider record not found' });
  db.prepare('UPDATE providers SET availability_status = ? WHERE id = ?').run(availability_status, provider.id);
  res.json({ message: `Availability set to ${availability_status}`, availability_status });
});

app.get('/api/provider/earnings', authenticateToken, requireRole('provider'), (req, res) => {
  const provider = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(req.user.id);
  if (!provider) return res.status(404).json({ error: 'Provider record not found' });
  const completedJobs = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE provider_id = ? AND status = 'completed'").get(provider.id).c;
  const history = db.prepare(`
    SELECT b.id, b.booking_date, b.booking_time, s.title as service_title, b.total_price, b.status
    FROM bookings b JOIN services s ON b.service_id = s.id
    WHERE b.provider_id = ? ORDER BY b.booking_date DESC LIMIT 50
  `).all(provider.id);
  res.json({ earnings: provider.earnings, completedJobs, history });
});

// ----------------------------------------------------
// 8. PROMOTIONS
// ----------------------------------------------------

app.get('/api/promotions', (req, res) => {
  const promos = db.prepare('SELECT *, (active = 1) AS is_active FROM promotions WHERE active = 1').all();
  res.json(promos);
});

app.post('/api/admin/promotions', authenticateToken, requireRole('admin'), (req, res) => {
  const { title, description, code, discount_pct } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const result = db.prepare('INSERT INTO promotions (title, description, code, discount_pct) VALUES (?, ?, ?, ?)')
    .run(title, description || '', code || '', discount_pct || 0);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Promotion created' });
});

app.put('/api/admin/promotions/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const p = db.prepare('SELECT * FROM promotions WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Promotion not found' });
  db.prepare('UPDATE promotions SET active = ? WHERE id = ?').run(p.active ? 0 : 1, req.params.id);
  res.json({ message: `Promotion ${p.active ? 'deactivated' : 'activated'}` });
});

// ----------------------------------------------------
// 9. ADMIN BOOKINGS & COMPLAINTS
// ----------------------------------------------------

app.get('/api/admin/bookings', authenticateToken, requireRole('admin'), (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, s.title as service_title, c.name as category_name,
           cu.name as customer_name, cu.email as customer_email,
           pu.name as provider_name
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN categories c ON s.category_id = c.id
    JOIN users cu ON b.user_id = cu.id
    LEFT JOIN providers p ON b.provider_id = p.id
    LEFT JOIN users pu ON p.user_id = pu.id
    ORDER BY b.created_at DESC
  `).all();
  res.json(bookings);
});

// Admin override: change booking status or reassign provider / mark completed (payout)
app.put('/api/admin/bookings/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { status, provider_id } = req.body;
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  const provider = provider_id ? db.prepare('SELECT id FROM providers WHERE id = ?').get(provider_id) : null;
  if (provider_id && !provider) return res.status(400).json({ error: 'Invalid provider' });

  if (status === 'completed' && booking.status !== 'completed' && booking.provider_id) {
    const payout = booking.total_price * 0.85;
    db.prepare('UPDATE providers SET earnings = earnings + ? WHERE id = ?').run(payout, booking.provider_id);
  }
  db.prepare('UPDATE bookings SET status = COALESCE(?, status), provider_id = COALESCE(?, provider_id) WHERE id = ?')
    .run(status || null, provider_id || null, id);
  res.json({ message: `Booking #${id} updated` });
});

app.get('/api/admin/complaints', authenticateToken, requireRole('admin'), (req, res) => {
  const complaints = db.prepare(`
    SELECT cm.*, u.name as customer_name, u.email as customer_email,
           s.title as service_title
    FROM complaints cm
    JOIN users u ON cm.user_id = u.id
    LEFT JOIN bookings b ON cm.booking_id = b.id
    LEFT JOIN services s ON b.service_id = s.id
    ORDER BY cm.created_at DESC
  `).all();
  res.json(complaints);
});

app.put('/api/admin/complaints/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const { status } = req.body;
  const allowed = ['open', 'in_review', 'resolved'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE complaints SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: `Complaint updated to ${status}` });
});

// ----------------------------------------------------
// 10. NOTIFICATIONS
// ----------------------------------------------------

app.get('/api/notifications', authenticateToken, (req, res) => {
  const notes = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json(notes);
});

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Marked read' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Luxora Backend API server running on http://localhost:${PORT}`);
});
