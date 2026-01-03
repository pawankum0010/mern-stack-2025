const mongoose = require('mongoose');

const pincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      unique: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^\d{6}$/.test(v);
        },
        message: 'Pincode must be exactly 6 digits',
      },
    },
    shippingCharge: {
      type: Number,
      required: [true, 'Shipping charge is required'],
      min: [0, 'Shipping charge cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
pincodeSchema.index({ pincode: 1 });
pincodeSchema.index({ status: 1 });

const Pincode = mongoose.model('Pincode', pincodeSchema);

module.exports = Pincode;

