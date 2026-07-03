const Invoice = require('../models/Invoice');

/**
 * Purges previous invoices and bulk-inserts the newly parsed list
 * @param {Array<Object>} invoicesList - Normalized array of invoice objects
 * @returns {Promise<number>} Number of records inserted
 */
const bulkReplaceInvoices = async (invoicesList) => {
  if (!invoicesList || invoicesList.length === 0) {
    return 0;
  }

  // Clear existing invoice database records
  await Invoice.deleteMany({});

  // Insert the fresh parsed sheet records
  const result = await Invoice.insertMany(invoicesList);
  
  return result.length;
};

module.exports = {
  bulkReplaceInvoices
};
