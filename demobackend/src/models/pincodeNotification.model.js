const mongoose = require('mongoose');

const pincodeNotificationSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^\d{6}$/.test(v);
        },
        message: 'Pincode must be exactly 6 digits',
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userEmail: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
pincodeNotificationSchema.index({ pincode: 1, status: 1 });
pincodeNotificationSchema.index({ status: 1 });

const PincodeNotification = mongoose.model('PincodeNotification', pincodeNotificationSchema);

module.exports = PincodeNotification;

