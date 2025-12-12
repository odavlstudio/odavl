/**
 * OMEGA-P5: File Intelligence Matrix
 * Maps file types to optimal detector/recipe/guardian strategies
 */
export interface FileIntelligenceProfile {
    typeId: string;
    dominantDetectors: string[];
    preferredRecipes: string[];
    guardianSensitivity: 'low' | 'medium' | 'high' | 'critical';
    brainWeightImpact: number;
}
export declare function buildFileIntelligenceMatrix(): FileIntelligenceProfile[];
export declare function getFileIntelligence(typeId: string): FileIntelligenceProfile | undefined;
