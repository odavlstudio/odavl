"use strict";
/**
 * OMEGA-P5: File Intelligence Matrix
 * Maps file types to optimal detector/recipe/guardian strategies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFileIntelligenceMatrix = buildFileIntelligenceMatrix;
exports.getFileIntelligence = getFileIntelligence;
function buildFileIntelligenceMatrix() {
    return [
        // Code files
        { typeId: 'typescript', dominantDetectors: ['typescript', 'eslint', 'circular', 'complexity'], preferredRecipes: ['fix-typescript-errors', 'organize-imports', 'fix-unused-imports'], guardianSensitivity: 'high', brainWeightImpact: 0.9 },
        { typeId: 'javascript', dominantDetectors: ['eslint', 'complexity', 'runtime'], preferredRecipes: ['fix-eslint-errors', 'modernize-syntax'], guardianSensitivity: 'medium', brainWeightImpact: 0.7 },
        { typeId: 'tsx', dominantDetectors: ['typescript', 'eslint', 'complexity'], preferredRecipes: ['fix-typescript-errors', 'optimize-react'], guardianSensitivity: 'high', brainWeightImpact: 0.95 },
        { typeId: 'jsx', dominantDetectors: ['eslint', 'complexity'], preferredRecipes: ['fix-eslint-errors', 'optimize-react'], guardianSensitivity: 'medium', brainWeightImpact: 0.8 },
        { typeId: 'prisma', dominantDetectors: ['runtime', 'build'], preferredRecipes: ['validate-schema', 'optimize-queries'], guardianSensitivity: 'critical', brainWeightImpact: 1.0 },
        { typeId: 'sql', dominantDetectors: ['security', 'runtime'], preferredRecipes: ['sql-injection-scan', 'optimize-queries'], guardianSensitivity: 'critical', brainWeightImpact: 1.0 },
        // Config files
        { typeId: 'json', dominantDetectors: ['build', 'package'], preferredRecipes: ['validate-json', 'format-json'], guardianSensitivity: 'medium', brainWeightImpact: 0.6 },
        { typeId: 'yaml', dominantDetectors: ['build', 'network'], preferredRecipes: ['validate-yaml', 'format-yaml'], guardianSensitivity: 'medium', brainWeightImpact: 0.6 },
        { typeId: 'package-json', dominantDetectors: ['package', 'security'], preferredRecipes: ['update-deps', 'audit-deps'], guardianSensitivity: 'critical', brainWeightImpact: 1.0 },
        { typeId: 'tsconfig', dominantDetectors: ['typescript', 'build'], preferredRecipes: ['strict-mode', 'update-target'], guardianSensitivity: 'high', brainWeightImpact: 0.8 },
        { typeId: 'eslint-config', dominantDetectors: ['eslint'], preferredRecipes: ['update-rules', 'add-plugins'], guardianSensitivity: 'low', brainWeightImpact: 0.4 },
        { typeId: 'next-config', dominantDetectors: ['build', 'network'], preferredRecipes: ['optimize-build', 'add-headers'], guardianSensitivity: 'high', brainWeightImpact: 0.9 },
        { typeId: 'config-ts', dominantDetectors: ['typescript', 'build'], preferredRecipes: ['fix-config', 'update-framework'], guardianSensitivity: 'medium', brainWeightImpact: 0.6 },
        { typeId: 'config-js', dominantDetectors: ['eslint', 'build'], preferredRecipes: ['fix-config', 'modernize'], guardianSensitivity: 'medium', brainWeightImpact: 0.6 },
        { typeId: 'pnpm-lock', dominantDetectors: ['package'], preferredRecipes: [], guardianSensitivity: 'low', brainWeightImpact: 0.3 },
        // Infra files
        { typeId: 'env', dominantDetectors: ['security'], preferredRecipes: ['scan-secrets', 'validate-vars'], guardianSensitivity: 'critical', brainWeightImpact: 1.0 },
        { typeId: 'dockerfile', dominantDetectors: ['security', 'runtime', 'network'], preferredRecipes: ['optimize-layers', 'security-scan'], guardianSensitivity: 'critical', brainWeightImpact: 1.0 },
        { typeId: 'docker-compose', dominantDetectors: ['network', 'runtime'], preferredRecipes: ['optimize-services', 'add-health-checks'], guardianSensitivity: 'high', brainWeightImpact: 0.9 },
        { typeId: 'workflows', dominantDetectors: ['build', 'security'], preferredRecipes: ['optimize-ci', 'add-caching'], guardianSensitivity: 'high', brainWeightImpact: 0.8 },
        // Docs
        { typeId: 'md', dominantDetectors: [], preferredRecipes: ['fix-links', 'format-markdown'], guardianSensitivity: 'low', brainWeightImpact: 0.2 },
    ];
}
function getFileIntelligence(typeId) {
    var matrix = buildFileIntelligenceMatrix();
    return matrix.find(function (profile) { return profile.typeId === typeId; });
}
