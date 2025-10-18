const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { decrypt } = require('./crypto-utils');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function sanitizeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function checkEnrollmentLimit(userId) {
  const { count, error } = await supabaseClient
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('subject', 'COLDrm - Lifetime Free Access Enrollment');
  
  console.log('Backend enrollment check - User:', userId, 'Count:', count, 'Error:', error);
  return count === 0;
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
  if (requestedWith !== 'XMLHttpRequest') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { name, email, reason, feedback, userEmail, userId } = req.body;

  if (!name || typeof name !== 'string' || name.length > 100) {
    return res.status(400).json({ error: 'Invalid name' });
  }
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!reason || typeof reason !== 'string' || reason.length > 500) {
    return res.status(400).json({ error: 'Invalid reason' });
  }
  if (!feedback || typeof feedback !== 'string' || feedback.length > 1000) {
    return res.status(400).json({ error: 'Invalid feedback' });
  }
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid userId' });
  }
  if (!userEmail || typeof userEmail !== 'string') {
    return res.status(400).json({ error: 'Invalid userEmail' });
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email) || !emailRegex.test(userEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const canEnroll = await checkEnrollmentLimit(userId);
    if (!canEnroll) {
      console.log('User', userId, 'attempted duplicate enrollment');
      return res.status(429).json({ error: 'You have already enrolled for the giveaway' });
    }

    let { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('encrypted_email_password, email_configured, username, company_name')
      .eq('id', userId)
      .single();

    // If profile doesn't exist, create it
    if (profileError && profileError.code === 'PGRST116') {
      // Get user metadata from auth
      const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
      if (userError) {
        console.error('User fetch error:', userError);
        return res.status(400).json({ error: 'User not found. Please try logging out and back in.' });
      }

      // Create profile with user metadata
      const { data: newProfile, error: createError } = await supabaseClient
        .from('profiles')
        .insert([{
          id: userId,
          username: user.user_metadata?.username || 'User',
          company_name: user.user_metadata?.company_name || 'Company',
          email_configured: false
        }])
        .select()
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        return res.status(500).json({ error: 'Failed to create user profile.' });
      }

      profile = newProfile;
    } else if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(400).json({ error: 'Database error. Please try again.' });
    }

    if (!profile?.encrypted_email_password || !profile?.email_configured) {
      return res.status(400).json({ error: 'Email not configured. Please set up your Gmail in dashboard first.' });
    }

    const decryptedPassword = decrypt(profile.encrypted_email_password);

    const transporter = nodemailer.createTransport({
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

    // Log enrollment in email_logs table
    const enrollmentLog = {
      user_id: userId,
      contact_id: null,
      subject: 'COLDrm - Lifetime Free Access Enrollment',
      content: 'Enrollment submission',
      status: 'sent'
    };
    
    console.log('Attempting to insert enrollment log:', enrollmentLog);
    
    const { data: logData, error: logError } = await supabaseClient
      .from('email_logs')
      .insert([enrollmentLog])
      .select();
    
    console.log('Insert result - Data:', logData, 'Error:', logError);
    
    if (logError) {
      console.error('Failed to log enrollment:', logError);
      throw new Error('Failed to record enrollment: ' + logError.message);
    }
    
    if (!logData || logData.length === 0) {
      throw new Error('No data returned from enrollment logging');
    }
    
    console.log('Enrollment logged successfully for user:', userId, 'Data:', logData);
    
    res.status(200).json({ 
      success: true, 
      message: 'Enrollment submitted successfully' 
    });
  } catch (error) {
    console.error('Enrollment email error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to submit enrollment' 
    });
  }
}