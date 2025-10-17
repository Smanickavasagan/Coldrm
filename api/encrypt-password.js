const { encrypt } = require('./crypto-utils');

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

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    const encryptedPassword = encrypt(password);
    res.status(200).json({ 
      success: true, 
      encryptedPassword 
    });
  } catch (error) {
    console.error('Encryption error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to encrypt password' 
    });
  }
}