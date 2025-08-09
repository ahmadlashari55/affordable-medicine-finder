require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const DB = require('./utils/db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

// --- Helpers ---
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth header' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ---- Routes ----
// Basic health check
app.get('/', (req, res) => res.json({ ok: true, message: "AMF backend" }));

// Search medicines: /api/medicines?q=&city=&sort=&limit=
app.get('/api/medicines', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const city = (req.query.city || 'all');
  const sort = req.query.sort || 'relevance';
  const limit = parseInt(req.query.limit || '50', 10);

  const all = DB.getAll('medicines');
  let results = all.filter(m => {
    if (!q) return true;
    return m.name.toLowerCase().includes(q) ||
           (m.generic || '').toLowerCase().includes(q) ||
           (m.brands || []).some(b => b.toLowerCase().includes(q));
  });

  if (sort === 'priceLow') results.sort((a,b)=>a.price - b.price);
  if (sort === 'priceHigh') results.sort((a,b)=>b.price - a.price);

  results = results.slice(0, limit);
  res.json(results);
});

// get single medicine
app.get('/api/medicines/:id', (req, res) => {
  const id = req.params.id;
  const med = DB.find('medicines', x => x.id === id);
  if (!med) return res.status(404).json({ error: 'Not found' });
  res.json(med);
});

// pharmacies (optionally by city)
app.get('/api/pharmacies', (req, res) => {
  const city = (req.query.city || 'all');
  const all = DB.getAll('pharmacies');
  const list = city === 'all' ? all : all.filter(p=>p.city === city);
  res.json(list);
});

// place order (requires auth)
app.post('/api/orders', authMiddleware, (req, res) => {
  const db = DB.readDB();
  const { userId } = req.user;
  const { items, pharmacyId, address } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items' });

  // reduce stock (basic) and create order
  const pharmIndex = db.pharmacies.findIndex(p=>p.id === pharmacyId);
  if (pharmIndex === -1) return res.status(400).json({ error: 'Pharmacy not found' });

  const pharmacy = db.pharmacies[pharmIndex];
  // check stock availability
  for (const it of items) {
    const medId = it.id;
    const qty = it.qty || 1;
    if (!pharmacy.stock[medId] || pharmacy.stock[medId] < qty) {
      return res.status(400).json({ error: `Insufficient stock for ${medId} at selected pharmacy` });
    }
  }
  // reduce stock
  for (const it of items) {
    const medId = it.id;
    const qty = it.qty || 1;
    pharmacy.stock[medId] = pharmacy.stock[medId] - qty;
  }

  const order = {
    id: 'o_' + uuidv4(),
    userId,
    pharmacyId,
    items,
    address,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.orders.push(order);
  DB.setDB(db);
  res.json({ ok: true, order });
});

// simple user register
app.post('/api/auth/register', async (req, res) => {
  const db = DB.readDB();
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email/password required' });
  const exist = db.users.find(u => u.email === email);
  if (exist) return res.status(400).json({ error: 'User exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: 'u_'+uuidv4(), name, email, passwordHash, favorites: [] };
  db.users.push(user);
  DB.setDB(db);
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email } });
});

// simple login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = DB.readDB();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email } });
});

// get user profile (auth)
app.get('/api/me', authMiddleware, (req, res) => {
  const db = DB.readDB();
  const user = db.users.find(u => u.id === req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash, ...rest } = user;
  res.json({ ok: true, user: rest });
});

// admin add medicine (very simple)
app.post('/api/medicines', (req, res) => {
  const db = DB.readDB();
  const item = req.body;
  item.id = item.id || 'm_' + uuidv4();
  db.medicines.push(item);
  DB.setDB(db);
  res.json({ ok: true, item });
});

app.listen(PORT, () => {
  console.log(`AMF backend running on http://localhost:${PORT}`);
});
