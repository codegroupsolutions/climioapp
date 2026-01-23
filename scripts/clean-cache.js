// Script to clean Next.js cache
const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');

try {
  if (fs.existsSync(nextDir)) {
    console.log('Cleaning .next directory...');
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('✓ Cache cleaned successfully');
  } else {
    console.log('No .next directory found, skipping clean');
  }
} catch (error) {
  console.error('Error cleaning cache:', error);
  process.exit(1);
}
