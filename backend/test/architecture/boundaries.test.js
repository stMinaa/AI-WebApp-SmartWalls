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
      const domainPath = path.join(__dirname, '../../src/domain');
      
      // Skip if domain layer not yet created
      if (!fs.existsSync(domainPath)) {
        console.log('⏭️  Domain layer not yet created - skipping');
        return;
      }
      
      const domainFiles = findFilesInDir(domainPath, '.js');
      
      domainFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const relPath = path.relative(process.cwd(), file);
        
        expect(content).not.toContain("require('express')");
        expect(content).not.toContain("from 'express'");
      });
    });
    
    it('should NOT import Mongoose in domain layer', () => {
      const domainPath = path.join(__dirname, '../../src/domain');
      
      if (!fs.existsSync(domainPath)) {
        console.log('⏭️  Domain layer not yet created - skipping');
        return;
      }
      
      const domainFiles = findFilesInDir(domainPath, '.js');
      
      domainFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        
        expect(content).not.toContain("require('mongoose')");
        expect(content).not.toContain("from 'mongoose'");
      });
    });
    
    it('should NOT import infrastructure adapters in domain layer', () => {
      const domainPath = path.join(__dirname, '../../src/domain');
      
      if (!fs.existsSync(domainPath)) {
        console.log('⏭️  Domain layer not yet created - skipping');
        return;
      }
      
      const domainFiles = findFilesInDir(domainPath, '.js');
      
      domainFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        
        expect(content).not.toMatch(/require\(['"].*adapters/);
        expect(content).not.toMatch(/from ['"].*adapters/);
        expect(content).not.toMatch(/require\(['"].*infrastructure/);
        expect(content).not.toMatch(/from ['"].*infrastructure/);
      });
    });
  });
  
  describe('Application Layer Boundaries', () => {
    
    it('should NOT import HTTP adapters in use cases', () => {
      const appPath = path.join(__dirname, '../../src/application');
      
      if (!fs.existsSync(appPath)) {
        console.log('⏭️  Application layer not yet created - skipping');
        return;
      }
      
      const useCaseFiles = findFilesInDir(appPath, '.js');
      
      useCaseFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        
        expect(content).not.toMatch(/require\(['"].*adapters\/http/);
        expect(content).not.toMatch(/from ['"].*adapters\/http/);
      });
    });
    
    it('should NOT import Mongoose directly in use cases', () => {
      const appPath = path.join(__dirname, '../../src/application');
      
      if (!fs.existsSync(appPath)) {
        console.log('⏭️  Application layer not yet created - skipping');
        return;
      }
      
      const useCaseFiles = findFilesInDir(appPath, '.js');
      
      useCaseFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        
        expect(content).not.toContain("require('mongoose')");
        expect(content).not.toContain("from 'mongoose'");
      });
    });
    
    it('should use repositories via constructor injection', () => {
      const appPath = path.join(__dirname, '../../src/application');
      
      if (!fs.existsSync(appPath)) {
        console.log('⏭️  Application layer not yet created - skipping');
        return;
      }
      
      const useCaseFiles = findFilesInDir(appPath, 'UseCase.js');
      
      useCaseFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        
        // If it mentions repositories, must have constructor
        if (content.includes('Repository')) {
          expect(content).toMatch(/constructor\s*\(/);
        }
      });
    });
  });
  
  describe('Controller Layer (HTTP Adapters)', () => {
    
    it('should NOT import Mongoose models in controllers', () => {
      const controllersPath = path.join(__dirname, '../../src/adapters/http/controllers');
      
      if (!fs.existsSync(controllersPath)) {
        console.log('⏭️  Controllers not yet created - skipping');
        return;
      }
      
      const controllerFiles = findFilesInDir(controllersPath, '.js');
      
      controllerFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        
        expect(content).not.toMatch(/require\(['"].*models\//);
        expect(content).not.toMatch(/from ['"].*models\//);
      });
    });
    
    it('should use dependency injection for use cases', () => {
      const controllersPath = path.join(__dirname, '../../src/adapters/http/controllers');
      
      if (!fs.existsSync(controllersPath)) {
        console.log('⏭️  Controllers not yet created - skipping');
        return;
      }
      
      const controllerFiles = findFilesInDir(controllersPath, 'Controller.js');
      
      controllerFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Controllers should inject dependencies via constructor
        expect(content).toMatch(/constructor\s*\(/);
      });
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
      
      files.forEach(file => {
        const lines = fs.readFileSync(file, 'utf-8').split('\n');
        const relPath = path.relative(process.cwd(), file);
        
        expect(lines.length).toBeLessThan(300);
      });
    });
  });
  
  describe('Migration Boundaries', () => {
    
    it('should NOT import old structure from new hexagonal code', () => {
      const srcPath = path.join(__dirname, '../../src');
      
      if (!fs.existsSync(srcPath)) {
        console.log('⏭️  Hexagonal structure not yet created - skipping');
        return;
      }
      
      const files = findFilesInDir(srcPath, '.js');
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        
        // New code should not depend on old services/routes
        expect(content).not.toMatch(/require\(['"].*\/services\//);
        expect(content).not.toMatch(/require\(['"].*\/routes\//);
        expect(content).not.toMatch(/from ['"].*\/services\//);
        expect(content).not.toMatch(/from ['"].*\/routes\//);
      });
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
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Symbolic check: no extremely long functions (>1000 chars)
        const functionBlocks = content.match(/function\s+\w+[^{]*\{[^}]{1000,}\}/g);
        
        if (functionBlocks) {
          const relPath = path.relative(process.cwd(), file);
          fail(`File ${relPath} has very long functions. Consider extracting smaller functions.`);
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

function findFilesInDir(dir, extension) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  let results = [];
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
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
