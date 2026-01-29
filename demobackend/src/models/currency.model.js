const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 3,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10,
    },
    position: {
      type: String,
      enum: ['before', 'after'],
      default: 'before',
    },
    decimalPlaces: {
      type: Number,
      default: 2,
      min: 0,
      max: 4,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default currency
currencySchema.pre('save', async function () {
  if (this.isDefault && this.isModified('isDefault')) {
    const query = this._id ? { _id: { $ne: this._id } } : {};
    await mongoose.model('Currency').updateMany(
      query,
      { isDefault: false }
    );
  }
});

module.exports = mongoose.model('Currency', currencySchema);

