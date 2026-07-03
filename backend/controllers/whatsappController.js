const Fuse = require('fuse.js');
const Invoice = require('../models/Invoice');
const paymentScheduleService = require('../services/paymentScheduleService');
const collectionService = require('../services/collectionService');
const whatsappService = require('../services/whatsappService');
const messageFormatter = require('../services/messageFormatter');

/**
 * Utility to extract intent and target customer from message body
 */
const detectIntentAndCustomer = (bodyText) => {
  if (!bodyText) return { intent: 'unknown', candidateName: '' };
  
  const text = bodyText.trim().replace(/\s+/g, ' ');
  let intent = 'unknown';
  let candidateName = '';
  
  // Custom collection follow up patterns
  const collectionPatterns = [
    /weekly\s+collection\s+follow[ -]?up\s+(?:for|of)?\s*(.+)/i,
    /collection\s+follow[ -]?up\s+(?:for|of)?\s*(.+)/i,
    /weekly\s+collection\s+follow[ -]?up\s+(.+)/i,
    /collection\s+follow[ -]?up\s+(.+)/i
  ];
  
  for (const pattern of collectionPatterns) {
    const match = text.match(pattern);
    if (match) {
      intent = 'collection_follow_up';
      candidateName = match[1].trim();
      return { intent, candidateName };
    }
  }
  
  // Custom payment schedule patterns
  const paymentPatterns = [
    /weekly\s+payment\s+schedule\s+(?:for|of)?\s*(.+)/i,
    /payment\s+schedule\s+(?:for|of)?\s*(.+)/i,
    /weekly\s+payment\s+schedule\s+(.+)/i,
    /payment\s+schedule\s+(.+)/i
  ];
  
  for (const pattern of paymentPatterns) {
    const match = text.match(pattern);
    if (match) {
      intent = 'payment_schedule';
      candidateName = match[1].trim();
      return { intent, candidateName };
    }
  }

  // Fallback keyword check
  if (/payment\s*schedule/i.test(text)) {
    intent = 'payment_schedule';
    const parts = text.split(/payment\s*schedule/i);
    if (parts.length > 1) {
      const suffix = parts[1].replace(/^(?:\s*(?:for|of))?\s*/i, '').trim();
      if (suffix) candidateName = suffix;
    }
  } else if (/collection\s*follow[ -]?up/i.test(text) || /collection\s*follow\s*up/i.test(text)) {
    intent = 'collection_follow_up';
    const parts = text.split(/collection\s*follow[ -]?up/i) || text.split(/collection\s*follow\s*up/i);
    if (parts.length > 1) {
      const suffix = parts[1].replace(/^(?:\s*(?:for|of))?\s*/i, '').trim();
      if (suffix) candidateName = suffix;
    }
  }
  
  return { intent, candidateName };
};

/**
 * Handle incoming Twilio WhatsApp webhook requests
 */
const handleIncomingMessage = async (req, res) => {
  // Twilio webhook payload parameters
  const bodyText = req.body.Body;
  const fromNumber = req.body.From;

  console.log(`📡 Incoming WhatsApp webhook. From: ${fromNumber}, Body: "${bodyText || ''}"`);

  // 1. Error check: Empty message body
  if (!bodyText || bodyText.trim() === '') {
    const reply = '⚠️ Invalid request: Message cannot be blank. Please ask for:\n- "Payment schedule for [Customer]"\n- "Collection follow-up for [Customer]"';
    try {
      await whatsappService.sendWhatsAppMessage(fromNumber, reply);
    } catch (err) {
      console.error('Error replying blank message:', err.message);
    }
    return res.status(200).send('Empty body handled.');
  }

  try {
    // 2. Parse intent and candidate customer name
    const { intent, candidateName } = detectIntentAndCustomer(bodyText);

    if (intent === 'unknown' || !candidateName) {
      const reply = `⚠️ Intent not recognized. Supported formats are:\n\n` +
                    `• "Payment schedule for [Customer]"\n` +
                    `• "Collection follow-up for [Customer]"`;
      await whatsappService.sendWhatsAppMessage(fromNumber, reply);
      return res.status(200).send('Unknown intent handled.');
    }

    // 3. Obtain existing customer list for fuzzy matching
    const allCustomers = await Invoice.distinct('customer');
    if (!allCustomers || allCustomers.length === 0) {
      const reply = '⚠️ Database Empty: No invoice records found. Please upload your spreadsheet via the dashboard explorer first.';
      await whatsappService.sendWhatsAppMessage(fromNumber, reply);
      return res.status(200).send('Database empty handled.');
    }

    // 4. Perform fuzzy matching via Fuse.js
    const fuse = new Fuse(allCustomers, {
      includeScore: true,
      threshold: 0.5 // Allows matching variations like Pvt Ltd / Private Limited
    });

    const matches = fuse.search(candidateName);
    if (matches.length === 0) {
      const suggestions = allCustomers.slice(0, 3).join(', ');
      const reply = `❌ Customer "${candidateName}" not found. Did you mean one of these: ${suggestions}?`;
      await whatsappService.sendWhatsAppMessage(fromNumber, reply);
      return res.status(200).send('Customer not found handled.');
    }

    const matchedCustomerName = matches[0].item;
    console.log(`🎯 Fuzzy matching success: "${candidateName}" -> "${matchedCustomerName}" (score: ${matches[0].score})`);

    // 5. Query the service based on intent & format WhatsApp Markdown
    let reportReply = '';
    
    if (intent === 'payment_schedule') {
      const reportData = await paymentScheduleService.getPaymentSchedule(matchedCustomerName);
      reportReply = messageFormatter.formatPaymentSchedule(reportData);
    } else if (intent === 'collection_follow_up') {
      const reportData = await collectionService.getCollectionFollowUp(matchedCustomerName);
      reportReply = messageFormatter.formatCollectionFollowUp(reportData);
    }

    // 6. Send the generated report back
    await whatsappService.sendWhatsAppMessage(fromNumber, reportReply);

  } catch (error) {
    console.error('Webhook error flow:', error);
    // Custom error messages
    let reply = `❌ Error: ${error.message || 'An unexpected server error occurred.'}`;
    
    // Check if error matches 404/400 codes from backend services
    if (error.status === 404 || error.status === 400) {
      reply = `⚠️ ${error.message}`;
    }

    try {
      await whatsappService.sendWhatsAppMessage(fromNumber, reply);
    } catch (sendErr) {
      console.error('Recursive messaging failure:', sendErr.message);
    }
  }

  // Always return 200 OK to Twilio webhook to acknowledge receipt
  return res.status(200).send('Event processed.');
};

module.exports = {
  handleIncomingMessage,
  detectIntentAndCustomer
};
