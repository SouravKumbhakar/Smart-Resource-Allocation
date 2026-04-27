import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/models/User.js';
import Volunteer from '../src/models/Volunteer.js';
import Need from '../src/models/Need.js';
import NGO from '../src/models/NGO.js';

const isDryRun = process.argv.includes('--dry-run');

console.log('==================================================');
console.log('🚀 RELIEFOPS V2 DATABASE MIGRATION SCRIPT');
console.log('==================================================');
if (!isDryRun) {
  console.log('⚠️ WARNING: This will modify live data.');
  console.log('⚠️ Ensure you have run mongodump before proceeding.');
  console.log('Starting in 5 seconds... Press Ctrl+C to abort.');
} else {
  console.log('🔍 DRY RUN MODE ACTIVATED. No data will be modified.');
}
console.log('==================================================\n');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runMigration() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    if (!isDryRun) await sleep(5000);

    // 1. MIGRATING VOLUNTEERS
    console.log('\n--- 1. Migrating Volunteers to User Profile ---');
    const volunteers = await Volunteer.find({});
    console.log(`Found ${volunteers.length} volunteer records.`);

    let migratedVols = 0;
    for (const vol of volunteers) {
      const user = await User.findById(vol.userId);
      if (!user) {
        console.log(`❌ Skipped Volunteer ${vol._id} - Linked User ${vol.userId} not found.`);
        continue;
      }

      if (isDryRun) {
        console.log(`[DRY RUN] Would migrate Volunteer ${vol._id} -> User ${user.name}`);
      } else {
        user.profile = {
          skills: vol.skills || [],
          location: vol.location,
          availability: vol.availability,
          completedCount: vol.completedCount
        };
        await user.save();
      }
      migratedVols++;
    }
    console.log(`✅ Processed ${migratedVols} volunteer migrations.`);

    // 2. EXTRACTING NGOS
    console.log('\n--- 2. Extracting NGOs from Admins ---');
    const admins = await User.find({ role: 'ngo_admin' });
    console.log(`Found ${admins.length} NGO Admins.`);

    const adminNgoMap = new Map(); // adminId -> ngoId

    for (const admin of admins) {
      // In V1, NGO name/location was just implied or missing. Let's create dummy NGO if missing.
      const ngoName = `${admin.name}'s Organization`;
      const ngoLocation = 'Global'; // Default fallback

      if (isDryRun) {
        console.log(`[DRY RUN] Would create NGO "${ngoName}" for Admin ${admin.name}`);
        adminNgoMap.set(admin._id.toString(), 'dummy_ngo_id');
      } else {
        const existingNgo = await NGO.findOne({ adminId: admin._id });
        let ngo;
        if (existingNgo) {
          ngo = existingNgo;
        } else {
          ngo = await NGO.create({
            name: ngoName,
            location: ngoLocation,
            adminId: admin._id,
            status: 'active' // Retroactively approve existing V1 admins
          });
        }
        
        // Link admin to NGO
        if (!admin.profile) admin.profile = {};
        admin.profile.assignedNgoId = ngo._id;
        await admin.save();
        
        adminNgoMap.set(admin._id.toString(), ngo._id);
        console.log(`Created/Linked NGO: ${ngo.name}`);
      }
    }

    // 3. LINKING NEEDS TO NGOS
    console.log('\n--- 3. Linking Needs to NGOs ---');
    const needs = await Need.find({});
    console.log(`Found ${needs.length} Needs.`);

    let linkedNeeds = 0;
    for (const need of needs) {
      if (need.ngoId) continue; // Already linked
      
      const ngoId = adminNgoMap.get(need.createdBy?.toString());
      if (!ngoId) {
        console.log(`❌ Skipped Need ${need._id} - No associated NGO found for creator ${need.createdBy}`);
        continue;
      }

      if (isDryRun) {
        console.log(`[DRY RUN] Would link Need "${need.title}" to NGO ${ngoId}`);
      } else {
        need.ngoId = ngoId;
        await need.save();
      }
      linkedNeeds++;
    }
    console.log(`✅ Processed ${linkedNeeds} need linkages.`);

    // 4. CLEANUP & VALIDATION
    if (!isDryRun) {
      console.log('\n--- 4. Cleanup & Validation ---');
      await Volunteer.collection.drop();
      console.log('✅ Dropped legacy Volunteer collection.');

      const vCount = await mongoose.connection.db.collection('volunteers').countDocuments().catch(() => 0);
      const migratedCount = await User.countDocuments({ role: 'volunteer', 'profile.skills': { $exists: true } });
      
      console.log('\nMigration Complete!');
      console.log(`Legacy Volunteers Count: ${vCount} (Should be 0)`);
      console.log(`Migrated Users with Profiles: ${migratedCount}`);
    } else {
      console.log('\nDry run complete. Run without --dry-run to commit changes.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ MIGRATION FAILED:', error);
    process.exit(1);
  }
}

runMigration();
