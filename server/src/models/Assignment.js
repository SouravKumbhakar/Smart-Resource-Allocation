import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  needId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Need',
    required: true
  },
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    enum: ['active', 'submitted', 'completed'],
    default: 'active'
  },
  assignedAt:    { type: Date, default: Date.now },
  completedAt:   { type: Date },
  submission: {
    text:        { type: String },
    images:      [{ type: String }],
    submittedAt: { type: Date }
  },
  adminFeedback: { type: String }
}, { timestamps: true });

export default mongoose.model('Assignment', assignmentSchema);
