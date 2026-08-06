import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'luxora.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

export function initDb() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'customer', -- 'customer', 'provider', 'admin'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Provider KYC & Details table
  db.exec(`
    CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      nic TEXT,
      kyc_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
      category TEXT, -- 'Auto Care', 'Garden Care', 'Pet Care'
      availability_status TEXT DEFAULT 'available', -- 'available', 'busy', 'offline'
      earnings REAL DEFAULT 0.0,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Service Categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT
    );
  `);

  // Services
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      duration_mins INTEGER DEFAULT 60,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // Subscription Plans
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL, -- 'single', 'combo'
      price_monthly REAL NOT NULL,
      description TEXT,
      features TEXT -- JSON string array
    );
  `);

  // Customer Subscriptions
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_date DATETIME,
      status TEXT DEFAULT 'active',
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(plan_id) REFERENCES subscription_plans(id)
    );
  `);

  // Bookings
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      provider_id INTEGER,
      service_id INTEGER NOT NULL,
      booking_date TEXT NOT NULL,
      booking_time TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
      pin_code TEXT NOT NULL,
      before_photo TEXT,
      after_photo TEXT,
      total_price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(provider_id) REFERENCES providers(id),
      FOREIGN KEY(service_id) REFERENCES services(id)
    );
  `);

  // Reviews & Ratings
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      provider_id INTEGER NOT NULL,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(booking_id) REFERENCES bookings(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(provider_id) REFERENCES providers(id)
    );
  `);

  // Complaints
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      booking_id INTEGER,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'open', -- 'open', 'in_review', 'resolved'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(booking_id) REFERENCES bookings(id)
    );
  `);

  seedData();
}

function seedData() {
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)');
    insertCat.run('Auto Care', 'Luxury automotive detailing, wash, and interior vacuuming at your doorstep.', 'Car');
    insertCat.run('Garden Care', 'Professional lawn mowing, watering, fertilizing, and landscape maintenance.', 'Trees');
    insertCat.run('Pet Care', 'Deluxe pet grooming, walking, bathing, and aquarium maintenance.', 'Dog');

    const insertService = db.prepare('INSERT INTO services (category_id, title, description, price, duration_mins) VALUES (?, ?, ?, ?, ?)');
    // Auto Care (cat_id 1)
    insertService.run(1, 'Wash + Vacuum', 'Premium exterior foam wash, wheel shine, and complete interior deep vacuuming.', 4500, 60);
    insertService.run(1, 'Full Auto Polish & Detailing', 'Paint correction, exterior wax polish, and interior leather conditioning.', 12500, 120);

    // Garden Care (cat_id 2)
    insertService.run(2, 'Lawn Mowing', 'Precision edge trimming and complete lawn mowing.', 3500, 45);
    insertService.run(2, 'Plant Watering & Health Care', 'Deep soil hydration, pest inspection, and botanical health check.', 2500, 30);
    insertService.run(2, 'Fertilizer Application', 'Organic nutrient enrichment and soil conditioning.', 4000, 40);
    insertService.run(2, 'Landscape Maintenance', 'Hedge trimming, weed control, and garden bed redesign.', 8500, 90);

    // Pet Care (cat_id 3)
    insertService.run(3, 'Pet Bathing & Grooming', 'Hypoallergenic spa bath, blow dry, nail trimming, and ear cleaning.', 5000, 60);
    insertService.run(3, 'Pet Walking (45 min)', 'Guided exercise walk and playtime for dogs.', 2000, 45);
    insertService.run(3, 'Fish Tank Cleaning & Water Quality Test', 'Aquarium filter wash, algae removal, and pH balancing.', 6000, 60);

    const insertPlan = db.prepare('INSERT INTO subscription_plans (title, type, price_monthly, description, features) VALUES (?, ?, ?, ?, ?)');
    insertPlan.run(
      'Single Care - Auto Elite',
      'single',
      12000,
      'Bi-weekly exterior wash + interior vacuum for 1 luxury vehicle.',
      JSON.stringify(['2x Wash + Vacuum per month', 'Dedicated KYC provider', 'Priority booking window', '10% off add-on detailing'])
    );
    insertPlan.run(
      'Single Care - Garden Oasis',
      'single',
      15000,
      'Weekly garden upkeep, lawn mowing, and soil nourishment.',
      JSON.stringify(['4x Lawn Mowing & Plant Watering', 'Monthly organic fertilizer treatment', 'Landscape consultation'])
    );
    insertPlan.run(
      'Luxora Tri-Combo Luxury Suite',
      'combo',
      32000,
      'Complete home concierge covering Auto, Garden, and Pet Care under one subscription.',
      JSON.stringify([
        '2x Auto Wash + Vacuum',
        '4x Garden Care & Lawn Mowing',
        '2x Pet Spa Bathing or Aquarium Service',
        'Zero cancellation fees',
        'VIP concierge hotline support'
      ])
    );
  }
  seedAccounts();
}

// Universal demo accounts (shared password) — created once on fresh DB
function seedAccounts() {
  const UNIVERSAL_PW = 'Luxora@123';
  const ensure = (name, email, password, phone, role, nic, category) => {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return existing.id;
    const password_hash = bcrypt.hashSync(password, 10);
    const res = db.prepare('INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)')
      .run(name, email, password_hash, phone || '', role);
    const userId = res.lastInsertRowid;
    if (role === 'provider') {
      db.prepare('INSERT INTO providers (user_id, nic, category, kyc_status) VALUES (?, ?, ?, ?)')
        .run(userId, nic || '123456789V', category || 'Auto Care', 'approved');
    }
    return userId;
  };

  ensure('Demo Customer', 'customer@luxora.lk', UNIVERSAL_PW, '0771000001', 'customer', null, null);
  ensure('Demo Provider', 'provider@luxora.lk', UNIVERSAL_PW, '0771000002', 'provider', '123456789V', 'Auto Care');
  ensure('Demo Admin', 'admin@luxora.lk', UNIVERSAL_PW, '0771000003', 'admin', null, null);
}

export default db;
