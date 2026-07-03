const paymentScheduleService = require('../services/paymentScheduleService');
const collectionService = require('../services/collectionService');

/**
 * Endpoint to retrieve a customer's Payment Schedule Report
 */
const getPaymentReport = async (req, res, next) => {
  try {
    const { customer } = req.params;
    const { anchorDate } = req.query;

    // Support evaluated custom anchor dates for testing
    const evaluationDate = anchorDate ? new Date(anchorDate) : new Date();
    if (anchorDate && isNaN(evaluationDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Date format: Parameter query "anchorDate" was not formatted correctly.'
      });
    }

    const report = await paymentScheduleService.getPaymentSchedule(customer, evaluationDate);
    
    return res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

/**
 * Endpoint to retrieve a customer's Collection Follow-up Report
 */
const getCollectionReport = async (req, res, next) => {
  try {
    const { customer } = req.params;
    const { anchorDate } = req.query;

    const evaluationDate = anchorDate ? new Date(anchorDate) : new Date();
    if (anchorDate && isNaN(evaluationDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Date format: Parameter query "anchorDate" was not formatted correctly.'
      });
    }

    const report = await collectionService.getCollectionFollowUp(customer, evaluationDate);

    return res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

module.exports = {
  getPaymentReport,
  getCollectionReport
};
