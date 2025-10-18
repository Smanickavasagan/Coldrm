const { encrypt } = require('./crypto-utils');

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

  const { password } = req.body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid password' });
  }
  
  if (password.length < 8 || password.length > 100) {
    return res.status(400).json({ error: 'Password length must be between 8 and 100 characters' });
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