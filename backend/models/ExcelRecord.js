const mongoose = require('mongoose');

// Schema is left empty/dynamic with strict: false
// This allows storing any shape of JSON data dynamically in MongoDB.
const ExcelRecordSchema = new mongoose.Schema({}, {
  strict: false,
  timestamps: true
});

module.exports = mongoose.model('ExcelRecord', ExcelRecordSchema);
