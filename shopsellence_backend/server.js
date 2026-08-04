const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('./db');

dotenv.config();

const app = express();

// Increase JSON payload limits to allow Base64 image uploads
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const PORT = process.env.PORT || 5000;
const configPath = path.join(__dirname, 'config.json');

// Configure Multer for in-memory image buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

function getAdminPasscode() {
  if (fs.existsSync(configPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (parsed.adminPasscode) return parsed.adminPasscode;
    } catch (e) { /* fall through */ }
  }
  return process.env.ADMIN_PASSCODE || 'Shopsellence2026';
}

// Initialize database schema and server
db.initDb().then(() => {
  console.log('✅ Database tables initialized successfully.');
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
});

// ============================================================
// AUTH ENDPOINTS
// ============================================================
app.post('/api/login', (req, res) => {
  const { passcode } = req.body;
  if (passcode === getAdminPasscode()) {
    res.json({ success: true, token: 'shopsellence_admin_authenticated_session_' + Date.now() });
  } else {
    res.status(401).json({ error: 'Invalid passcode entered.' });
  }
});

app.post('/api/change-passcode', (req, res) => {
  const { currentPasscode, newPasscode } = req.body;

  if (!currentPasscode || !newPasscode) {
    return res.status(400).json({ error: 'Current and new passcodes are required.' });
  }

  if (newPasscode.length < 6) {
    return res.status(400).json({ error: 'New passcode must be at least 6 characters.' });
  }

  if (currentPasscode !== getAdminPasscode()) {
    return res.status(401).json({ error: 'Current passcode is incorrect.' });
  }

  try {
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    config.adminPasscode = newPasscode;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    res.json({ success: true, message: 'Passcode updated successfully.' });
  } catch (e) {
    console.error('Failed to update passcode:', e);
    res.status(500).json({ error: 'Failed to save new passcode.' });
  }
});

// ============================================================
// OUTFITS ENDPOINTS
// ============================================================
app.get('/api/outfits', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM outfits ORDER BY id DESC');
    // Parse colors and tags JSON array/comma list to JavaScript object safely
    const outfits = rows.map(r => {
      let coloursArray = [];
      try {
        coloursArray = JSON.parse(r.colours || '[]');
      } catch (e) {
        coloursArray = (r.colours || '').split(',').map(c => c.trim()).filter(Boolean);
      }
      let tagsArray = [];
      try {
        tagsArray = JSON.parse(r.tags || '[]');
      } catch (e) {
        tagsArray = (r.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      }
      return {
        ...r,
        colours: coloursArray,
        tags: tagsArray
      };
    });
    res.json(outfits);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch outfits.' });
  }
});

app.post('/api/outfits', upload.single('imageFile'), async (req, res) => {
  try {
    const { name, category, price, oldPrice, description, colours, sizes, fabric, availability, badge, badgeText, tags } = req.body;
    let imageUrl = req.body.image || '';

    // If an image file is uploaded, convert it to base64
    if (req.file) {
      imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Name, category, and price are required.' });
    }

    // Colors can come as array or comma list string. Normalize it to stringified JSON.
    let colorsStr = '[]';
    if (colours) {
      try {
        const parsed = typeof colours === 'string' ? JSON.parse(colours) : colours;
        colorsStr = JSON.stringify(parsed);
      } catch (e) {
        colorsStr = JSON.stringify(colours.split(',').map(c => c.trim()).filter(Boolean));
      }
    }

    // Normalize tags
    let tagsStr = '[]';
    if (tags) {
      try {
        const parsed = typeof tags === 'string' ? JSON.parse(tags) : tags;
        tagsStr = JSON.stringify(parsed);
      } catch (e) {
        tagsStr = JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean));
      }
    }

    const result = await db.run(
      `INSERT INTO outfits (name, category, image, price, oldPrice, description, colours, sizes, fabric, availability, badge, badgeText, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, imageUrl, price, oldPrice || null, description || '', colorsStr, sizes || '', fabric || '', availability || 'In Stock', badge || null, badgeText || null, tagsStr]
    );

    res.status(201).json({ success: true, outfitId: result.lastID });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create outfit.' });
  }
});

app.put('/api/outfits/:id', upload.single('imageFile'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, oldPrice, description, colours, sizes, fabric, availability, badge, badgeText, tags } = req.body;
    
    // Check if outfit exists
    const match = await db.query('SELECT * FROM outfits WHERE id = ?', [id]);
    if (match.length === 0) {
      return res.status(404).json({ error: 'Outfit not found.' });
    }

    let imageUrl = req.body.image || match[0].image;
    if (req.file) {
      imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    let colorsStr = match[0].colours;
    if (colours) {
      try {
        const parsed = typeof colours === 'string' ? JSON.parse(colours) : colours;
        colorsStr = JSON.stringify(parsed);
      } catch (e) {
        colorsStr = JSON.stringify(colours.split(',').map(c => c.trim()).filter(Boolean));
      }
    }

    let tagsStr = match[0].tags || '[]';
    if (tags) {
      try {
        const parsed = typeof tags === 'string' ? JSON.parse(tags) : tags;
        tagsStr = JSON.stringify(parsed);
      } catch (e) {
        tagsStr = JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean));
      }
    }

    await db.run(
      `UPDATE outfits SET name = ?, category = ?, image = ?, price = ?, oldPrice = ?, description = ?, colours = ?, sizes = ?, fabric = ?, availability = ?, badge = ?, badgeText = ?, tags = ?
       WHERE id = ?`,
      [name, category, imageUrl, price, oldPrice || null, description || '', colorsStr, sizes || '', fabric || '', availability || 'In Stock', badge || null, badgeText || null, tagsStr, id]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update outfit.' });
  }
});

app.delete('/api/outfits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM outfits WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete outfit.' });
  }
});

// ============================================================
// ENQUIRIES ENDPOINTS
// ============================================================
app.get('/api/enquiries', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM enquiries ORDER BY id DESC');
    res.json(rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      message: r.message,
      date: new Date(r.submittedAt).toLocaleString()
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch enquiries.' });
  }
});

app.post('/api/enquiries', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  try {
    const submittedAt = new Date().toISOString();
    const result = await db.run(
      'INSERT INTO enquiries (name, email, message, submittedAt) VALUES (?, ?, ?, ?)',
      [name, email, message, submittedAt]
    );
    res.status(201).json({ success: true, id: result.lastID });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to submit enquiry.' });
  }
});

app.delete('/api/enquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM enquiries WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete enquiry.' });
  }
});

app.delete('/api/enquiries', async (req, res) => {
  try {
    await db.run('DELETE FROM enquiries');
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to clear enquiries.' });
  }
});

// ============================================================
// ANALYTICS ENDPOINTS
// ============================================================
app.post('/api/analytics', async (req, res) => {
  const { type, data } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. Log overall event
    await db.run(
      'INSERT INTO analytics_events (type, data, timestamp) VALUES (?, ?, ?)',
      [type, data ? JSON.stringify(data) : null, new Date().toISOString()]
    );

    // 2. Aggregate views/adds/checkouts based on type
    if (type === 'page_view') {
      const match = await db.query('SELECT views FROM analytics_views WHERE date = ?', [today]);
      if (match.length > 0) {
        const pages = JSON.parse(match[0].views || '{}');
        const page = data?.page || 'unknown';
        pages[page] = (pages[page] || 0) + 1;
        await db.run('UPDATE analytics_views SET views = ? WHERE date = ?', [JSON.stringify(pages), today]);
      } else {
        const page = data?.page || 'unknown';
        const pages = { [page]: 1 };
        await db.run('INSERT INTO analytics_views (date, views) VALUES (?, ?)', [today, JSON.stringify(pages)]);
      }
    } else if (type === 'outfit_view') {
      const outfitId = String(data?.outfitId || 'unknown');
      const name = data?.outfitName || 'Unknown';
      const match = await db.query('SELECT views FROM analytics_outfits WHERE outfitId = ?', [outfitId]);
      if (match.length > 0) {
        await db.run('UPDATE analytics_outfits SET views = views + 1, name = ? WHERE outfitId = ?', [name, outfitId]);
      } else {
        await db.run('INSERT INTO analytics_outfits (outfitId, name, views) VALUES (?, ?, 1)', [outfitId, name]);
      }
    }

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save analytics event.' });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    // 1. Compute total page views and list dailyviews
    const dailyViewsRows = await db.query('SELECT * FROM analytics_views');
    let totalPageViews = 0;
    const dailyViews = [];
    
    for (const row of dailyViewsRows) {
      const pages = JSON.parse(row.views || '{}');
      let dayTotal = 0;
      for (const count of Object.values(pages)) {
        dayTotal += count;
      }
      totalPageViews += dayTotal;
      dailyViews.push({ date: row.date, views: dayTotal });
    }
    dailyViews.sort((a, b) => a.date.localeCompare(b.date));

    // 2. Count cart additions & checkouts
    const cartAddsResult = await db.query("SELECT COUNT(*) as count FROM analytics_events WHERE type = 'cart_add'");
    const checkoutsResult = await db.query("SELECT COUNT(*) as count FROM analytics_events WHERE type = 'checkout'");
    
    // 3. Top viewed outfits
    const topOutfits = await db.query('SELECT outfitId as id, name, views FROM analytics_outfits ORDER BY views DESC LIMIT 10');

    // 4. Recent activity events
    const recentEventsRows = await db.query('SELECT * FROM analytics_events ORDER BY id DESC LIMIT 20');
    const recentEvents = recentEventsRows.map(r => ({
      type: r.type,
      data: r.data ? JSON.parse(r.data) : null,
      timestamp: r.timestamp
    }));

    res.json({
      totalPageViews,
      totalCartAdds: parseInt(cartAddsResult[0].count || cartAddsResult[0].COUNT || 0),
      totalCheckouts: parseInt(checkoutsResult[0].count || checkoutsResult[0].COUNT || 0),
      dailyViews,
      topOutfits,
      recentEvents
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch analytics statistics.' });
  }
});

// ============================================================
// HEALTH & GENERAL
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: db.dbType });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;

db.initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Shopsellence API running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});
