/**
 * Returns Monday and Friday dates and current Date for week-based reports.
 * Supports custom anchors to facilitate Postman testing on arbitrary dates.
 * @param {Date|string} [anchorDate] - Optional evaluation anchor date
 * @returns {Object} { monday, friday, currentDate }
 */
const getCurrentWeekRange = (anchorDate = new Date()) => {
  const today = new Date(anchorDate);
  today.setUTCHours(0, 0, 0, 0);

  const dayOfWeek = today.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Calculate day difference from Monday (Monday is Day 1)
  // If Sunday (0), it is 6 days ahead of Monday of the same week, so offset is -6.
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);
  friday.setUTCHours(23, 59, 59, 999); // Include full day Friday

  return {
    monday,
    friday,
    currentDate: today
  };
};

module.exports = {
  getCurrentWeekRange
};
