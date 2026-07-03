const Invoice = require('../models/Invoice');
const ageingService = require('./ageingService');
const dateUtils = require('../utils/dateUtils');

/**
 * Generates the Weekly Payment Schedule overview for a given customer
 * @param {string} customerName - Target customer's name
 * @param {Date|string} [anchorDate] - Anchor evaluation date (defaults to today)
 * @returns {Promise<Object>} Formatted payment schedule report
 */
const getPaymentSchedule = async (customerName, anchorDate = new Date()) => {
  // 1. Audit: Check if the database has any invoices uploaded
  const dbCount = await Invoice.countDocuments();
  if (dbCount === 0) {
    const err = new Error('Database Empty: No invoice records found. Please upload an AR spreadsheet first.');
    err.status = 404;
    throw err;
  }

  // 2. Query invoices for the specific customer (case-insensitive)
  const escapedName = customerName.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const invoices = await Invoice.find({
    customer: { $regex: new RegExp(`^${escapedName}$`, 'i') }
  });

  if (!invoices || invoices.length === 0) {
    const err = new Error(`Customer Not Found: No invoices exist for customer "${customerName}".`);
    err.status = 404;
    throw err;
  }

  // 3. Filter invoices with outstanding balances (outstanding > 0)
  const outstandingInvoices = invoices.filter(inv => inv.outstanding > 0);
  if (outstandingInvoices.length === 0) {
    const err = new Error(`Zero Outstanding Invoices: Customer "${customerName}" has no unpaid outstanding balance.`);
    err.status = 400;
    throw err;
  }

  // Define week boundaries and evaluation parameters
  const { monday, friday, currentDate } = dateUtils.getCurrentWeekRange(anchorDate);

  let overdueAmount = 0;
  let dueThisWeek = 0;
  let totalOutstanding = 0;

  const ageingBreakdown = {
    'Not Due': 0,
    '0-15 Days': 0,
    '16-30 Days': 0,
    '31-60 Days': 0,
    '61-90 Days': 0,
    '90+ Days': 0
  };

  const invoiceList = [];

  // 4. Calculate aggregates
  outstandingInvoices.forEach(inv => {
    const invOutstanding = inv.outstanding;
    totalOutstanding += invOutstanding;

    // Check if due date is valid before calculations
    if (inv.dueDate && !isNaN(new Date(inv.dueDate).getTime())) {
      const dueTime = new Date(inv.dueDate);
      dueTime.setUTCHours(0, 0, 0, 0);
      
      // A. Overdue calculation: Due Date < Today
      if (dueTime < currentDate) {
        overdueAmount += invOutstanding;
      }

      // B. Due this week calculation: Monday <= Due Date <= Friday
      if (dueTime >= monday && dueTime <= friday) {
        dueThisWeek += invOutstanding;
      }
    }

    // C. Ageing bucket accumulation
    const bucket = ageingService.getAgeingBucket(inv.dueDate, currentDate);
    if (ageingBreakdown[bucket] !== undefined) {
      ageingBreakdown[bucket] += invOutstanding;
    }

    // D. Build simplified invoices output
    invoiceList.push({
      invoiceNo: inv.invoiceNo,
      dueDate: inv.dueDate,
      outstanding: invOutstanding,
      ageingBucket: bucket
    });
  });

  // Extract primary name matching the record database entry
  const resolvedCustomerName = invoices[0].customer;

  return {
    customer: resolvedCustomerName,
    overdueAmount: parseFloat(overdueAmount.toFixed(2)),
    dueThisWeek: parseFloat(dueThisWeek.toFixed(2)),
    totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
    ageingBreakdown: {
      'Not Due': parseFloat(ageingBreakdown['Not Due'].toFixed(2)),
      '0-15 Days': parseFloat(ageingBreakdown['0-15 Days'].toFixed(2)),
      '16-30 Days': parseFloat(ageingBreakdown['16-30 Days'].toFixed(2)),
      '31-60 Days': parseFloat(ageingBreakdown['31-60 Days'].toFixed(2)),
      '61-90 Days': parseFloat(ageingBreakdown['61-90 Days'].toFixed(2)),
      '90+ Days': parseFloat(ageingBreakdown['90+ Days'].toFixed(2))
    },
    invoices: invoiceList
  };
};

module.exports = {
  getPaymentSchedule
};
