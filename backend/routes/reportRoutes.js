const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// GET /api/reports/payment/:customer
router.get('/payment/:customer', reportController.getPaymentReport);

// GET /api/reports/collection/:customer
router.get('/collection/:customer', reportController.getCollectionReport);

module.exports = router;
