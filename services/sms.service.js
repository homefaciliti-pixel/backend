let lastSmsDebug = { timestamp: null, url: null, response: null, error: null };
const debugLogs = [];

const sendSMS = async (phone, messageText, templateId) => {
  const smsApiKey = process.env.SMS_API_KEY || 'b395HRZTRUGZThPOeRSnVg';
  const senderId = process.env.SMS_SENDER_ID || 'HMFCLI';
  const entityId = process.env.SMS_ENTITY_ID || '1201173444411453897';
  const dltTemplateId = templateId || process.env.SMS_DLT_TEMPLATE_ID || '1207173589889308632';

  // Format phone number: SMS Gateway Hub expects 91 prefix for Indian numbers without '+'
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.replace('+', '');
  }
  if (formattedPhone.length === 10) {
    formattedPhone = '91' + formattedPhone;
  }

  try {
    const params = new URLSearchParams({
      APIKey: smsApiKey,
      senderid: senderId,
      channel: '2',           // 2 = Transactional (required for DLT OTP)
      DCS: '0',
      flashsms: '0',
      number: formattedPhone,
      text: messageText,
      EntityId: entityId,
      dlttemplateid: dltTemplateId,
      route: '2'
    });
    const url = `https://www.smsgatewayhub.com/api/mt/SendSMS?${params.toString()}`;
    lastSmsDebug = {
      timestamp: new Date().toISOString(),
      url: url.replace(smsApiKey, '***'),
      response: null,
      error: null
    };
    console.log('[SMS] Sending request to:', url.replace(smsApiKey, '***'));
    const response = await fetch(url, { method: 'GET' });
    const rawText = await response.text();
    console.log('[SMS] Gateway Hub response:', rawText);
    lastSmsDebug.response = rawText;
    return { success: true, response: rawText };
  } catch (err) {
    console.error('[SMS] Send failed:', err.message);
    lastSmsDebug.error = err.message;
    return { success: false, error: err.message };
  }
};

const handleBookingStatusSmsTrigger = async (order, oldStatus, newStatus) => {
  const phone = order.userPhone;
  const orderId = order.id;
  const serviceName = order.serviceName || order.productId || "Service";

  const oldS = (oldStatus || '').toLowerCase();
  const newS = (newStatus || '').toLowerCase();

  if (oldS === newS) return; // No change

  // Case 1: Booking Placed / Confirmed
  if ((oldS === '' || oldS === 'draft') && (newS === 'searching' || newS === 'accepted')) {
    const templateId = process.env.SMS_TEMPLATE_PLACED_ID || '1207173589889308632';
    const templateText = process.env.SMS_TEMPLATE_PLACED_TEXT || `Your booking for {serviceName} is confirmed with order ID #{orderId}. Thank You, Super Home`;
    const message = templateText.replace(/{orderId}/g, orderId).replace(/{serviceName}/g, serviceName).replace(/{#var#}/g, orderId);
    await sendSMS(phone, message, templateId);
  }

  // Case 2: Partner Assigned
  if (oldS === 'searching' && newS === 'accepted') {
    const partnerName = order.partnerName || "Our Expert Partner";
    const templateId = process.env.SMS_TEMPLATE_ACCEPTED_ID || '1207173589889308632';
    const templateText = process.env.SMS_TEMPLATE_ACCEPTED_TEXT || `Expert partner {partnerName} has been assigned to your order #{orderId}. Thank You, Super Home`;
    const message = templateText.replace(/{orderId}/g, orderId).replace(/{partnerName}/g, partnerName).replace(/{#var#}/g, partnerName);
    await sendSMS(phone, message, templateId);
  }

  // Case 3: Work Completed
  if (newS === 'completed') {
    const templateId = process.env.SMS_TEMPLATE_COMPLETED_ID || '1207173589889308632';
    const templateText = process.env.SMS_TEMPLATE_COMPLETED_TEXT || `Your service for order #{orderId} has been successfully completed. Thank You, Super Home`;
    const message = templateText.replace(/{orderId}/g, orderId).replace(/{#var#}/g, orderId);
    await sendSMS(phone, message, templateId);
  }

  // Case 4: Booking Cancelled
  if (newS === 'cancelled') {
    const templateId = process.env.SMS_TEMPLATE_CANCELLED_ID || '1207173589889308632';
    const templateText = process.env.SMS_TEMPLATE_CANCELLED_TEXT || `Your booking order #{orderId} has been cancelled. Thank You, Super Home`;
    const message = templateText.replace(/{orderId}/g, orderId).replace(/{#var#}/g, orderId);
    await sendSMS(phone, message, templateId);
  }
};

module.exports = {
  sendSMS,
  handleBookingStatusSmsTrigger,
  getLastSmsDebug: () => lastSmsDebug,
  debugLogs
};
