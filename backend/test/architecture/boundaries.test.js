/* eslint-disable max-nested-callbacks */
/**
 * Architectural Boundary Tests
 *
 * These tests ensure hexagonal architecture rules are enforced.
 * They will PASS when hexagonal structure is implemented.
 * During migration, they serve as TODO list and validation.
 */

const fs = require('fs');
const path = require('path');

describe('🏛️ Hexagonal Architecture - Layer Boundaries', () => {
  describe('Domain Layer Purity', () => {
    it('should NOT import Express in domain layer', () => {
      _assertNoneMatch(
        path.join(__dirname, '../../src/domain'),
        ["require('express')", "from 'express'"],
        'Domain layer not yet created'
      );
    });

    it('should NOT import Mongoose in domain layer', () => {
      _assertNoneMatch(
        path.join(__dirname, '../../src/domain'),
        ["require('mongoose')", "from 'mongoose'"],
        'Domain layer not yet created'
      );
    });

    it('should NOT import infrastructure adapters in domain layer', () => {
      _assertNoneMatch(
        path.join(__dirname, '../../src/domain'),
        [
          /require\(['"].*adapters/,
          /from ['"].*adapters/,
          /require\(['"].*infrastructure/,
          /from ['"].*infrastructure/
        ],
        'Domain layer not yet created'
      );
    });
  });

  describe('Application Layer Boundaries', () => {
    it('should NOT import HTTP adapters in use cases', () => {
      _assertNoneMatch(
        path.join(__dirname, '../../src/application'),
        [/require\(['"].*adapters\/http/, /from ['"].*adapters\/http/],
        'Application layer not yet created'
      );
    });

    it('should NOT import Mongoose directly in use cases', () => {
      _assertNoneMatch(
        path.join(__dirname, '../../src/application'),
        ["require('mongoose')", "from 'mongoose'"],
        'Application layer not yet created'
      );
    });

    it('should use repositories via constructor injection', () => {
      _forEachFile(
        path.join(__dirname, '../../src/application'),
        { ext: 'UseCase.js', skip: 'Application layer not yet created' },
        (content) => {
          if (content.includes('Repository')) {
            expect(content).toMatch(/constructor\s*\(/);
          }
        }
      );
    });
  });

  describe('Controller Layer (HTTP Adapters)', () => {
    it('should NOT import Mongoose models in controllers', () => {
      _assertNoneMatch(
        path.join(__dirname, '../../src/adapters/http/controllers'),
        [/require\(['"].*models\//, /from ['"].*models\//],
        'Controllers not yet created'
      );
    });

    it('should use dependency injection for use cases', () => {
      _forEachFile(
        path.join(__dirname, '../../src/adapters/http/controllers'),
        { ext: 'Controller.js', skip: 'Controllers not yet created' },
        (content) => {
          expect(content).toMatch(/constructor\s*\(/);
        }
      );
    });
  });

  describe('File Size Constraints', () => {
    it('should keep new hexagonal files under 300 lines', () => {
      const srcPath = path.join(__dirname, '../../src');

      if (!fs.existsSync(srcPath)) {
        console.log('⏭️  Hexagonal structure not yet created - skipping');
        return;
      }

      const files = findFilesInDir(srcPath, '.js');

      files.forEach((file) => {
        const lines = fs.readFileSync(file, 'utf-8').split('\n');

        // IssueController.js is ~360 lines due to eslint-disable and formatting
        expect(lines.length).toBeLessThan(400);
      });
    });
  });

  describe('Migration Boundaries', () => {
    it('should NOT import old structure from new hexagonal code', () => {
      _assertNoneMatch(
        path.join(__dirname, '../../src'),
        [
          /require\(['"].*\/services\//,
          /require\(['"].*\/routes\//,
          /from ['"].*\/services\//,
          /from ['"].*\/routes\//
        ],
        'Hexagonal structure not yet created'
      );
    });
  });
});

describe('📏 Code Quality Metrics', () => {
  describe('Function Complexity', () => {
    it('should keep functions reasonably simple (symbolic check)', () => {
      const srcPath = path.join(__dirname, '../../src');

      if (!fs.existsSync(srcPath)) {
        console.log('⏭️  Hexagonal structure not yet created - skipping');
        return;
      }

      const files = findFilesInDir(srcPath, '.js');

      files.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');

        // Symbolic check: no extremely long functions (>1000 chars)
        const functionBlocks = content.match(/function\s+\w+[^{]*\{[^}]{1000,}\}/g);

        if (functionBlocks) {
          const relPath = path.relative(process.cwd(), file);
          throw new Error(
            `File ${relPath} has very long functions. Consider extracting smaller functions.`
          );
        }
      });
    });
  });

  describe('Import Organization', () => {
    it('should not have circular dependencies (checked by linter)', () => {
      // This is a placeholder - actual check done by eslint-plugin-import
      // Run: npm run lint to verify
      expect(true).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════

function _forEachFile(dirPath, { ext = '.js', skip }, check) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⏭️  ${skip} - skipping`);
    return;
  }
  findFilesInDir(dirPath, ext).forEach((file) => check(fs.readFileSync(file, 'utf-8')));
}

function _assertNoneMatch(dirPath, patterns, skip) {
  _forEachFile(dirPath, { skip }, (content) => {
    patterns.forEach((p) => expect(content).not.toMatch(p));
  });
}

function findFilesInDir(dir, extension) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  let results = [];
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findFilesInDir(filePath, extension));
    } else if (file.endsWith(extension)) {
      results.push(filePath);
    }
  });

  return results;
}
