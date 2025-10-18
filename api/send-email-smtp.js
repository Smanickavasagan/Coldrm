const { createTransport } = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { decrypt } = require('./crypto-utils');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}
const supabaseClient = createClient(supabaseUrl, supabaseKey);

function sanitizeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

async function checkRateLimit(userId, userEmail) {
  const adminEmails = ['manickavasagan022@gmail.com', 'manickavasagan60@gmail.com'];
  if (adminEmails.includes(userEmail)) {
    return true; // Skip rate limiting for admin accounts
  }
  
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const requestedWith = req.headers['x-requested-with'];
  const csrfToken = req.headers['x-csrf-token'];
  if (requestedWith !== 'XMLHttpRequest' || csrfToken !== 'coldrm-csrf-token') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { to, subject, content, contactName, fromName, fromCompany, fromEmail, userId } = req.body;



  if (!to || typeof to !== 'string') return res.status(400).json({ error: 'Invalid recipient email' });
  if (!subject || typeof subject !== 'string') return res.status(400).json({ error: 'Invalid email subject' });
  if (!content || typeof content !== 'string') return res.status(400).json({ error: 'Invalid email content' });
  if (!userId || typeof userId !== 'string') return res.status(400).json({ error: 'Invalid userId' });
  if (!fromEmail || typeof fromEmail !== 'string') return res.status(400).json({ error: 'Invalid sender email' });
  
  if (subject.length > 200) return res.status(400).json({ error: 'Subject too long' });
  if (content.length > 10000) return res.status(400).json({ error: 'Content too long' });

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(to) || !emailRegex.test(fromEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const canSend = await checkRateLimit(userId, fromEmail);
    if (!canSend) {
      return res.status(429).json({ error: 'Rate limit exceeded. Maximum 5 emails per minute.' });
    }

    const { data: profiles, error } = await supabaseClient
      .from('profiles')
      .select('encrypted_email_password')
      .eq('id', userId);

    if (error) {
      return res.status(400).json({ error: 'Database error: ' + error.message });
    }
    
    const profile = profiles?.[0];
    if (!profile?.encrypted_email_password) {
      return res.status(400).json({ error: 'Email not configured in database' });
    }

    let decryptedPassword;
    try {
      decryptedPassword = decrypt(profile.encrypted_email_password);
    } catch (decryptError) {
      return res.status(500).json({ error: 'Failed to decrypt password: ' + decryptError.message });
    }

    const transporter = createTransport({
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
    try {
      await transporter.verify();
    } catch (verifyError) {
      return res.status(500).json({ 
        error: 'Gmail connection failed: ' + verifyError.message,
        code: verifyError.code
      });
    }

    const safeName = sanitizeHtml(fromName || 'User');
    const safeCompany = sanitizeHtml(fromCompany || 'Company');
    
    // Replace CTA BEFORE sanitizing - sanitize URL
    const emailWithCTA = content.replace(/\[Let's Talk\]\((.*?)\)/g, (match, url) => {
      const sanitizedUrl = sanitizeHtml(url);
      return `<a href="${sanitizedUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Let's Talk</a>`;
    });
    
    // Now sanitize everything except the CTA button HTML
    const safeContent = emailWithCTA.replace(/<a href="(.*?)".*?>Let's Talk<\/a>/g, '___CTA_PLACEHOLDER___')
      .split('___CTA_PLACEHOLDER___')
      .map((part, i, arr) => {
        if (i < arr.length - 1) {
          const ctaMatch = emailWithCTA.match(/<a href="(.*?)".*?>Let's Talk<\/a>/g);
          return sanitizeHtml(part) + (ctaMatch?.[i] || '');
        }
        return sanitizeHtml(part);
      })
      .join('');

    const mailOptions = {
      from: `"${safeName} from ${safeCompany}" <${fromEmail}>`,
      to: to,
      bcc: fromEmail,
      subject: sanitizeHtml(subject),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="white-space: pre-line; line-height: 1.6; color: #333; margin-bottom: 30px;">
            <p style="margin-bottom: 20px;"><strong>Hi ${sanitizeHtml(contactName || 'there')},</strong></p>
            ${safeContent.replace(/\n/g, '<br>')}
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>Best regards,<br>
            ${safeName}<br>
            ${safeCompany}<br>
            ${sanitizeHtml(fromEmail)}</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
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