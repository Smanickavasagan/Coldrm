const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const requestedWith = req.headers['x-requested-with'];
  const csrfToken = req.headers['x-csrf-token'];
  if (requestedWith !== 'XMLHttpRequest' || csrfToken !== 'coldrm-csrf-token') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { userEmail, userName, companyName, feedback } = req.body;

  if (!userEmail || !feedback) {
    return res.status(400).json({ error: 'Email and feedback are required' });
  }

  try {
    // Store feedback in database instead of sending email
    const { error } = await supabaseClient
      .from('feedback')
      .insert([{
        user_email: userEmail,
        user_name: userName || 'Not provided',
        company_name: companyName || 'Not provided',
        feedback_text: feedback,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
    
    res.status(200).json({ success: true, message: 'Feedback sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send feedback: ' + error.message });
  }
}