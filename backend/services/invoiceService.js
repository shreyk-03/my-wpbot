const Invoice = require('../models/Invoice');

/**
 * Retrieve all invoices from MongoDB sorted by Invoice Date descending
 * @returns {Promise<Array>} List of sorted invoice documents
 */
const getAllInvoicesSorted = async () => {
  return await Invoice.find({}).sort({ invoiceDate: -1 });
};

module.exports = {
  getAllInvoicesSorted
};
