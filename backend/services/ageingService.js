/**
 * Calculates day difference from due date to anchor date
 * Positive values indicate past due (overdue), negative values mean not yet due.
 * @param {Date} dueDate 
 * @param {Date} anchorDate 
 * @returns {number|null} Days past due
 */
const getDaysPastDue = (dueDate, anchorDate = new Date()) => {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const anchor = new Date(anchorDate);

  // Strip hours to measure full calendar days difference
  due.setUTCHours(0, 0, 0, 0);
  anchor.setUTCHours(0, 0, 0, 0);

  const diffTime = anchor.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Maps an invoice due date to its specific age bucket
 * @param {Date} dueDate 
 * @param {Date} anchorDate 
 * @returns {string} Ageing Bucket Name
 */
const getAgeingBucket = (dueDate, anchorDate = new Date()) => {
  if (!dueDate) {
    return 'Unknown';
  }

  const daysPast = getDaysPastDue(dueDate, anchorDate);
  
  if (daysPast <= 0) {
    return 'Not Due';
  } else if (daysPast <= 15) {
    return '0-15 Days';
  } else if (daysPast <= 30) {
    return '16-30 Days';
  } else if (daysPast <= 60) {
    return '31-60 Days';
  } else if (daysPast <= 90) {
    return '61-90 Days';
  } else {
    return '90+ Days';
  }
};

module.exports = {
  getDaysPastDue,
  getAgeingBucket
};
