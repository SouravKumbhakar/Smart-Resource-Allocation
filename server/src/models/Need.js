import mongoose from 'mongoose';

const needSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['food', 'medical', 'education', 'disaster'],
    required: true
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  urgency: { type: Number, min: 1, max: 5, required: true },
  peopleAffected: { type: Number, required: true },
  priorityScore: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['open', 'assigned', 'completed'],
    default: 'open'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Pre-save hook to calculate priority score
needSchema.pre('save', function () {
  // priorityScore = (urgency × 0.5) + (normalizedPeople × 0.3) + (timeSensitivity × 0.2)
  const urgencyScore = this.urgency * 0.5;
  const normalizedPeople = Math.min(this.peopleAffected / 100, 1) * 5;
  const peopleScore = normalizedPeople * 0.3;
  
  // timeSensitivity is 0 when just created, but will be updated later
  const hoursSince = this.createdAt ? (Date.now() - this.createdAt.getTime()) / 3600000 : 0;
  const timeScore = Math.max(0, 5 - hoursSince / 24) * 0.2;
  
  this.priorityScore = +(urgencyScore + peopleScore + timeScore).toFixed(2);
});

export default mongoose.model('Need', needSchema);
