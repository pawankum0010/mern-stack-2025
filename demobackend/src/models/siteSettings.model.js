const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    officeAddress: {
      type: String,
      required: true,
      trim: true,
    },
    officeCity: {
      type: String,
      trim: true,
      default: '',
    },
    officeState: {
      type: String,
      trim: true,
      default: '',
    },
    officePostalCode: {
      type: String,
      trim: true,
      default: '',
    },
    officeCountry: {
      type: String,
      trim: true,
      default: 'India',
    },
    businessHours: {
      type: String,
      trim: true,
      default: '',
    },
    supportMessage: {
      type: String,
      trim: true,
      default: "We're here to help! Get in touch with our support team for any questions, concerns, or assistance you may need.",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
siteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    // Create default settings
    settings = await this.create({
      contactEmail: 'infosoftchilli@gmail.com',
      contactPhone: '+91 9140100018',
      officeAddress: '2/148 Vinamra Khand',
      officeCity: 'Gomti Nagar',
      officeState: 'Uttar Pradesh',
      officePostalCode: '226010',
      officeCountry: 'India',
      businessHours: 'Monday - Friday: 9:00 AM - 6:00 PM',
      supportMessage: "We're here to help! Get in touch with our support team for any questions, concerns, or assistance you may need.",
    });
  }
  return settings;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);

