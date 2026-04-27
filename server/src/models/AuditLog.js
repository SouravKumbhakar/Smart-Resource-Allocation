import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    // e.g. 'CREATE_NEED', 'DELETE_NEED', 'CREATE_ASSIGNMENT', 'COMPLETE_ASSIGNMENT',
    //      'UPDATE_USER_ROLE', 'DELETE_USER', 'UPDATE_NEED', 'TOGGLE_AVAILABILITY'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetModel: {
    type: String,
    enum: ['Need', 'Assignment', 'Volunteer', 'User', 'NGO'],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Arbitrary JSON for context
  },
}, { timestamps: true });

// Index for efficient querying by time and user
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
