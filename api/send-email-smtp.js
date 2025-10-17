const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { decrypt } = require('./crypto-utils');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

function sanitizeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function checkRateLimit(userId) {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  
  const { count } = await supabaseClient
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('sent_at', oneMinuteAgo);
  
  return count < 5;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, content, contactName, fromName, fromCompany, fromEmail, userId } = req.body;

  console.log('Received request:', { to, subject, fromEmail, userId, hasContent: !!content });

  if (!to) return res.status(400).json({ error: 'Missing recipient email (to)' });
  if (!subject) return res.status(400).json({ error: 'Missing email subject' });
  if (!content) return res.status(400).json({ error: 'Missing email content' });
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  if (!fromEmail) return res.status(400).json({ error: 'Missing sender email (fromEmail)' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to) || !emailRegex.test(fromEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const canSend = await checkRateLimit(userId);
    if (!canSend) {
      return res.status(429).json({ error: 'Rate limit exceeded. Maximum 5 emails per minute.' });
    }

    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('encrypted_email_password')
      .eq('id', userId)
      .single();

    if (error || !profile?.encrypted_email_password) {
      return res.status(400).json({ error: 'Email not configured' });
    }

    let decryptedPassword;
    try {
      decryptedPassword = decrypt(profile.encrypted_email_password);
      console.log('Password decrypted successfully');
    } catch (decryptError) {
      console.error('Decryption error:', decryptError);
      return res.status(500).json({ error: 'Failed to decrypt password: ' + decryptError.message });
    }

    console.log('Attempting to send email:', {
      from: fromEmail,
      to: to,
      subject: subject
    });

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: fromEmail,
        pass: decryptedPassword,
      },
      tls: {
        rejectUnauthorized: true
      },
      debug: true,
      logger: true
    });

    // Verify connection
    console.log('Verifying SMTP connection...');
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      return res.status(500).json({ 
        error: 'Gmail connection failed: ' + verifyError.message,
        code: verifyError.code
      });
    }

    const safeName = sanitizeHtml(fromName || 'User');
    const safeCompany = sanitizeHtml(fromCompany || 'Company');
    const safeContent = sanitizeHtml(content);
    
    const emailWithCTA = safeContent.replace(/\[Let's Talk\]\((.*?)\)/g, 
      `<a href="$1" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Let's Talk</a>`
    );

    const mailOptions = {
      from: `"${safeName} from ${safeCompany}" <${fromEmail}>`,
      to: to,
      bcc: fromEmail,
      subject: sanitizeHtml(subject),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="white-space: pre-line; line-height: 1.6; color: #333; margin-bottom: 30px;">
            ${emailWithCTA.replace(/\n/g, '<br>')}
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>Best regards,<br>
            ${safeName}<br>
            ${safeCompany}<br>
            ${fromEmail}</p>
          </div>
        </div>
      `,
    };

    console.log('Sending email now...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      to: to,
      from: fromEmail
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('SMTP sending error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    let errorMessage = error.message || 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed. Please check your app password.';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Connection to Gmail failed. Please try again.';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      code: error.code,
      details: error.response
    });
  }
}