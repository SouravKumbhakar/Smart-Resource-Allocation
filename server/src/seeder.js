import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Need from './models/Need.js';
import Volunteer from './models/Volunteer.js';
import Assignment from './models/Assignment.js';
import { connectDB } from './config/db.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing old data...');
    await Assignment.deleteMany();
    await Need.deleteMany();
    await Volunteer.deleteMany();
    await User.deleteMany();

    // ── Users ──────────────────────────────────────────────────────────────────
    // Use User.create() (NOT insertMany) so the pre-save hook hashes the password.
    // Passing plain '123456' → hook hashes it → bcrypt.compare('123456', hash) works at login.
    console.log('Creating Super Admin...');
    await User.create({
      name: 'System Admin',
      email: 'superadmin@aidops.org',
      passwordHash: '123456',
      role: 'super_admin'
    });

    console.log('Creating NGO Admin...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@aidops.org',
      passwordHash: '123456',
      role: 'ngo_admin'
    });

    console.log('Creating Volunteer Users...');
    const volUser0 = await User.create({ name: 'John Doe',      email: 'john@mail.com',  passwordHash: '123456', role: 'volunteer' });
    const volUser1 = await User.create({ name: 'Jane Smith',    email: 'jane@mail.com',  passwordHash: '123456', role: 'volunteer' });
    const volUser2 = await User.create({ name: 'Dr. Sarah Lee', email: 'sarah@mail.com', passwordHash: '123456', role: 'volunteer' });
    const volUser3 = await User.create({ name: 'Mike Johnson',  email: 'mike@mail.com',  passwordHash: '123456', role: 'volunteer' });

    // ── Volunteer Profiles ─────────────────────────────────────────────────────
    // Volunteer profiles don't have password hooks, insertMany is fine here.
    await Volunteer.insertMany([
      { userId: volUser0._id, skills: ['logistics', 'food'],   location: { lat: 22.5726, lng: 88.3639 }, availability: true,  completedCount: 12 },
      { userId: volUser1._id, skills: ['medical', 'disaster'], location: { lat: 22.5800, lng: 88.3500 }, availability: false, completedCount: 8  },
      { userId: volUser2._id, skills: ['medical'],             location: { lat: 22.5600, lng: 88.3700 }, availability: true,  completedCount: 24 },
      { userId: volUser3._id, skills: ['education', 'food'],   location: { lat: 22.5900, lng: 88.3800 }, availability: true,  completedCount: 3  },
    ]);

    // ── Needs ──────────────────────────────────────────────────────────────────
    // Use Need.create() (NOT insertMany) so the pre-save hook calculates priorityScore.
    console.log('Creating Needs...');
    await Need.create({ title: 'Urgent Medical Supplies',    description: 'Need bandages and antiseptics',         category: 'medical',   location: { lat: 22.5700, lng: 88.3600 }, urgency: 5, peopleAffected: 150,  createdBy: adminUser._id });
    await Need.create({ title: 'Food Distribution Center',   description: 'Volunteers needed for food packing',    category: 'food',      location: { lat: 22.5750, lng: 88.3650 }, urgency: 3, peopleAffected: 500,  createdBy: adminUser._id });
    await Need.create({ title: 'Flood Evacuation Support',   description: 'Need boats and manpower',               category: 'disaster',  location: { lat: 22.5850, lng: 88.3450 }, urgency: 5, peopleAffected: 1200, createdBy: adminUser._id });
    await Need.create({ title: 'Makeshift School Volunteers',description: 'Teachers needed for displaced kids',    category: 'education', location: { lat: 22.5650, lng: 88.3750 }, urgency: 2, peopleAffected: 80,   createdBy: adminUser._id });

    console.log('✅ Data Imported Successfully!');
    console.log('   Super Admin: superadmin@aidops.org / 123456');
    console.log('   NGO Admin:   admin@aidops.org / 123456');
    console.log('   Volunteer:   john@mail.com / 123456');
    process.exit();
  } catch (error) {
    console.error(`❌ Seeder Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
