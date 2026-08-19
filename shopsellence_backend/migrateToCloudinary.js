const db = require('./db');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const PUBLIC_DIR = path.resolve(__dirname, '../shopsellence_frontend/public');

async function run() {
  try {
    await db.initDb();
    console.log('Connected to database. Finding images to migrate...');
    
    const outfits = await db.query('SELECT id, image FROM outfits');
    let migratedCount = 0;
    
    for (const outfit of outfits) {
      if (outfit.image) {
        let filePathToUpload = null;
        
        if (outfit.image.startsWith('data:image/')) {
           filePathToUpload = outfit.image; // data URI directly
        } else if (!outfit.image.startsWith('http')) {
           // It's a local file path like 'shopsellence_images/rossi_loafers.png'
           filePathToUpload = path.join(PUBLIC_DIR, outfit.image);
           if (!fs.existsSync(filePathToUpload)) {
             console.warn(`⚠️ File not found, skipping: ${filePathToUpload}`);
             filePathToUpload = null;
           }
        }
        
        if (filePathToUpload) {
          console.log(`Migrating image for outfit ID ${outfit.id}...`);
          
          try {
            const result = await cloudinary.uploader.upload(filePathToUpload, {
              folder: 'shopsellence_outfits'
            });
            
            await db.run('UPDATE outfits SET image = ? WHERE id = ?', [result.secure_url, outfit.id]);
            console.log(`✅ Successfully updated outfit ID ${outfit.id} with url: ${result.secure_url}`);
            migratedCount++;
          } catch (uploadErr) {
            console.error(`❌ Failed to upload outfit ID ${outfit.id}:`, uploadErr);
          }
        }
      }
    }
    
    console.log(`\nMigration complete. Migrated ${migratedCount} images to Cloudinary.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
