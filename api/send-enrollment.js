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

async function checkEnrollmentLimit(userId) {
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  
  const { count } = await supabaseClient
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('subject', 'COLDrm - Lifetime Free Access Enrollment')
    .gte('sent_at', oneDayAgo);
  
  return count === 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, reason, feedback, userEmail, userId } = req.body;

  if (!name || !email || !reason || !feedback || !userId || !userEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || !emailRegex.test(userEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const canEnroll = await checkEnrollmentLimit(userId);
    if (!canEnroll) {
      return res.status(429).json({ error: 'You can only enroll once per 24 hours' });
    }

    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('encrypted_email_password')
      .eq('id', userId)
      .single();

    if (error || !profile?.encrypted_email_password) {
      return res.status(400).json({ error: 'Email not configured. Please set up your Gmail in dashboard first.' });
    }

    const decryptedPassword = decrypt(profile.encrypted_email_password);

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: userEmail,
        pass: decryptedPassword,
      },
    });

    const safeName = sanitizeHtml(name);
    const safeEmail = sanitizeHtml(email);
    const safeReason = sanitizeHtml(reason);
    const safeFeedback = sanitizeHtml(feedback);
    const safeUserEmail = sanitizeHtml(userEmail);

    const mailOptions = {
      from: userEmail,
      to: 'manickavasagan60@gmail.com',
      subject: 'COLDrm - Lifetime Free Access Enrollment',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3b82f6;">New Enrollment for Lifetime Free Access</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Applicant Details:</h3>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>User Account:</strong> ${safeUserEmail}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Why they need COLDrm:</h3>
            <p style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 4px;">
              ${safeReason}
            </p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Feedback & Suggestions:</h3>
            <p style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #10b981; border-radius: 4px;">
              ${safeFeedback}
            </p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 12px;">
            This enrollment was submitted from COLDrm application.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    await supabaseClient.from('email_logs').insert([{
      user_id: userId,
      contact_id: null,
      subject: 'COLDrm - Lifetime Free Access Enrollment',
      content: 'Enrollment submission',
      status: 'sent'
    }]);
    
    res.status(200).json({ 
      success: true, 
      message: 'Enrollment submitted successfully' 
    });
  } catch (error) {
    console.error('Enrollment email error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit enrollment' 
    });
  }
}