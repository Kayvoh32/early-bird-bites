// database.js — SQLite setup, schema creation, and seed data
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'earlybird.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    price       REAL    NOT NULL,
    image       TEXT,
    category_id INTEGER NOT NULL,
    available   INTEGER DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS employees (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    username TEXT    NOT NULL UNIQUE,
    password TEXT    NOT NULL,
    role     TEXT    NOT NULL CHECK(role IN ('cashier','manager'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    total_amount REAL    NOT NULL,
    status       TEXT    DEFAULT 'confirmed',
    cashier_id   INTEGER,
    timestamp    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id     INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity     INTEGER NOT NULL,
    price_each   REAL    NOT NULL,
    FOREIGN KEY (order_id)     REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  );
`);

// ─────────────────────────────────────────────────────────
// SEED DATA — only runs if tables are empty
// ─────────────────────────────────────────────────────────
const categoryCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;

if (categoryCount === 0) {
  console.log('Seeding database...');

  // Categories
  const insertCat = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const cats = [
    'Breakfast Specials',
    'Main Meals',
    'Snacks & Light Meals',
    'Desserts & Pastries',
    'Drinks & Beverages',
    'Extras & Sides'
  ];
  const catIds = {};
  cats.forEach(name => {
    const result = insertCat.run(name);
    catIds[name] = result.lastInsertRowid;
  });

  // Menu Items
  const insertItem = db.prepare(
    'INSERT INTO menu_items (name, price, image, category_id) VALUES (?, ?, ?, ?)'
  );
  const items = [
    // Breakfast
    ['Mandazi',    20,  'images/mandazi.jpg',      catIds['Breakfast Specials']],
    ['Chapati',    30,  'images/chapati.jpg',       catIds['Breakfast Specials']],
    ['Omelette',   60,  'images/omelette.jpg',      catIds['Breakfast Specials']],
    ['Tea',        30,  'images/tea.jpg',            catIds['Breakfast Specials']],
    ['Coffee',     40,  'images/black_coffee.jpg',  catIds['Breakfast Specials']],
    // Mains
    ['Ugali Beef Stew', 150, 'images/ugali_beef.jpg', catIds['Main Meals']],
    ['Pilau',           130, 'images/pilau.jpg',       catIds['Main Meals']],
    ['Chicken Stew',    180, 'images/chicken.jpg',     catIds['Main Meals']],
    ['Githeri',         100, 'images/githeri.jpg',     catIds['Main Meals']],
    ['Fish Fry',        200, 'images/fish_fry.jpg',    catIds['Main Meals']],
    // Snacks
    ['Chips',    80, 'images/chips.jpeg',   catIds['Snacks & Light Meals']],
    ['Smokie',   40, 'images/smokie.jpg',   catIds['Snacks & Light Meals']],
    ['Samosa',   30, 'images/samosa.jpg',   catIds['Snacks & Light Meals']],
    ['Sandwich', 90, 'images/sandwich.jpg', catIds['Snacks & Light Meals']],
    ['Sausage',  50, 'images/sausage.jpg',  catIds['Snacks & Light Meals']],
    // Desserts
    ['Fruit Salad', 80,  'images/fruit_salad.jpg', catIds['Desserts & Pastries']],
    ['Pancakes',    100, 'images/pancake.jpg',      catIds['Desserts & Pastries']],
    ['Muffins',     70,  'images/muffin.jpg',       catIds['Desserts & Pastries']],
    ['Doughnuts',   60,  'images/doughnut.jpg',     catIds['Desserts & Pastries']],
    // Drinks
    ['Soda',        50,  'images/soda.png',       catIds['Drinks & Beverages']],
    ['Fresh Juice', 80,  'images/juice.jpg',      catIds['Drinks & Beverages']],
    ['Water',       30,  'images/water.jpg',      catIds['Drinks & Beverages']],
    ['Milkshake',   120, 'images/milkshake.jpg',  catIds['Drinks & Beverages']],
    // Extras
    ['Kachumbari', 20, 'images/kachumbari.jpg', catIds['Extras & Sides']],
    ['Greens',     30, 'images/greens.jpg',      catIds['Extras & Sides']],
  ];
  items.forEach(i => insertItem.run(...i));

  // Employees (passwords hashed)
  const insertEmp = db.prepare(
    'INSERT INTO employees (name, username, password, role) VALUES (?, ?, ?, ?)'
  );
  const managerPass = bcrypt.hashSync('admin123', 10);
  const cashierPass = bcrypt.hashSync('cashier123', 10);
  insertEmp.run('Admin Manager', 'admin',    managerPass, 'manager');
  insertEmp.run('Jane Cashier', 'cashier1', cashierPass, 'cashier');

  console.log('Database seeded successfully.');
}

module.exports = db;
