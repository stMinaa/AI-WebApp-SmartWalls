#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Running pre-commit checks...\n');

try {
  // Change to frontend directory
  process.chdir(path.join(__dirname, '..', 'frontend'));
  
  console.log('📦 Checking frontend for compilation errors...');
  
  // Run build and capture output
  const output = execSync('npm run build', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  // Check for errors in output (not warnings)
  if (output.includes('Failed to compile') || output.includes('ERROR in')) {
    console.error('❌ Frontend build failed! Fix errors before committing.');
    console.error(output);
    process.exit(1);
  }
  
  console.log('✅ Frontend build successful!');
  console.log('✅ All pre-commit checks passed!\n');
  process.exit(0);
  
} catch (error) {
  console.error('❌ Pre-commit check failed!');
  console.error(error.stdout || error.message);
  process.exit(1);
}
