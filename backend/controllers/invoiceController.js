const invoiceService = require('../services/invoiceService');

/**
 * Endpoint controller to fetch all database invoice records.
 */
const getInvoices = async (req, res, next) => {
  try {
    const invoices = await invoiceService.getAllInvoicesSorted();
    
    // Return structured status 200 payload
    return res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    // Forward exceptions to error middlware
    next(error);
  }
};

module.exports = {
  getInvoices
};
