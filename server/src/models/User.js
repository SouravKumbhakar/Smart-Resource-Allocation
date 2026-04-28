import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['volunteer', 'ngo_admin', 'coordinator', 'super_admin'],
    default: 'volunteer'
  },
  status: { 
    type: String, 
    enum: ['active', 'pending', 'suspended', 'deleted'], 
    default: 'active' 
  },
  isDeleted: { type: Boolean, default: false },
  profile: {
    contactNumber:   { type: String },
    address:         { type: String },
    city:            { type: String },
    skills: [{
      name:        { type: String },
      description: { type: String, maxlength: 600 }
    }],
    location:       { lat: Number, lng: Number },
    availability:   { type: Boolean, default: true },
    completedCount: { type: Number, default: 0 },
    assignedNgoId:  { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' },
    profileComplete: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Pre-save hook to hash password
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Method to check password match
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export default mongoose.model('User', userSchema);
