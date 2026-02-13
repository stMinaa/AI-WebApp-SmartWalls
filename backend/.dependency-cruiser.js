/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ═══════════════════════════════════════════
    // HEXAGONAL ARCHITECTURE RULES
    // ═══════════════════════════════════════════
    
    // Domain layer must NOT depend on infrastructure or adapters
    {
      name: 'domain-no-infrastructure',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { 
        path: '^src/(adapters|infrastructure)',
        pathNot: '^src/domain'
      },
      comment: '❌ Domain layer must be pure - no infrastructure or adapter dependencies'
    },
    
    // Domain must be framework-agnostic (no Express, Mongoose, etc.)
    {
      name: 'domain-no-external-deps',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { 
        dependencyTypes: ['npm'],
        pathNot: '^src/domain'
      },
      comment: '❌ Domain must be framework-agnostic - only pure JavaScript allowed'
    },
    
    // Application layer must NOT depend on adapters (only ports)
    {
      name: 'application-no-adapters',
      severity: 'error',
      from: { path: '^src/application' },
      to: { path: '^src/adapters' },
      comment: '❌ Application layer must depend on ports (interfaces), not adapters (implementations)'
    },
    
    // Application must NOT import Express
    {
      name: 'application-no-express',
      severity: 'error',
      from: { path: '^src/application' },
      to: { path: 'node_modules/express' },
      comment: '❌ Use cases must not know about HTTP framework'
    },
    
    // Application must NOT import Mongoose
    {
      name: 'application-no-mongoose',
      severity: 'error',
      from: { path: '^src/application' },
      to: { path: 'node_modules/mongoose' },
      comment: '❌ Use cases must depend on repository interfaces, not Mongoose directly'
    },
    
    // Controllers must NOT access Mongoose models directly
    {
      name: 'controllers-no-models',
      severity: 'error',
      from: { path: '^src/adapters/http/controllers' },
      to: { path: '^models' },
      comment: '❌ Controllers must call use cases, not access database directly'
    },
    
    // Routes should use controllers, not use cases directly
    {
      name: 'routes-via-controllers',
      severity: 'warn',
      from: { path: '^src/adapters/http/routes' },
      to: { path: '^src/application' },
      comment: '⚠️ Routes should use controllers as intermediary (not strict error during migration)'
    },
    
    // ═══════════════════════════════════════════
    // MIGRATION RULES (old → new structure)
    // ═══════════════════════════════════════════
    
    // New hexagonal structure must NOT depend on old code
    {
      name: 'no-old-structure-deps',
      severity: 'error',
      from: { path: '^src/' },
      to: { 
        path: '^(services|routes)/', 
        pathNot: '^src/'
      },
      comment: '❌ New hexagonal structure must not depend on old monolithic code'
    },
    
    // ═══════════════════════════════════════════
    // GENERAL CODE QUALITY RULES
    // ═══════════════════════════════════════════
    
    // No circular dependencies
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
      comment: '❌ Circular dependencies create tight coupling and maintenance issues'
    },
    
    // No orphan modules (unreachable code)
    {
      name: 'no-orphans',
      severity: 'warn',
      from: { orphan: true },
      to: {},
      comment: '⚠️ Orphan modules are unreachable and should be removed'
    },
    
    // Warn about deprecated dependencies
    {
      name: 'no-deprecated-core',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: [
          '^(punycode|domain|constants|sys|_linklist|_stream_wrap)$'
        ]
      },
      comment: '⚠️ Deprecated Node.js core modules should be replaced'
    }
  ],
  
  options: {
    doNotFollow: {
      path: 'node_modules',
      dependencyTypes: [
        'npm-dev',
        'npm-optional',
        'npm-peer',
        'npm-bundled'
      ]
    },
    
    includeOnly: [
      '^src',
      '^backend'
    ],
    
    tsPreCompilationDeps: false,
    
    tsConfig: {
      fileName: null
    },
    
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    },
    
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
        theme: {
          graph: {
            splines: 'ortho',
            rankdir: 'TB'
          }
        }
      },
      
      archi: {
        collapsePattern: '^(node_modules|packages|src/[^/]+)/',
        theme: {
          graph: {
            splines: 'ortho',
            rankdir: 'TB',
            ranksep: '1',
            nodesep: '1'
          },
          modules: [
            {
              criteria: { matchesFocus: true },
              attributes: { fillcolor: '#ccffcc', penwidth: 2 }
            },
            {
              criteria: { source: '^src/domain' },
              attributes: { 
                fillcolor: '#77aaff',
                fontcolor: 'white',
                label: 'Domain\n(Pure Business Logic)'
              }
            },
            {
              criteria: { source: '^src/application' },
              attributes: { 
                fillcolor: '#ffaa77',
                label: 'Application\n(Use Cases)'
              }
            },
            {
              criteria: { source: '^src/ports' },
              attributes: { 
                fillcolor: '#ffff77',
                label: 'Ports\n(Interfaces)'
              }
            },
            {
              criteria: { source: '^src/adapters' },
              attributes: { 
                fillcolor: '#ff99ff',
                label: 'Adapters\n(Implementations)'
              }
            },
            {
              criteria: { source: '^src/infrastructure' },
              attributes: { 
                fillcolor: '#aaaaaa',
                fontcolor: 'white',
                label: 'Infrastructure\n(Config & DI)'
              }
            }
          ],
          dependencies: [
            {
              criteria: { resolved: '^src/domain' },
              attributes: { color: '#0000ff', penwidth: 2 }
            },
            {
              criteria: { resolved: '^src/application' },
              attributes: { color: '#ff6600' }
            },
            {
              criteria: { resolved: '^src/adapters' },
              attributes: { color: '#cc00cc' }
            }
          ]
        }
      },
      
      err: {
        collapsePattern: 'node_modules/[^/]+'
      },
      
      'err-long': {
        collapsePattern: 'node_modules/[^/]+'
      }
    }
  }
};
