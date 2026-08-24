/**
 * Backfill trackingType on existing categories without deleting data.
 *
 * Usage: node scripts/seedTrackingTypes.js
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const connectDB = require('../config/db');
const { defaultTrackingTypeForSlug } = require('../utils/trackingType');

async function seedTrackingTypes() {
  try {
    await connectDB();
    const Category = require('../models/Category');

    const categories = await Category.find({}).select('_id title slug trackingType');
    let updated = 0;

    for (const cat of categories) {
      const next = defaultTrackingTypeForSlug(cat.slug);
      if (cat.trackingType !== next) {
        cat.trackingType = next;
        await cat.save();
        updated += 1;
        console.log(`  ✅ ${cat.title} (${cat.slug}) → ${next}`);
      } else {
        console.log(`  · ${cat.title} already ${cat.trackingType || next}`);
      }
    }

    console.log(`\nDone. Updated ${updated}/${categories.length} categories.`);
    process.exit(0);
  } catch (error) {
    console.error('seedTrackingTypes error:', error);
    process.exit(1);
  }
}

seedTrackingTypes();
