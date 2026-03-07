/**
 * Notification Service — SMS via Twilio, Email via SendGrid
 * Both are optional; gracefully no-ops if env vars are missing.
 */

let twilioClient = null;
let sgMail = null;

// Init Twilio
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch { console.warn('Twilio not available'); }
}

// Init SendGrid
if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  } catch { console.warn('SendGrid not available'); }
}

/**
 * Send order confirmation to customer.
 * @param {Object} order
 * @param {Object} user
 */
exports.sendOrderNotification = async (order, user) => {
  const itemList = (order.items || []).map(i => `${i.name} x${i.qty}`).join(', ');
  const message = `🍽️ Zaika Order #${order.id.slice(0,8)} Confirmed!\nItems: ${itemList}\nTotal: ₹${order.total_price}\nStatus: ${order.status}`;

  const results = await Promise.allSettled([
    sendSMS(order.delivery_phone || user.phone, message),
    sendEmail(order.delivery_email || user.email, order, itemList),
  ]);

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.warn(`Notification ${i === 0 ? 'SMS' : 'Email'} failed:`, r.reason?.message);
    }
  });
};

async function sendSMS(phone, message) {
  if (!twilioClient || !phone) return { skipped: true };
  return twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
}

async function sendEmail(email, order, itemList) {
  if (!sgMail || !email) return { skipped: true };

  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
      <h2 style="color:#e85d04;">🍽️ Zaika — Order Confirmed!</h2>
      <p>Hi ${order.customer_name || 'there'}, your order has been confirmed.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="background:#fef3c7;">
          <th style="padding:8px;text-align:left;">Order ID</th>
          <td style="padding:8px;">#${order.id.slice(0,8)}</td>
        </tr>
        <tr>
          <th style="padding:8px;text-align:left;">Items</th>
          <td style="padding:8px;">${itemList}</td>
        </tr>
        <tr style="background:#fef3c7;">
          <th style="padding:8px;text-align:left;">Total</th>
          <td style="padding:8px;font-weight:bold;">₹${order.total_price}</td>
        </tr>
        <tr>
          <th style="padding:8px;text-align:left;">Status</th>
          <td style="padding:8px;color:green;">${order.status}</td>
        </tr>
      </table>
      <p style="color:#666;font-size:12px;margin-top:20px;">Thank you for ordering from Zaika!</p>
    </div>
  `;

  return sgMail.send({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@zaika.com',
    subject: `Order Confirmed — Zaika #${order.id.slice(0,8)}`,
    text: `Order confirmed! Items: ${itemList}. Total: ₹${order.total_price}`,
    html,
  });
}
