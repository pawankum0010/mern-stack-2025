const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Size name is required'],
      trim: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Size code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      enum: ['clothing', 'shoes', 'general', 'other'],
      default: 'general',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
sizeSchema.index({ status: 1 });
sizeSchema.index({ category: 1 });

const Size = mongoose.model('Size', sizeSchema);

module.exports = Size;

