/**
 * ESLint Plugin: ODAVL Boundaries Enforcement
 * 
 * Enforces architectural boundaries between ODAVL products:
 * - Insight = Detection ONLY (no fixing, no website testing)
 * - Autopilot = Fixing ONLY (no detection, no website testing)
 * - Guardian = Website Testing ONLY (no code analysis, no fixing)
 * 
 * Usage in eslint.config.mjs:
 * ```javascript
 * import odavlBoundaries from 'eslint-plugin-odavl-boundaries';
 * 
 * export default [
 *   {
 *     plugins: { 'odavl-boundaries': odavlBoundaries },
 *     rules: {
 *       'odavl-boundaries/no-cross-product-imports': 'error'
 *     }
 *   }
 * ];
 * ```
 */

module.exports = {
  meta: {
    name: 'eslint-plugin-odavl-boundaries',
    version: '1.0.0',
  },
  rules: {
    'no-cross-product-imports': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce ODAVL product boundaries (no cross-product imports)',
          category: 'Architecture',
          recommended: true,
        },
        messages: {
          autopilotViolation: '❌ Autopilot VIOLATION: Cannot import "{{importPath}}" ({{reason}})',
          insightViolation: '❌ Insight VIOLATION: Cannot import "{{importPath}}" ({{reason}})',
          guardianViolation: '❌ Guardian VIOLATION: Cannot import "{{importPath}}" ({{reason}})',
        },
        schema: [],
      },
      create(context) {
        const filename = context.getFilename();
        
        // Detect which product this file belongs to
        const isAutopilot = filename.includes('odavl-studio/autopilot');
        const isInsight = filename.includes('odavl-studio/insight');
        const isGuardian = filename.includes('odavl-studio/guardian');
        
        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            
            // === AUTOPILOT BOUNDARIES ===
            if (isAutopilot) {
              // ❌ FORBIDDEN: Insight detectors
              if (importPath.includes('/detector/') || 
                  importPath.includes('insight-core/detector') ||
                  importPath.includes('insight/core/src/detector')) {
                context.report({
                  node,
                  messageId: 'autopilotViolation',
                  data: {
                    importPath,
                    reason: 'Autopilot = Fixing ONLY, detection is Insight\'s job'
                  }
                });
              }
              
              // ❌ FORBIDDEN: Guardian imports
              if (importPath.includes('guardian') && !importPath.includes('autopilot')) {
                context.report({
                  node,
                  messageId: 'autopilotViolation',
                  data: {
                    importPath,
                    reason: 'Autopilot cannot depend on Guardian (website testing)'
                  }
                });
              }
              
              // ❌ FORBIDDEN: AnalysisProtocol (detector execution)
              if (importPath.includes('AnalysisProtocol') || 
                  importPath.includes('@odavl/oplayer/protocols')) {
                context.report({
                  node,
                  messageId: 'autopilotViolation',
                  data: {
                    importPath,
                    reason: 'Autopilot must NOT run detectors (read Insight JSON instead)'
                  }
                });
              }
            }
            
            // === INSIGHT BOUNDARIES ===
            if (isInsight) {
              // ❌ FORBIDDEN: Fixer imports
              if (importPath.includes('/fixer/') || 
                  importPath.includes('AutoFixEngine') ||
                  importPath.includes('FixApplier')) {
                context.report({
                  node,
                  messageId: 'insightViolation',
                  data: {
                    importPath,
                    reason: 'Insight = Detection ONLY, fixing is Autopilot\'s job'
                  }
                });
              }
              
              // ❌ FORBIDDEN: Autopilot logic
              if (importPath.includes('autopilot') && 
                  !importPath.includes('canBeHandedToAutopilot')) {
                context.report({
                  node,
                  messageId: 'insightViolation',
                  data: {
                    importPath,
                    reason: 'Insight cannot depend on Autopilot (circular dependency)'
                  }
                });
              }
              
              // ❌ FORBIDDEN: Guardian imports
              if (importPath.includes('guardian') && !importPath.includes('insight')) {
                context.report({
                  node,
                  messageId: 'insightViolation',
                  data: {
                    importPath,
                    reason: 'Insight = Code analysis, Guardian = Website testing (separate concerns)'
                  }
                });
              }
            }
            
            // === GUARDIAN BOUNDARIES ===
            if (isGuardian) {
              // ❌ FORBIDDEN: Detector imports (code analysis)
              if (importPath.includes('/detector/') || 
                  importPath.includes('insight-core/detector') ||
                  importPath.includes('/inspectors/')) {
                context.report({
                  node,
                  messageId: 'guardianViolation',
                  data: {
                    importPath,
                    reason: 'Guardian = Website testing ONLY, code analysis is Insight\'s job'
                  }
                });
              }
              
              // ❌ FORBIDDEN: Fixer imports
              if (importPath.includes('/fixer/') || 
                  importPath.includes('AutoFixEngine') ||
                  importPath.includes('/fixers/')) {
                context.report({
                  node,
                  messageId: 'guardianViolation',
                  data: {
                    importPath,
                    reason: 'Guardian = Website testing ONLY, fixing is Autopilot\'s job'
                  }
                });
              }
              
              // ❌ FORBIDDEN: TypeScript Compiler API (code analysis)
              if (importPath === 'typescript' && !filename.includes('types.ts')) {
                context.report({
                  node,
                  messageId: 'guardianViolation',
                  data: {
                    importPath,
                    reason: 'Guardian = Website testing ONLY, use Lighthouse/axe-core instead'
                  }
                });
              }
            }
          }
        };
      }
    }
  }
};
