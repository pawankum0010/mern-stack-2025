const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['shipping', 'billing'],
      required: [true, 'Address type is required'],
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    label: {
      type: String,
      trim: true,
      default: 'Home',
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    line1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
    },
    line2: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'India',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default address per type per user
// Note: The pre-save hook handles setting defaults, this index is just for optimization
addressSchema.index({ user: 1, type: 1 });

addressSchema.pre('save', async function setDefaultAddress(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Unset other default addresses of the same type for this user
    await this.constructor.updateMany(
      {
        user: this.user,
        type: this.type,
        _id: { $ne: this._id },
        isDefault: true,
      },
      { $set: { isDefault: false } }
    );
  }
  next();
});

addressSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;

