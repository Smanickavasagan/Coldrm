const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

function getKey() {
  const encKey = process.env.ENCRYPTION_KEY;
  if (!encKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  // If it's a hex string (64 chars), convert from hex, otherwise use as utf8
  if (encKey.length === 64) {
    return Buffer.from(encKey, 'hex');
  }
  return Buffer.from(encKey, 'utf8').slice(0, 32);
}

const key = getKey();

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = parts.join(':');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };