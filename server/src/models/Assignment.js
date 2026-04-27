import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  needId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Need',
    required: true
  },
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
    required: true
  },
  matchScore: { type: Number },
  scoreBreakdown: {
    skillScore: { type: Number },
    distanceScore: { type: Number },
    availabilityScore: { type: Number }
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  assignedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Assignment', assignmentSchema);
