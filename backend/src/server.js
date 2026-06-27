const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const steamService = require('./services/steamService');
const { initWhatsAppClient } = require('./services/whatsappService');
const { startPriceTrackingJobs } = require('./jobs/cronJob');

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', apiLimiter);

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

const sortMap = {
  atl: 'allTimeLowPrice',
  discount: 'discountPercent',
  price: 'currentPrice',
  name: 'name'
};

app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      steamId: user.steamId,
      region: user.region,
      whatsappNumber: user.whatsappNumber,
      whatsappEnabled: user.whatsappEnabled
    }
  });
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      steamId: user.steamId,
      region: user.region,
      whatsappNumber: user.whatsappNumber,
      whatsappEnabled: user.whatsappEnabled
    }
  });
});

app.get('/api/profile', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      steamId: true,
      region: true,
      whatsappNumber: true,
      whatsappEnabled: true,
      createdAt: true
    }
  });

  return res.json(user);
});

app.put('/api/profile/steam', authMiddleware, async (req, res) => {
  const { steamId, region, whatsappNumber, whatsappEnabled } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      steamId: steamId || null,
      region: region || 'USD',
      whatsappNumber: whatsappNumber || null,
      whatsappEnabled: Boolean(whatsappEnabled)
    }
  });

  return res.json(user);
});

app.post('/api/wishlist/sync', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!user?.steamId) {
    return res.status(400).json({ error: 'Link a Steam profile first' });
  }

  const games = await steamService.fetchSteamWishlist(user.steamId, user.region);

  for (const game of games) {
    const allTimeLowPrice = await steamService.fetchAllTimeLow(game.steamAppId);

    await prisma.game.upsert({
      where: { steamAppId: game.steamAppId },
      update: { ...game, allTimeLowPrice, lastUpdated: new Date() },
      create: { ...game, allTimeLowPrice }
    });
  }

  return res.json({ count: games.length, games });
});

app.get('/api/games', authMiddleware, async (req, res) => {
  const sortBy = sortMap[req.query.sortBy] || 'name';
  const sortOrder = String(req.query.order).toLowerCase() === 'desc' ? 'desc' : 'asc';

  const games = await prisma.game.findMany({
    orderBy: {
      [sortBy]: sortOrder
    }
  });

  res.json(games);
});

app.get('/api/categories', authMiddleware, async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.user.id },
    include: {
      items: {
        orderBy: { order: 'asc' },
        include: { game: true }
      }
    },
    orderBy: { order: 'asc' }
  });

  res.json(categories);
});

app.post('/api/categories', authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const lastCategory = await prisma.category.findFirst({
    where: { userId: req.user.id },
    orderBy: { order: 'desc' }
  });

  const category = await prisma.category.create({
    data: {
      userId: req.user.id,
      name: name.trim(),
      order: (lastCategory?.order || 0) + 1
    }
  });

  res.status(201).json(category);
});

app.put('/api/categories/:id', authMiddleware, async (req, res) => {
  const categoryId = Number(req.params.id);
  const { name, order } = req.body;

  const updated = await prisma.category.updateMany({
    where: { id: categoryId, userId: req.user.id },
    data: {
      ...(name ? { name: String(name).trim() } : {}),
      ...(Number.isInteger(order) ? { order } : {})
    }
  });

  if (!updated.count) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  return res.json(category);
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  const categoryId = Number(req.params.id);

  const deleted = await prisma.category.deleteMany({
    where: { id: categoryId, userId: req.user.id }
  });

  if (!deleted.count) {
    return res.status(404).json({ error: 'Category not found' });
  }

  return res.status(204).send();
});

app.post('/api/categories/reorder', authMiddleware, async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array is required' });
  }

  const categoryIds = [...new Set(items.map((item) => Number(item.categoryId)).filter(Boolean))];
  const ownedCategories = await prisma.category.findMany({
    where: {
      userId: req.user.id,
      id: { in: categoryIds }
    },
    select: { id: true }
  });

  const ownedSet = new Set(ownedCategories.map((category) => category.id));

  for (const item of items) {
    const categoryId = Number(item.categoryId);
    const steamAppId = Number(item.steamAppId);

    if (!ownedSet.has(categoryId)) {
      return res.status(403).json({ error: 'Cannot modify category that does not belong to user' });
    }

    await prisma.categoryItem.upsert({
      where: {
        categoryId_steamAppId: {
          categoryId,
          steamAppId
        }
      },
      update: {
        order: Number(item.order) || 0
      },
      create: {
        categoryId,
        steamAppId,
        order: Number(item.order) || 0
      }
    });
  }

  return res.json({ updated: items.length });
});

app.use((error, req, res, _next) => {
  console.error('[Server Error]', error);
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({ error: error.message || 'Internal Server Error' });
});

initWhatsAppClient();
startPriceTrackingJobs(prisma);

app.listen(PORT, () => {
  console.log(`SteamA backend listening on http://localhost:${PORT}`);
});
