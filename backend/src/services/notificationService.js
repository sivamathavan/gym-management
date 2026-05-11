const twilio = require('twilio');
const nodemailer = require('nodemailer');
const { query } = require('../config/db');
const dayjs = require('dayjs');

let twilioClient;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } else {
    console.warn('Twilio SID missing or invalid. WhatsApp/SMS features disabled.');
  }
} catch (err) {
  console.error('Twilio initialization failed:', err.message);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

// ── Send WhatsApp message ─────────────────────
async function sendWhatsApp(phone, message) {
  try {
    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:+91${phone.replace(/\D/g,'')}`,
      body: message
    });
    return true;
  } catch (err) {
    console.error('WhatsApp send failed:', err.message);
    return false;
  }
}

// ── Send SMS ─────────────────────────────────
async function sendSMS(phone, message) {
  try {
    await twilioClient.messages.create({
      from: process.env.TWILIO_SMS_FROM,
      to: `+91${phone.replace(/\D/g,'')}`,
      body: message
    });
    return true;
  } catch (err) {
    console.error('SMS send failed:', err.message);
    return false;
  }
}

// ── Send Email ────────────────────────────────
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"FitCore Gym" <${process.env.SMTP_USER}>`,
      to, subject, html
    });
    return true;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
}

// ── Log notification ──────────────────────────
async function logNotification(member_id, type, channel, subject, body, status) {
  await query(
    `INSERT INTO notifications (member_id, type, channel, subject, body, status, sent_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
    [member_id, type, channel, subject, body, status ? 'sent' : 'failed']
  );
}

// ── Welcome new member ────────────────────────
async function sendWelcome(member) {
  const msg = `🎉 Welcome to FitCore, ${member.name}!\n\nYour membership is now active. Member ID: ${member.member_code}\n\nBook classes, check attendance & manage your account at: https://app.fitcore.in\n\nSee you at the gym! 💪`;
  const ok = await sendWhatsApp(member.phone, msg);
  await logNotification(member.id, 'welcome', 'whatsapp', 'Welcome to FitCore', msg, ok);
}

// ── Expiry reminder ───────────────────────────
async function sendExpiryReminder(member, daysLeft) {
  const urgency = daysLeft <= 3 ? '🚨 URGENT' : '⏰ Reminder';
  const msg = `${urgency}: Hi ${member.name}, your ${member.plan_name} membership expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${dayjs(member.membership_end).format('DD MMM YYYY')}).\n\nRenew now to keep your access: https://app.fitcore.in/renew\n\nNeed help? Call us: +91 44 2345 6789`;
  const ok = await sendWhatsApp(member.phone, msg);
  await logNotification(member.id, 'expiry_reminder', 'whatsapp', `Membership expires in ${daysLeft} days`, msg, ok);
  if (daysLeft <= 3 && member.email) {
    await sendEmail(member.email, `FitCore: Membership expires in ${daysLeft} days`,
      `<p>Hi ${member.name},</p><p>Your membership expires in <strong>${daysLeft} days</strong>. <a href="https://app.fitcore.in/renew">Click here to renew</a>.</p>`
    );
  }
}

// ── Renewal confirmation ──────────────────────
async function sendRenewalConfirmation(member, payment, invoiceUrl) {
  const msg = `✅ Membership renewed! Hi ${member.name}, your FitCore membership has been renewed successfully.\n\nAmount: ₹${payment.final_amount}\nInvoice: ${payment.invoice_number}\nValid till: ${dayjs(member.membership_end).format('DD MMM YYYY')}\n\nDownload invoice: ${invoiceUrl}\n\nThank you! 🙏`;
  const ok = await sendWhatsApp(member.phone, msg);
  await logNotification(member.id, 'renewal_confirmation', 'whatsapp', 'Membership Renewed', msg, ok);
}

// ── Payment failed ────────────────────────────
async function sendPaymentFailed(member, amount) {
  const msg = `❌ Payment failed: Hi ${member.name}, we couldn't process ₹${amount} for your membership renewal.\n\nPlease retry: https://app.fitcore.in/renew\n\nYour access continues for 3 more days. Contact us if you need help.`;
  await sendWhatsApp(member.phone, msg);
  await sendSMS(member.phone, `FitCore: Payment of ₹${amount} failed. Retry at https://app.fitcore.in/renew`);
}

// ── Class booking confirmation ────────────────
async function sendBookingConfirmation(member, classSession) {
  const msg = `📅 Class booked! ${classSession.class_name} on ${dayjs(classSession.session_date).format('DD MMM')} at ${classSession.start_time}.\n\nTrainer: ${classSession.trainer_name}\nBranch: ${classSession.branch_name}\n\nSee you there! 💪`;
  await sendWhatsApp(member.phone, msg);
}

// ── Re-engagement campaign ────────────────────
async function sendReengagement(member, daysSinceVisit) {
  const msg = `💪 We miss you, ${member.name}! It's been ${daysSinceVisit} days since your last visit to FitCore.\n\nYour membership is active — come back and crush your goals!\n\nBook a class: https://app.fitcore.in/classes\n\nSpecial offer: Show this message for a free protein shake 🥤`;
  await sendWhatsApp(member.phone, msg);
  await logNotification(member.id, 'reengagement', 'whatsapp', 'We miss you!', msg, true);
}

module.exports = {
  sendWelcome, sendExpiryReminder, sendRenewalConfirmation,
  sendPaymentFailed, sendBookingConfirmation, sendReengagement,
  sendWhatsApp, sendSMS, sendEmail
};
