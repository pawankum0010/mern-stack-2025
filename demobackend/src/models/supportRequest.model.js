const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    subject: {
      type: String,
      trim: true,
      default: 'Support Request',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'closed'],
      default: 'pending',
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
supportRequestSchema.index({ createdAt: -1 });
supportRequestSchema.index({ status: 1, createdAt: -1 });
supportRequestSchema.index({ email: 1, createdAt: -1 });

const SupportRequest = mongoose.model('SupportRequest', supportRequestSchema);

module.exports = SupportRequest;

