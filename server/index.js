const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Create transporter with debug & logger enabled so SMTP interactions appear in console
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 465),
  secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true,
  // By default nodemailer uses TLS; you can add tls: { rejectUnauthorized: false } for testing with self-signed certs
});

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Verify SMTP connection and credentials
app.get('/verify', async (req, res) => {
  try {
    const result = await transporter.verify();
    console.log('SMTP verify result:', result);
    res.json({ ok: true, verified: true, result });
  } catch (err) {
    console.error('SMTP verify error:', err);
    res.status(500).json({ ok: false, verified: false, error: err && err.message ? err.message : err });
  }
});

// Send a single test email and return full provider response
app.post('/send-test', async (req, res) => {
  const to = req.body.to || process.env.EMAIL_TEST_TO || process.env.EMAIL_USER;
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const mail = {
    from,
    to,
    subject: req.body.subject || 'COLDrm test message',
    text: req.body.text || 'This is a test message from COLDrm. If you receive this, SMTP works.',
    html: req.body.html || '<p>This is a test message from <strong>COLDrm</strong>. If you receive this, SMTP works.</p>',
  };

  try {
    const info = await transporter.sendMail(mail);
    // Log everything: accepted, rejected, envelope, messageId, response
    console.log('sendMail info:', {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      messageId: info.messageId,
      envelope: info.envelope,
    });
    res.json({ ok: true, info });
  } catch (err) {
    console.error('sendMail error:', err);
    res.status(500).json({ ok: false, error: err && err.message ? err.message : err });
  }
});

// Send campaign endpoint (single recipient body) — returns provider response per send
app.post('/send', async (req, res) => {
  const { to, subject, text, html } = req.body;
  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ ok: false, error: 'Missing required fields: to, subject, text/html' });
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const mail = { from, to, subject, text, html };

  try {
    const info = await transporter.sendMail(mail);
    console.log('campaign sendMail info:', {
      to,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      messageId: info.messageId,
      envelope: info.envelope,
    });
    res.json({ ok: true, info });
  } catch (err) {
    console.error('campaign sendMail error:', err);
    res.status(500).json({ ok: false, error: err && err.message ? err.message : err });
  }
});

const port = Number(process.env.SERVER_PORT || 3001);
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
  console.log('Environment EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('Using EMAIL_USER:', process.env.EMAIL_USER);
});