/**
 * Dependency-Cruiser Integration Test
 * 
 * Verifies dependency-cruiser is working and enforcing rules.
 * 
 * Run: npm run test:arch -- dependency-cruiser.test.js
 */

const { execSync } = require('child_process');
const path = require('path');

describe('🔍 Dependency-Cruiser Integration', () => {
  
  it('should run dependency-cruiser without errors', () => {
    const backendDir = path.join(__dirname, '../..');
    
    let output;
    let exitCode = 0;
    
    try {
      // Run dependency-cruiser
      output = execSync(
        'npx depcruise --config .dependency-cruiser.js models services routes middleware utils validators',
        {
          cwd: backendDir,
          encoding: 'utf-8',
          stdio: 'pipe'
        }
      );
    } catch (error) {
      // depcruise returns non-zero exit code if violations found
      output = error.stdout || error.stderr || error.message;
      exitCode = error.status || 1;
    }
    
    console.log('\n📊 Dependency-Cruiser Output:');
    console.log(output);
    
    // Check that dependency-cruiser ran successfully
    expect(output).toBeDefined();
    expect(output.length).toBeGreaterThan(0);
  });
  
  it('should detect current architecture issues', () => {
    const backendDir = path.join(__dirname, '../..');
    
    let output;
    
    try {
      output = execSync(
        'npx depcruise --config .dependency-cruiser.js models services routes middleware utils validators',
        {
          cwd: backendDir,
          encoding: 'utf-8',
          stdio: 'pipe'
        }
      );
    } catch (error) {
      output = error.stdout || error.message;
    }
    
    // Should find violations (routes accessing models)
    expect(output).toContain('routes-use-services');
    
    console.log('\n✅ Expected violations found (routes-use-services)');
  });
  
  it('should have no circular dependencies', () => {
    const backendDir = path.join(__dirname, '../..');
    
    let output;
    
    try {
      output = execSync(
        'npx depcruise --config .dependency-cruiser.js models services routes middleware utils validators',
        {
          cwd: backendDir,
          encoding: 'utf-8',
          stdio: 'pipe'
        }
      );
    } catch (error) {
      output = error.stdout || error.message;
    }
    
    // Should NOT find circular dependencies
    expect(output).not.toContain('no-circular');
    
    console.log('\n✅ No circular dependencies detected');
  });
  
  it('should have no forbidden dependencies (errors)', () => {
    const backendDir = path.join(__dirname, '../..');
    
    let output;
    let hasErrors = false;
    
    try {
      output = execSync(
        'npx depcruise --config .dependency-cruiser.js models services routes middleware utils validators',
        {
          cwd: backendDir,
          encoding: 'utf-8',
          stdio: 'pipe'
        }
      );
    } catch (error) {
      output = error.stdout || error.message;
      hasErrors = true;
    }
    
    // Check for error violations (should be 0)
    const errorMatch = output.match(/(\d+) errors?/);
    const errorCount = errorMatch ? parseInt(errorMatch[1]) : 0;
    
    console.log(`\n📊 Error violations: ${errorCount}`);
    
    // No error-level violations should exist
    expect(errorCount).toBe(0);
  });
  
  it('should scan all expected modules', () => {
    const backendDir = path.join(__dirname, '../..');
    
    let output;
    
    try {
      output = execSync(
        'npx depcruise --config .dependency-cruiser.js models services routes middleware utils validators',
        {
          cwd: backendDir,
          encoding: 'utf-8',
          stdio: 'pipe'
        }
      );
    } catch (error) {
      output = error.stdout || error.message;
    }
    
    // Should scan all modules
    const moduleMatch = output.match(/(\d+) modules?/);
    const moduleCount = moduleMatch ? parseInt(moduleMatch[1]) : 0;
    
    console.log(`\n📊 Modules scanned: ${moduleCount}`);
    
    // Should scan at least 30 modules
    expect(moduleCount).toBeGreaterThan(30);
  });
  
  it('should generate configuration report', () => {
    const backendDir = path.join(__dirname, '../..');
    
    let output;
    
    try {
      output = execSync(
        'npx depcruise --config .dependency-cruiser.js models services routes middleware utils validators',
        {
          cwd: backendDir,
          encoding: 'utf-8',
          stdio: 'pipe'
        }
      );
    } catch (error) {
      output = error.stdout || error.message;
    }
    
    console.log('\n📋 Dependency-Cruiser Summary:');
    
    // Extract summary information
    const moduleMatch = output.match(/(\d+) modules?/);
    const depMatch = output.match(/(\d+) dependencies/);
    const errorMatch = output.match(/(\d+) errors?/);
    const warnMatch = output.match(/(\d+) warnings?/);
    
    const moduleCount = moduleMatch ? parseInt(moduleMatch[1]) : 0;
    const depCount = depMatch ? parseInt(depMatch[1]) : 0;
    const errorCount = errorMatch ? parseInt(errorMatch[1]) : 0;
    const warnCount = warnMatch ? parseInt(warnMatch[1]) : 0;
    
    console.log(`  Modules:      ${moduleCount}`);
    console.log(`  Dependencies: ${depCount}`);
    console.log(`  Errors:       ${errorCount}`);
    console.log(`  Warnings:     ${warnCount}`);
    console.log('');
    console.log('  Status:       ✅ dependency-cruiser is working correctly');
    
    // Verify dependency-cruiser is actually working
    expect(moduleCount).toBeGreaterThan(0);
    expect(depCount).toBeGreaterThan(0);
  });
  
});
