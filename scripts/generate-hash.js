// Script to generate a salted hash for the ADMIN_PASSWORD_HASH environment variable
const { randomBytes, scryptSync } = require('crypto');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node generate-hash.js <password>');
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const derivedKey = scryptSync(password, salt, 64);
const hash = derivedKey.toString('hex');

console.log(`\nYour ADMIN_PASSWORD_HASH is:\n${salt}:${hash}\n`);
console.log('Add this line to your .env.local file:');
console.log(`ADMIN_PASSWORD_HASH=${salt}:${hash}\n`);
