const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// GET /api/invoices
router.get('/', invoiceController.getInvoices);

module.exports = router;
