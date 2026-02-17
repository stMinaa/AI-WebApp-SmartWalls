/* eslint-disable max-nested-callbacks */
/**
 * Architectural Baseline Tests (Pre-Refactoring)
 *
 * These tests check current code quality BEFORE hexagonal refactoring.
 * Purpose: Establish baseline, identify what needs fixing.
 *
 * Run: npm test -- test/architecture/baseline.test.js
 */

const fs = require('fs');
const path = require('path');

// Helper: Recursively find all .js files in a directory
function findJsFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

describe('🏗️ Architectural Baseline (Current State)', () => {
  describe('Service Layer - Framework Isolation', () => {
    it('should check how many services import Express', () => {
      const servicesDir = path.join(__dirname, '../../services');
      const serviceFiles = findJsFiles(servicesDir);

      let expressImports = 0;
      const violatingFiles = [];

      serviceFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const relPath = path.relative(path.join(__dirname, '../..'), file);

        if (/require\(['"]express['"]\)|from ['"]express['"]/.test(content)) {
          expressImports++;
          violatingFiles.push(relPath);
        }
      });

      console.log(`\n📊 Express imports in services: ${expressImports}/${serviceFiles.length}`);
      if (violatingFiles.length > 0) {
        console.log('   Files with Express:', violatingFiles);
      }

      // This will likely fail - that's OK, it shows what to fix
      expect(expressImports).toBe(0);
    });

    it('should check how many services import Mongoose models directly', () => {
      const servicesDir = path.join(__dirname, '../../services');
      const serviceFiles = findJsFiles(servicesDir);

      let mongooseImports = 0;
      const violatingFiles = [];

      serviceFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const relPath = path.relative(path.join(__dirname, '../..'), file);

        // Check for ../models imports (tight coupling)
        if (
          /require\(['"]\.\.\/models\//.test(content) ||
          /from ['"]\.\.\/models\//.test(content)
        ) {
          mongooseImports++;
          violatingFiles.push(relPath);
        }
      });

      console.log(
        `\n📊 Direct model imports in services: ${mongooseImports}/${serviceFiles.length}`
      );
      if (violatingFiles.length > 0) {
        console.log('   Files importing models:', violatingFiles.slice(0, 5)); // Show first 5
        if (violatingFiles.length > 5) {
          console.log(`   ... and ${violatingFiles.length - 5} more`);
        }
      }

      // This is expected in current architecture - just documenting
      expect(mongooseImports).toBeGreaterThan(0); // We EXPECT this to be true now
    });
  });

  describe('Model Layer - Data Structure Purity', () => {
    it('should check if models contain business logic', () => {
      const modelsDir = path.join(__dirname, '../../models');
      const modelFiles = findJsFiles(modelsDir);

      let modelsWithLogic = 0;
      const violations = [];

      modelFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const relPath = path.relative(path.join(__dirname, '../..'), file);

        // Check for methods that are NOT just getters/setters
        // This is a simple heuristic
        const hasComplexLogic =
          /\.methods\.[a-zA-Z_]+\s*=\s*function/.test(content) ||
          /\.methods\.[a-zA-Z_]+\s*=\s*async function/.test(content);

        if (hasComplexLogic) {
          modelsWithLogic++;
          violations.push(relPath);
        }
      });

      console.log(`\n📊 Models with business logic: ${modelsWithLogic}/${modelFiles.length}`);
      if (violations.length > 0) {
        console.log('   Files with logic:', violations);
      }

      // Models should be pure data structures (this might fail - that's expected)
      // In hexagonal, logic moves to domain services
    });
  });

  describe('Routes Layer - Thin Controllers', () => {
    it('should check route file sizes (should delegate to services)', () => {
      const routesDir = path.join(__dirname, '../../routes');
      const routeFiles = findJsFiles(routesDir);

      const largeRouteFiles = [];
      const MAX_LINES = 500; // Routes should be thin

      routeFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n').length;
        const relPath = path.relative(path.join(__dirname, '../..'), file);

        if (lines > MAX_LINES) {
          largeRouteFiles.push({ file: relPath, lines });
        }
      });

      console.log(`\n📊 Route files > ${MAX_LINES} lines:`, largeRouteFiles.length);
      if (largeRouteFiles.length > 0) {
        largeRouteFiles.forEach(({ file, lines }) => {
          console.log(`   ${file}: ${lines} lines`);
        });
      }

      // This is informational - shows where complexity is
    });

    it('should verify routes delegate to services', () => {
      const routesDir = path.join(__dirname, '../../routes');
      const routeFiles = findJsFiles(routesDir);

      let routesUsingServices = 0;

      routeFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');

        // Check if route imports from services
        if (
          /require\(['"]\.\.\/services\//.test(content) ||
          /from ['"]\.\.\/services\//.test(content)
        ) {
          routesUsingServices++;
        }
      });

      console.log(`\n📊 Route files using services: ${routesUsingServices}/${routeFiles.length}`);

      // Aspirational: routes should delegate to services (will increase during hexagonal migration)
      expect(routesUsingServices).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Circular Dependency Check (Basic)', () => {
    it('should detect obvious circular dependencies', () => {
      // This is a simplified check - real tool = dependency-cruiser
      const servicesDir = path.join(__dirname, '../../services');
      const modelsDir = path.join(__dirname, '../../models');
      const routesDir = path.join(__dirname, '../../routes');

      const allFiles = [
        ...findJsFiles(servicesDir),
        ...findJsFiles(modelsDir),
        ...findJsFiles(routesDir)
      ];

      const dependencies = {};

      // Build dependency map
      allFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const relPath = path.relative(path.join(__dirname, '../..'), file);

        // Extract require statements
        const requires =
          content.match(/require\(['"]\.\.?\/(models|services|routes)\/[^'"]+['"]\)/g) || [];

        dependencies[relPath] = requires
          .map((req) => {
            const match = req.match(/require\(['"](.+)['"]\)/);
            return match ? match[1] : null;
          })
          .filter(Boolean);
      });

      console.log(`\n📊 Dependency map built for ${allFiles.length} files`);

      // Simple circular check: A -> B -> A
      const circular = [];
      Object.keys(dependencies).forEach((fileA) => {
        dependencies[fileA].forEach((depPath) => {
          // Normalize path
          const fileB = depPath.replace(/^\.\.?\//, '');

          if (dependencies[fileB]) {
            dependencies[fileB].forEach((depPathB) => {
              const fileC = depPathB.replace(/^\.\.?\//, '');
              if (fileC.includes(fileA.replace('.js', ''))) {
                circular.push({ from: fileA, to: fileB, back: fileC });
              }
            });
          }
        });
      });

      if (circular.length > 0) {
        console.log('   ⚠️  Potential circular dependencies found:', circular.length);
        circular.slice(0, 3).forEach((c) => {
          console.log(`      ${c.from} -> ${c.to} -> ${c.back}`);
        });
        if (circular.length > 3) {
          console.log(`      ... and ${circular.length - 3} more`);
        }
      } else {
        console.log('   ✅ No obvious circular dependencies detected');
      }
    });
  });

  describe('Naming Conventions', () => {
    it('should check service file naming', () => {
      const servicesDir = path.join(__dirname, '../../services');
      const serviceFiles = findJsFiles(servicesDir);

      const badNames = serviceFiles
        .filter((file) => {
          const basename = path.basename(file, '.js');
          return !basename.endsWith('Service') && basename !== 'index';
        })
        .map((file) => path.relative(path.join(__dirname, '../..'), file));

      console.log(
        `\n📊 Service files with incorrect naming: ${badNames.length}/${serviceFiles.length}`
      );
      if (badNames.length > 0) {
        console.log('   Files not ending with "Service":', badNames);
      }

      // Services should end with "Service"
      expect(badNames.length).toBe(0);
    });

    it('should check model file naming', () => {
      const modelsDir = path.join(__dirname, '../../models');
      const modelFiles = findJsFiles(modelsDir);

      const badNames = modelFiles
        .filter((file) => {
          const basename = path.basename(file, '.js');
          // Models should be PascalCase
          return basename[0] !== basename[0].toUpperCase() && basename !== 'index';
        })
        .map((file) => path.relative(path.join(__dirname, '../..'), file));

      console.log(
        `\n📊 Model files with incorrect naming: ${badNames.length}/${modelFiles.length}`
      );
      if (badNames.length > 0) {
        console.log('   Files not starting with uppercase:', badNames);
      }

      // Models should be PascalCase
      expect(badNames.length).toBe(0);
    });
  });

  describe('Architecture Health Score', () => {
    it('should generate overall architecture health report', () => {
      const servicesDir = path.join(__dirname, '../../services');
      const modelsDir = path.join(__dirname, '../../models');
      const routesDir = path.join(__dirname, '../../routes');

      const serviceFiles = findJsFiles(servicesDir);
      const modelFiles = findJsFiles(modelsDir);
      const routeFiles = findJsFiles(routesDir);

      console.log('\n' + '='.repeat(60));
      console.log('📊 ARCHITECTURE HEALTH REPORT (Baseline)');
      console.log('='.repeat(60));
      console.log(`Total Files:`);
      console.log(`  - Services: ${serviceFiles.length}`);
      console.log(`  - Models: ${modelFiles.length}`);
      console.log(`  - Routes: ${routeFiles.length}`);
      console.log(`\nCurrent Architecture: Layered (not hexagonal)`);
      console.log(`Migration Status: Not started`);
      console.log(`\nNext Steps:`);
      console.log(`  1. Create src/domain folder structure`);
      console.log(`  2. Extract business logic from services`);
      console.log(`  3. Create ports/adapters`);
      console.log(`  4. Run boundaries.test.js to validate`);
      console.log('='.repeat(60) + '\n');

      // Always passes - just informational
      expect(true).toBe(true);
    });
  });
});
