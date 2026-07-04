const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  customer: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  spoc: {
    type: String,
    required: [true, 'SPOC is required'],
    trim: true
  },
  invoiceNo: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    index: true,
    trim: true
  },
  invoiceDate: {
    type: Date,
    required: [true, 'Invoice date is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  invoiceAmount: {
    type: Number,
    required: [true, 'Invoice amount is required'],
    min: [0, 'Invoice amount cannot be negative']
  },
  received: {
    type: Number,
    default: 0,
    min: [0, 'Received amount cannot be negative']
  },
  outstanding: {
    type: Number,
    required: [true, 'Outstanding amount is required'],
    min: [0, 'Outstanding amount cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const ageingService = require('../services/ageingService');

InvoiceSchema.virtual('ageingBucket').get(function() {
  return ageingService.getAgeingBucket(this.dueDate);
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
