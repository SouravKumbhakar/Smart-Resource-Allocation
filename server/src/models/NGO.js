import mongoose from 'mongoose';

const ngoSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  contactNumber: { type: String },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'pending', 'suspended', 'deleted'], default: 'pending' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('NGO', ngoSchema);
