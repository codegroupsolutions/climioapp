// Script to update version.js from package.json
const fs = require('fs');
const path = require('path');

try {
  // Read package.json
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const version = packageJson.version;

  if (!version) {
    throw new Error('Version not found in package.json');
  }

  // Update version.js
  const versionPath = path.join(__dirname, '..', 'src', 'config', 'version.js');
  const versionContent = `// Version configuration
// This file is auto-generated from package.json during build
// Do not edit manually - update package.json version instead
export const APP_VERSION = '${version}'
`;

  // Force write the file (overwrite if exists)
  fs.writeFileSync(versionPath, versionContent, 'utf8');
  
  // Verify the file was written correctly
  const writtenContent = fs.readFileSync(versionPath, 'utf8');
  if (!writtenContent.includes(`APP_VERSION = '${version}'`)) {
    throw new Error('Failed to verify version update');
  }
  
  console.log(`✓ Version updated to ${version} in src/config/version.js`);
  console.log(`  File path: ${versionPath}`);
  console.log(`  Content verified: ${writtenContent.includes(`'${version}'`) ? 'OK' : 'FAILED'}`);
} catch (error) {
  console.error('Error updating version:', error);
  process.exit(1);
}
