const mongoose = require('mongoose');
const { SERVICE_STATUS } = require('../utils/constants');

/**
 * Dynamic Form Field Sub-Schema for Category-specific custom booking fields
 */
const formFieldSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'number', 'select', 'multiselect', 'date', 'time', 'textarea', 'file', 'toggle'],
    required: true
  },
  options: [{
    type: String,
    trim: true
  }],
  required: {
    type: Boolean,
    default: false
  },
  helpText: {
    type: String,
    default: null,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

/**
 * Category Model
 * Represents service categories (e.g., Electrician, Plumber, Salon, etc.)
 */
const categorySchema = new mongoose.Schema({
  // Frontend matching fields
  title: {
    type: String,
    required: [true, 'Please provide a category title'],
    trim: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  homeIconUrl: {
    type: String,
    default: null
  },
  homeBadge: {
    type: String,
    default: null,
    trim: true
  },
  hasSaleBadge: {
    type: Boolean,
    default: false
  },
  showOnHome: {
    type: Boolean,
    default: true,
    index: true
  },
  homeOrder: {
    type: Number,
    default: 0,
    index: true
  },
  // Cities where this category is available
  cityIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    index: true
  }],
  // Supported booking types per category (configurable by admin)
  supportedBookingTypes: [{
    type: String,
    enum: ['instant', 'scheduled', 'both', 'request_quote'],
    default: 'scheduled'
  }],
  bookingMode: {
    type: String,
    enum: ['INSTANT', 'SCHEDULED', 'BOTH', 'REQUEST_QUOTE'],
    default: 'BOTH'
  },
  defaultPricingModel: {
    type: String,
    enum: ['FIXED', 'PER_VISIT', 'HOURLY', 'DAILY', 'MONTHLY', 'YEARLY', 'PER_UNIT', 'CUSTOM_QUOTE'],
    default: 'FIXED'
  },
  requiredDocuments: [{
    type: String
  }],
  // Dynamic form schema per category for Customer booking requirements
  formSchema: [formFieldSchema],
  // Dynamic form schema per category for Provider onboarding/service setup
  vendorFormSchema: [formFieldSchema],
  // Multi-select allowed (e.g., Worker/Helper booking multiple roles)
  allowMultiSelect: {
    type: Boolean,
    default: false
  },
  // Additional backend fields
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: Object.values(SERVICE_STATUS),
    default: SERVICE_STATUS.ACTIVE,
    index: true
  },
  isPopular: {
    type: Boolean,
    default: false,
    index: true
  },
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

// Generate slug from title before validation
categorySchema.pre('validate', async function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Index for faster queries
categorySchema.index({ status: 1, homeOrder: 1 });
categorySchema.index({ isPopular: 1, status: 1 });
categorySchema.index({ showOnHome: 1, homeOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);

