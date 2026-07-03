/**
 * Utility to format dates in DD-MMM-YYYY format (e.g. 04-Jul-2026)
 */
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const day = String(date.getUTCDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Utility to format numbers as Indian Currency (e.g. ₹35,000)
 */
const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  })}`;
};

/**
 * Formats Weekly Payment Schedule JSON into clean WhatsApp Markdown
 * @param {Object} data - Payment Schedule dataset
 * @returns {string} Formatted markdown text
 */
const formatPaymentSchedule = (data) => {
  const ageing = data.ageingBreakdown || {};
  
  let formatted = `📄 *Weekly Payment Schedule*\n\n`;
  formatted += `*Customer:*\n${data.customer}\n\n`;
  formatted += `*Overdue Amount:*\n${formatCurrency(data.overdueAmount)}\n\n`;
  formatted += `*Due This Week:*\n${formatCurrency(data.dueThisWeek)}\n\n`;
  formatted += `*Total Outstanding:*\n${formatCurrency(data.totalOutstanding)}\n\n`;
  
  formatted += `*Ageing*\n`;
  formatted += `90+ : ${formatCurrency(ageing['90+ Days'] || 0)}\n`;
  formatted += `61-90 : ${formatCurrency(ageing['61-90 Days'] || 0)}\n`;
  formatted += `31-60 : ${formatCurrency(ageing['31-60 Days'] || 0)}\n`;
  formatted += `16-30 : ${formatCurrency(ageing['16-30 Days'] || 0)}\n`;
  formatted += `0-15 : ${formatCurrency(ageing['0-15 Days'] || 0)}\n\n`;
  
  formatted += `*Invoices*\n`;
  if (!data.invoices || data.invoices.length === 0) {
    formatted += `No outstanding invoices.\n`;
  } else {
    data.invoices.forEach((inv) => {
      formatted += `*${inv.invoiceNo}*\nDue: ${formatDate(inv.dueDate)}\nOutstanding: ${formatCurrency(inv.outstanding)}\n\n`;
    });
  }
  
  return formatted.trim();
};

/**
 * Formats Weekly Collection Follow-up JSON into clean WhatsApp Markdown
 * @param {Object} data - Collection Follow-up dataset
 * @returns {string} Formatted markdown text
 */
const formatCollectionFollowUp = (data) => {
  let formatted = `📋 *Weekly Collection Follow-up*\n\n`;
  formatted += `*Customer:*\n${data.customer}\n\n`;
  formatted += `*SPOC:*\n${data.spoc || 'N/A'}\n\n`;
  formatted += `*Overdue Amount:*\n${formatCurrency(data.overdueAmount)}\n\n`;
  formatted += `*Due This Week:*\n${formatCurrency(data.dueThisWeek)}\n\n`;
  formatted += `*Total Collection Target:*\n${formatCurrency(data.totalCollectionTarget)}\n\n`;
  
  formatted += `*Daily Breakdown*\n`;
  formatted += `Mon: ${formatCurrency(data.monday || 0)}\n`;
  formatted += `Tue: ${formatCurrency(data.tuesday || 0)}\n`;
  formatted += `Wed: ${formatCurrency(data.wednesday || 0)}\n`;
  formatted += `Thu: ${formatCurrency(data.thursday || 0)}\n`;
  formatted += `Fri: ${formatCurrency(data.friday || 0)}\n\n`;
  
  formatted += `*Invoices*\n`;
  if (!data.invoices || data.invoices.length === 0) {
    formatted += `No outstanding invoices.\n`;
  } else {
    data.invoices.forEach((inv) => {
      formatted += `*${inv.invoiceNo}*\nDue: ${formatDate(inv.dueDate)}\nOutstanding: ${formatCurrency(inv.outstanding)}\n\n`;
    });
  }
  
  return formatted.trim();
};

module.exports = {
  formatPaymentSchedule,
  formatCollectionFollowUp,
  formatDate,
  formatCurrency
};
