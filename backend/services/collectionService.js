const Invoice = require('../models/Invoice');
const dateUtils = require('../utils/dateUtils');

/**
 * Calculates collection follow-up metrics and targets for a customer
 * @param {string} customerName - Target customer's name
 * @param {Date|string} [anchorDate] - Custom date evaluation anchor
 * @returns {Promise<Object>} Formatted Collection follow-up report
 */
const getCollectionFollowUp = async (customerName, anchorDate = new Date()) => {
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

  // 4. Calculate weekly date objects (Monday to Friday)
  const { monday } = dateUtils.getCurrentWeekRange(anchorDate);

  const monDate = new Date(monday);
  monDate.setUTCHours(0, 0, 0, 0);

  const tueDate = new Date(monDate); tueDate.setUTCDate(monDate.getUTCDate() + 1);
  const wedDate = new Date(monDate); wedDate.setUTCDate(monDate.getUTCDate() + 2);
  const thuDate = new Date(monDate); thuDate.setUTCDate(monDate.getUTCDate() + 3);
  const friDate = new Date(monDate); friDate.setUTCDate(monDate.getUTCDate() + 4);

  let overdueAmount = 0;
  let mondayDues = 0;
  let tuesdayDues = 0;
  let wednesdayDues = 0;
  let thursdayDues = 0;
  let fridayDues = 0;

  const invoiceList = [];

  // Grab SPOC from first invoice
  const spoc = invoices[0].spoc || 'N/A';

  // 5. Compute day-by-day collections targets
  outstandingInvoices.forEach(inv => {
    const invOutstanding = inv.outstanding;
    
    // Only perform date math if due date is present
    if (inv.dueDate && !isNaN(new Date(inv.dueDate).getTime())) {
      const dueTime = new Date(inv.dueDate);
      dueTime.setUTCHours(0, 0, 0, 0);

      const rawTime = dueTime.getTime();

      // A. Overdue as of Monday (Due Date strictly before Monday of current week)
      if (rawTime < monDate.getTime()) {
        overdueAmount += invOutstanding;
      } 
      // B. Daily dues (Monday to Friday)
      else if (rawTime === monDate.getTime()) {
        mondayDues += invOutstanding;
      } else if (rawTime === tueDate.getTime()) {
        tuesdayDues += invOutstanding;
      } else if (rawTime === wedDate.getTime()) {
        wednesdayDues += invOutstanding;
      } else if (rawTime === thuDate.getTime()) {
        thursdayDues += invOutstanding;
      } else if (rawTime === friDate.getTime()) {
        fridayDues += invOutstanding;
      }
    }

    // Accumulate invoice definitions
    invoiceList.push({
      invoiceNo: inv.invoiceNo,
      dueDate: inv.dueDate,
      outstanding: invOutstanding
    });
  });

  const dueThisWeek = mondayDues + tuesdayDues + wednesdayDues + thursdayDues + fridayDues;
  const totalCollectionTarget = overdueAmount + dueThisWeek;

  const resolvedCustomerName = invoices[0].customer;

  return {
    customer: resolvedCustomerName,
    spoc,
    overdueAmount: parseFloat(overdueAmount.toFixed(2)),
    dueThisWeek: parseFloat(dueThisWeek.toFixed(2)),
    totalCollectionTarget: parseFloat(totalCollectionTarget.toFixed(2)),
    monday: parseFloat(mondayDues.toFixed(2)),
    tuesday: parseFloat(tuesdayDues.toFixed(2)),
    wednesday: parseFloat(wednesdayDues.toFixed(2)),
    thursday: parseFloat(thursdayDues.toFixed(2)),
    friday: parseFloat(fridayDues.toFixed(2)),
    invoices: invoiceList
  };
};

module.exports = {
  getCollectionFollowUp
};
