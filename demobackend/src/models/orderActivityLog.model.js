const mongoose = require('mongoose');

const orderActivityLogSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'created',
        'status_changed',
        'approved',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'note_added',
        'payment_updated',
      ],
    },
    fromStatus: {
      type: String,
    },
    toStatus: {
      type: String,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByName: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

orderActivityLogSchema.index({ order: 1, createdAt: -1 });

orderActivityLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const OrderActivityLog = mongoose.model('OrderActivityLog', orderActivityLogSchema);

module.exports = OrderActivityLog;

