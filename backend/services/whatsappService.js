const twilio = require('twilio');

// Retrieve configurations from environment
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsapp = process.env.TWILIO_WHATSAPP || 'whatsapp:+14155238886';

let client = null;

/**
 * Lazy-loads and returns a reusable Twilio client instance
 */
const getTwilioClient = () => {
  if (!client) {
    if (!accountSid || !authToken) {
      console.warn('⚠️ Twilio Credentials missing in environment (.env). WhatsApp deliveries will be skipped.');
      return null;
    }
    client = twilio(accountSid, authToken);
  }
  return client;
};

/**
 * Sends a text response via Twilio WhatsApp API
 * @param {string} to - Destination phone number (e.g. "whatsapp:+919876543210")
 * @param {string} body - Message text body
 * @returns {Promise<Object>} Twilio API response metadata
 */
const sendWhatsAppMessage = async (to, body) => {
  const twilioClient = getTwilioClient();
  if (!twilioClient) {
    console.warn(`[DryRun Send] Message to ${to}:\n${body}`);
    return { sid: 'dryrun-' + Date.now(), status: 'simulated' };
  }

  const recipient = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  try {
    const response = await twilioClient.messages.create({
      body: body,
      from: fromWhatsapp,
      to: recipient
    });
    console.log(`📡 WhatsApp message dispatched to ${recipient}. Twilio SID: ${response.sid}`);
    return response;
  } catch (error) {
    console.error(`❌ Twilio API Error encountered: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendWhatsAppMessage,
  getTwilioClient
};
