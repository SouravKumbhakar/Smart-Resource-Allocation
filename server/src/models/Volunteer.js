import mongoose from 'mongoose';

const volunteerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skills: [{
    type: String,
    enum: ['food', 'medical', 'logistics', 'education', 'disaster'],
  }],
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  availability: {
    type: Boolean,
    default: true,
  },
  completedCount: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

export default mongoose.model('Volunteer', volunteerSchema);
