const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Define Twilio incoming message webhook routing
// POST /api/whatsapp/webhook
router.post('/webhook', whatsappController.handleIncomingMessage);

module.exports = router;
