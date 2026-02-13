module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  
  extends: [
    'eslint:recommended'
  ],
  
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  
  plugins: ['import', 'boundaries'],
  
  settings: {
    'boundaries/elements': [
      {
        type: 'domain',
        pattern: 'src/domain/**/*',
        mode: 'full'
      },
      {
        type: 'application',
        pattern: 'src/application/**/*',
        mode: 'full'
      },
      {
        type: 'ports',
        pattern: 'src/ports/**/*',
        mode: 'full'
      },
      {
        type: 'adapters',
        pattern: 'src/adapters/**/*',
        mode: 'full'
      },
      {
        type: 'infrastructure',
        pattern: 'src/infrastructure/**/*',
        mode: 'full'
      },
      {
        type: 'legacy',
        pattern: '{services,routes,middleware,models}/**/*',
        mode: 'full'
      }
    ],
    'boundaries/ignore': [
      '**/*.test.js',
      '**/*.spec.js',
      '**/test/**/*',
      'index.js'
    ]
  },
  
  rules: {
    // ═══════════════════════════════════════════
    // IMPORT RULES
    // ═══════════════════════════════════════════
    
    // Enforce consistent import ordering
    'import/order': ['error', {
      'groups': [
        'builtin',   // Node.js built-in modules
        'external',  // npm packages
        'internal',  // Aliased imports
        'parent',    // ../
        'sibling',   // ./
        'index'      // ./index
      ],
      'newlines-between': 'always',
      'alphabetize': {
        'order': 'asc',
        'caseInsensitive': true
      }
    }],
    
    // Prevent circular dependencies
    'import/no-cycle': ['error', {
      maxDepth: Infinity,
      ignoreExternal: true
    }],
    
    // Ensure imports point to files that exist
    'import/no-unresolved': ['error', {
      commonjs: true,
      caseSensitive: true
    }],
    
    // ═══════════════════════════════════════════
    // ARCHITECTURAL BOUNDARY RULES
    // ═══════════════════════════════════════════
    
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        // Domain layer can ONLY import from domain
        {
          from: ['domain'],
          allow: ['domain']
        },
        
        // Application can import domain and ports
        {
          from: ['application'],
          allow: ['domain', 'ports', 'application']
        },
        
        // Ports can import domain
        {
          from: ['ports'],
          allow: ['domain', 'ports']
        },
        
        // Adapters can import everything except infrastructure
        {
          from: ['adapters'],
          allow: ['domain', 'application', 'ports', 'adapters']
        },
        
        // Infrastructure can import everything
        {
          from: ['infrastructure'],
          allow: ['domain', 'application', 'ports', 'adapters', 'infrastructure']
        },
        
        // Legacy code can import anything (during migration)
        {
          from: ['legacy'],
          allow: ['domain', 'application', 'ports', 'adapters', 'infrastructure', 'legacy']
        }
      ]
    }],
    
    // ═══════════════════════════════════════════
    // CODE QUALITY RULES
    // ═══════════════════════════════════════════
    
    // Complexity limits
    'complexity': ['error', { max: 9 }],
    'max-depth': ['error', { max: 3 }],
    'max-nested-callbacks': ['error', { max: 3 }],
    
    // Size limits
    'max-lines': ['error', {
      max: 300,
      skipBlankLines: true,
      skipComments: true
    }],
    'max-lines-per-function': ['error', {
      max: 50,
      skipBlankLines: true,
      skipComments: true
    }],
    'max-params': ['error', { max: 3 }],
    'max-statements': ['error', { max: 15 }, { ignoreTopLevelFunctions: false }],
    
    // Console usage
    'no-console': ['warn', {
      allow: ['error', 'warn', 'info']
    }],
    
    // Best practices
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'warn',
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    
    // Require proper error handling
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    
    // Naming conventions
    'camelcase': ['error', {
      properties: 'never',
      ignoreDestructuring: false
    }]
  },
  
  overrides: [
    // Relax rules for test files
    {
      files: ['**/*.test.js', '**/*.spec.js', '**/test/**/*'],
      rules: {
        'max-lines-per-function': 'off',
        'max-statements': 'off',
        'no-console': 'off'
      }
    },
    
    // Relax rules for legacy code (during migration)
    {
      files: ['index.js', 'services/**/*', 'routes/**/*'],
      rules: {
        'complexity': ['warn', { max: 15 }],
        'max-lines': ['warn', { max: 500 }],
        'max-lines-per-function': ['warn', { max: 100 }],
        'max-params': ['warn', { max: 5 }]
      }
    }
  ]
};
