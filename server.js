// server.js — Early Bird Bites Express Backend
// Run: node server.js  (or: npm run dev for auto-reload)
// Serves frontend files + all API routes

const express  = require('express');
const session  = require('express-session');
const bcrypt   = require('bcryptjs');
const cors     = require('cors');
const path     = require('path');
const db       = require('./database');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'earlybird-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 8 * 60 * 60 * 1000 } // 8 hours
}));

// Serve frontend static files from project root
app.use(express.static(path.join(__dirname)));

// ─────────────────────────────────────────────────────────
// AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

function requireManager(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'manager') return next();
  return res.status(403).json({ error: 'Manager access required' });
}

// ─────────────────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────────────────

// POST /LoginServlet — matches existing frontend calls
app.post('/LoginServlet', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    const employee = db.prepare(
      'SELECT * FROM employees WHERE username = ?'
    ).get(username);

    if (!employee || !bcrypt.compareSync(password, employee.password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    // Store user in session
    req.session.user = { id: employee.id, name: employee.name, role: employee.role };
    return res.json({ role: employee.role, name: employee.name });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /logout
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

// GET /session — check current session
app.get('/session', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'No active session' });
  }
});

// ─────────────────────────────────────────────────────────
// MENU ROUTES
// ─────────────────────────────────────────────────────────

// GET /menuItems — all items with category name joined
app.get('/menuItems', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT m.id, m.name, m.price, m.image, m.available,
             c.name AS category, c.id AS category_id
      FROM   menu_items m
      JOIN   categories c ON m.category_id = c.id
      WHERE  m.available = 1
      ORDER  BY c.id, m.name
    `).all();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// GET /menu — alias used by some frontend pages
app.get('/menu', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT m.id, m.name, m.price, m.image,
             c.name AS category, c.id AS category_id
      FROM   menu_items m
      JOIN   categories c ON m.category_id = c.id
      ORDER  BY c.id, m.name
    `).all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// GET /categories
app.get('/categories', (req, res) => {
  try {
    const cats = db.prepare('SELECT * FROM categories ORDER BY id').all();
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /add-menu — manager only
app.post('/add-menu', requireAuth, requireManager, (req, res) => {
  const { name, price, image, category_id } = req.body;
  if (!name || !price || !category_id) {
    return res.status(400).send('Name, price, and category are required');
  }
  try {
    db.prepare(
      'INSERT INTO menu_items (name, price, image, category_id) VALUES (?, ?, ?, ?)'
    ).run(name, parseFloat(price), image || null, parseInt(category_id));
    res.send(`Item "${name}" added successfully`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to add item');
  }
});

// DELETE /deleteMenuItem?id=N — manager only
app.delete('/deleteMenuItem', requireAuth, requireManager, (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send('ID required');
  try {
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(parseInt(id));
    res.send('Item deleted');
  } catch (err) {
    res.status(500).send('Failed to delete item');
  }
});

// DELETE /menuItems/:id — manager only, matches frontend delete call
app.delete('/menuItems/:id', requireAuth, requireManager, (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).send('ID required');
  try {
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(parseInt(id));
    res.send('Item deleted');
  } catch (err) {
    res.status(500).send('Failed to delete item');
  }
});

// ─────────────────────────────────────────────────────────
// ORDER ROUTES
// ─────────────────────────────────────────────────────────

// POST /PlaceOrderServlet — matches existing frontend calls
app.post('/PlaceOrderServlet', requireAuth, (req, res) => {
  const { items, totalAmount } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'No items in order' });
  }
  try {
    // Insert order
    const orderResult = db.prepare(
      'INSERT INTO orders (total_amount, cashier_id) VALUES (?, ?)'
    ).run(totalAmount, req.session.user.id);
    const orderId = orderResult.lastInsertRowid;

    // Insert order items
    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, menu_item_id, quantity, price_each) VALUES (?, ?, ?, ?)'
    );
    // Get price from DB for each item (don't trust client price)
    const getPrice = db.prepare('SELECT price FROM menu_items WHERE id = ?');

    const insertMany = db.transaction((orderItems) => {
      for (const item of orderItems) {
        const menuItem = getPrice.get(item.menuItemId);
        if (!menuItem) throw new Error(`Item ${item.menuItemId} not found`);
        insertItem.run(orderId, item.menuItemId, item.quantity, menuItem.price);
      }
    });
    insertMany(items);

    res.json({ orderId, message: 'Order placed successfully' });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: err.message || 'Failed to place order' });
  }
});

// POST /place-order — alias
app.post('/place-order', requireAuth, (req, res) => {
  req.url = '/PlaceOrderServlet';
  app.handle(req, res);
});

// GET /orders — manager only
app.get('/orders', requireAuth, requireManager, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.id, o.total_amount, o.status, o.timestamp,
             e.name AS cashier_name
      FROM   orders o
      LEFT   JOIN employees e ON o.cashier_id = e.id
      ORDER  BY o.timestamp DESC
      LIMIT  100
    `).all();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ─────────────────────────────────────────────────────────
// EMPLOYEE ROUTES
// ─────────────────────────────────────────────────────────

// GET /employees — manager only
app.get('/employees', requireAuth, requireManager, (req, res) => {
  try {
    const employees = db.prepare(
      'SELECT id, name, username, role FROM employees ORDER BY role, name'
    ).all();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// POST /employees — add new employee, manager only
app.post('/employees', requireAuth, requireManager, (req, res) => {
  const { name, username, password, role } = req.body;
  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'All fields required' });
  }
  try {
    const hashed = bcrypt.hashSync(password, 10);
    db.prepare(
      'INSERT INTO employees (name, username, password, role) VALUES (?, ?, ?, ?)'
    ).run(name, username, hashed, role);
    res.json({ message: `Employee "${name}" added` });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

// ─────────────────────────────────────────────────────────
// SALES REPORT
// ─────────────────────────────────────────────────────────

// GET /sales-report — manager only
app.get('/sales-report', requireAuth, requireManager, (req, res) => {
  try {
    // Daily totals
    const daily = db.prepare(`
      SELECT DATE(timestamp) AS day,
             ROUND(SUM(total_amount), 2) AS total_sales,
             COUNT(*) AS orders_count
      FROM   orders
      WHERE  status = 'confirmed'
      GROUP  BY DATE(timestamp)
      ORDER  BY day DESC
      LIMIT  30
    `).all();

    // Item breakdown
    const items = db.prepare(`
      SELECT DATE(o.timestamp) AS day,
             m.name AS item_name,
             SUM(oi.quantity) AS total_sold,
             ROUND(SUM(oi.quantity * oi.price_each), 2) AS total_revenue
      FROM   order_items oi
      JOIN   orders o  ON oi.order_id     = o.id
      JOIN   menu_items m ON oi.menu_item_id = m.id
      WHERE  o.status = 'confirmed'
      GROUP  BY DATE(o.timestamp), m.id
      ORDER  BY day DESC, total_revenue DESC
      LIMIT  100
    `).all();

    res.json({ daily, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ─────────────────────────────────────────────────────────
// CATCH-ALL — serve frontend index for SPA routing
// ─────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ─────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌅 Early Bird Bites server running`);
  console.log(`   Local:  http://localhost:${PORT}`);
  console.log(`   Press Ctrl+C to stop\n`);
});
