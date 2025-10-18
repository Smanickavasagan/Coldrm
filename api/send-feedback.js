const { createTransport } = require('nodemailer');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const requestedWith = req.headers['x-requested-with'];
  if (requestedWith !== 'XMLHttpRequest') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { userEmail, userName, companyName, feedback } = req.body;

  if (!userEmail || !feedback) {
    return res.status(400).json({ error: 'Email and feedback are required' });
  }

  try {
    const transporter = createTransport({
      service: 'gmail',
      auth: {
        user: 'noreply@coldrm.com',
        pass: process.env.FEEDBACK_EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: '"COLDrm Feedback" <noreply@coldrm.com>',
      to: 'manickavasagan60@gmail.com',
      subject: 'New Feedback from COLDrm User',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3b82f6;">New Feedback Received</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">User Details:</h3>
            <p><strong>Name:</strong> ${userName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Company:</strong> ${companyName || 'Not provided'}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="margin-top: 0;">Feedback:</h3>
            <p style="white-space: pre-line; line-height: 1.6;">${feedback}</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 12px;">
            <p>This feedback was sent from COLDrm Dashboard</p>
            <p>Timestamp: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ success: true, message: 'Feedback sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send feedback: ' + error.message });
  }
}