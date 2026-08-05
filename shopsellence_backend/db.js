const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

let dbType = 'sqlite';
let sqliteDb = null;
let pgPool = null;

const dbPath = path.join(__dirname, 'database.sqlite');
const connectionString = process.env.DATABASE_URL;

if (connectionString) {
  console.log('🔌 DATABASE_URL found. Initializing PostgreSQL pool...');
  pgPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Render Postgres
  });
  dbType = 'postgres';
} else {
  console.log(`🔌 No DATABASE_URL found. Initializing SQLite local database at ${dbPath}...`);
  sqliteDb = new sqlite3.Database(dbPath);
  dbType = 'sqlite';
}

// Helper to execute raw queries
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (dbType === 'postgres') {
      // Postgres parameters are $1, $2, etc. If the query was written for SQLite (?, ?, etc.),
      // we need to translate ? to $1, $2 etc.
      let pgSql = sql;
      let index = 1;
      while (pgSql.includes('?')) {
        pgSql = pgSql.replace('?', `$${index++}`);
      }
      pgPool.query(pgSql, params, (err, res) => {
        if (err) return reject(err);
        resolve(res.rows);
      });
    } else {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    }
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (dbType === 'postgres') {
      let pgSql = sql;
      let index = 1;
      while (pgSql.includes('?')) {
        pgSql = pgSql.replace('?', `$${index++}`);
      }
      pgPool.query(pgSql, params, (err, res) => {
        if (err) return reject(err);
        resolve({ lastID: null, changes: res.rowCount });
      });
    } else {
      sqliteDb.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    }
  });
}

// Set up table schemas
async function initDb() {
  const isPostgres = dbType === 'postgres';
  
  const textType = isPostgres ? 'TEXT' : 'TEXT';
  const serialType = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  
  // Create tables
  await run(`
    CREATE TABLE IF NOT EXISTS outfits (
      id ${serialType},
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      image TEXT NOT NULL,
      price TEXT NOT NULL,
      oldPrice TEXT,
      description TEXT,
      colours TEXT,
      sizes TEXT,
      fabric TEXT,
      availability TEXT,
      badge TEXT,
      badgeText TEXT,
      tags TEXT
    )
  `);

  try {
    await run(`ALTER TABLE outfits ADD COLUMN tags TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  await run(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id ${serialType},
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      submittedAt TEXT NOT NULL
    )
  `);

  // Simple Analytics Tables
  await run(`
    CREATE TABLE IF NOT EXISTS analytics_views (
      date TEXT PRIMARY KEY,
      views TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS analytics_outfits (
      outfitId TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      views INTEGER DEFAULT 0
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id ${serialType},
      type TEXT NOT NULL,
      data TEXT,
      timestamp TEXT NOT NULL
    )
  `);

  // Seed default data if outfits table is empty
  const existingOutfits = await query('SELECT COUNT(*) as count FROM outfits');
  if (parseInt(existingOutfits[0].count || existingOutfits[0].COUNT || 0) === 0) {
    console.log('🌱 Seeding database with default outfits...');
    
    const defaultOutfits = [
      {
        id: 1,
        name: 'Rossi Premium Leather Loafers',
        category: 'shoes',
        image: 'shopsellence_images/rossi_loafers.png',
        price: '₦120,000',
        oldPrice: '₦150,000',
        description: 'Premium Italian leather loafers crafted for absolute comfort, style, and everyday luxury.',
        colours: JSON.stringify(['#8B5A2B', '#000000']),
        sizes: '40, 41, 42, 43, 44, 45',
        fabric: 'Genuine Italian Leather',
        availability: 'In Stock',
        badge: 'new',
        badgeText: 'Premium',
        tags: JSON.stringify(['Shoes'])
      },
      {
        id: 2,
        name: 'Bagrato Premium Slim Fit White Shirt',
        category: 'outfits',
        image: 'shopsellence_images/bagrato_shirt.png',
        price: '₦35,000',
        oldPrice: '₦45,000',
        description: 'Bespoke slim fit white shirt crafted from high-quality soft fabric. Lightweight, durable, and the perfect gift for any gentleman.',
        colours: JSON.stringify(['#FFFFFF']),
        sizes: 'M, L, XL, XXL',
        fabric: 'Premium Cotton',
        availability: 'In Stock',
        badge: 'sale',
        badgeText: 'Best Seller',
        tags: JSON.stringify(['Shirts'])
      }
    ];

    for (const item of defaultOutfits) {
      if (isPostgres) {
        await run(
          `INSERT INTO outfits (name, category, image, price, oldPrice, description, colours, sizes, fabric, availability, badge, badgeText, tags)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [item.name, item.category, item.image, item.price, item.oldPrice, item.description, item.colours, item.sizes, item.fabric, item.availability, item.badge, item.badgeText, item.tags]
        );
      } else {
        await run(
          `INSERT INTO outfits (id, name, category, image, price, oldPrice, description, colours, sizes, fabric, availability, badge, badgeText, tags)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [item.id, item.name, item.category, item.image, item.price, item.oldPrice, item.description, item.colours, item.sizes, item.fabric, item.availability, item.badge, item.badgeText, item.tags]
        );
      }
    }
    console.log('✅ Seeding complete.');
  }

  // Seed new default outfits individually if they are missing
  const extraOutfits = [
    {
      name: 'Bonito Estilo',
      category: 'shoes',
      image: 'shopsellence_images/Bonito.png',
      price: '₦120,000',
      oldPrice: '₦150,000',
      description: 'Bespoke premium leather shoes crafted with styling and ultimate comfort in mind.',
      colours: JSON.stringify(['#000000', '#1F2937']),
      sizes: '40, 41, 42, 43, 44, 45',
      fabric: 'Genuine Leather',
      availability: 'In Stock',
      badge: 'new',
      badgeText: 'Trending',
      tags: JSON.stringify(['Shoes'])
    },
    {
      name: 'White Leather Rossi',
      category: 'shoes',
      image: 'shopsellence_images/White Leather Rossi.png',
      price: '₦120,000',
      oldPrice: '₦150,000',
      description: 'Classic luxury white leather shoes tailored for maximum sophistication.',
      colours: JSON.stringify(['#FFFFFF']),
      sizes: '40, 41, 42, 43, 44, 45',
      fabric: 'Genuine Italian Leather',
      availability: 'In Stock',
      badge: 'new',
      badgeText: 'Premium',
      tags: JSON.stringify(['Shoes'])
    },
    {
      name: 'Rossi Sport Classic',
      category: 'shoes',
      image: 'shopsellence_images/ROSSI.png',
      price: '₦125,000',
      oldPrice: '₦160,000',
      description: 'Handcrafted luxury sport shoes designed for comfort and active styling.',
      colours: JSON.stringify(['#000000', '#8B5A2B']),
      sizes: '40, 41, 42, 43, 44, 45',
      fabric: 'Genuine Leather',
      availability: 'In Stock',
      badge: 'luxury',
      badgeText: 'Classic',
      tags: JSON.stringify(['Shoes'])
    }
  ];

  for (const item of extraOutfits) {
    const check = await query('SELECT COUNT(*) as count FROM outfits WHERE name = ?', [item.name]);
    if (parseInt(check[0].count || check[0].COUNT || 0) === 0) {
      console.log(`🌱 Seeding missing outfit: ${item.name}`);
      await run(
        `INSERT INTO outfits (name, category, image, price, oldPrice, description, colours, sizes, fabric, availability, badge, badgeText, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.name, item.category, item.image, item.price, item.oldPrice, item.description, item.colours, item.sizes, item.fabric, item.availability, item.badge, item.badgeText, item.tags]
      );
    }
  }
}

module.exports = {
  dbType,
  query,
  run,
  initDb
};
