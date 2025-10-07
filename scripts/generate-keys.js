#!/usr/bin/env node

/**
 * Generate Chrome extension keys for fixed extension ID
 * Based on Plasmo documentation: https://docs.plasmo.com/quickstarts/with-stripe
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('🔑 Generating Chrome extension keys...');

  // 1. Generate private key
  console.log('1. Generating private key...');
  execSync('openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out key.pem', {
    stdio: 'inherit',
  });

  // 2. Generate public key
  console.log('2. Generating public key...');
  const publicKey = execSync('openssl rsa -in key.pem -pubout -outform DER | openssl base64 -A', {
    encoding: 'utf8',
  }).trim();

  console.log('\n✅ Keys generated successfully!');
  console.log('\n📋 Please add the following public key to your .env.development file:');
  console.log(`CRX_PUBLIC_KEY=${publicKey}`);

  console.log('\n⚠️  Please keep key.pem file secure and do not commit to version control!');
  console.log('💡 Recommend adding key.pem to .gitignore file');

  // Auto-update .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  let gitignoreContent = '';

  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }

  if (!gitignoreContent.includes('key.pem')) {
    gitignoreContent += '\n# Chrome Extension Private Key\nkey.pem\n';
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ Automatically added key.pem to .gitignore');
  }
} catch (error) {
  console.error('❌ Key generation failed:', error.message);
  console.error('\nPlease ensure OpenSSL is installed:');
  console.error('- Windows: Install Git for Windows or WSL');
  console.error('- macOS: brew install openssl');
  console.error('- Linux: sudo apt-get install openssl');
  process.exit(1);
}
