const mongoose = require('mongoose');

const weightUnitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Weight unit name is required'],
      trim: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Weight unit code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    symbol: {
      type: String,
      trim: true,
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
weightUnitSchema.index({ status: 1 });

const WeightUnit = mongoose.model('WeightUnit', weightUnitSchema);

module.exports = WeightUnit;

