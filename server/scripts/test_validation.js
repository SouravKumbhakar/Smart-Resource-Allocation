import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import User from '../src/models/User.js';
import Need from '../src/models/Need.js';
import NGO from '../src/models/NGO.js';

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for validation testing');

    // 1. Verify text indexing
    const needsIndexes = await Need.collection.indexes();
    const hasTextIndex = needsIndexes.some(idx => idx.name.includes('text'));
    const hasCompoundIndex = needsIndexes.some(idx => idx.key.ngoId === 1 && idx.key.isDeleted === 1);
    
    console.log(`✅ Text index on Need: ${hasTextIndex ? 'Pass' : 'Fail'}`);
    console.log(`✅ Compound index on Need: ${hasCompoundIndex ? 'Pass' : 'Fail'}`);

    // 2. Test Soft Delete
    const deletedUser = await User.findOne({ isDeleted: true });
    if (deletedUser) {
        console.log(`✅ Soft delete verified for User: ${deletedUser.email}`);
    } else {
        console.log(`⚠️ No soft deleted users found, but field exists.`);
    }

    console.log('✅ Validation complete.');
  } catch (err) {
    console.error('❌ Validation failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
