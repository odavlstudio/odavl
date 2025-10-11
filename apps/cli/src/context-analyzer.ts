// ODAVL Wave 9: Context Analysis Engine
// Intelligent code context analysis for project patterns, team preferences, and quality trends

import type { 
  CodeContextAnalysis,
  ProjectType,
  QualityLevel,
  PackageManager,
  IndentationType,
  ImportStyle,
  RiskTolerance
} from './ml-engine.types.js';

import type {
  TrainingDataPoint,
  QualityMetrics
} from './training-data.types.js';

import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { glob } from 'glob';

// Context analysis configuration
export interface ContextAnalysisConfig {
  // Analysis scope
  maxFilesToAnalyze: number;
  excludePatterns: string[];
  includePatterns: string[];
  
  // Analysis depth
  analyzeGitHistory: boolean;
  analyzeDependencies: boolean;
  analyzeCodeStyle: boolean;
  analyzeArchitecture: boolean;
  
  // Caching
  enableCaching: boolean;
  cacheExpiryHours: number;
  
  // Team learning
  enableTeamLearning: boolean;
  minDataPointsForLearning: number;
}

// Project structure analysis results
export interface ProjectStructureAnalysis {
  projectType: ProjectType;
  primaryLanguages: { language: string; percentage: number }[];
  frameworks: { name: string; confidence: number }[];
  packageManager: PackageManager;
  
  // File statistics
  fileStats: {
    totalFiles: number;
    codeFiles: number;
    testFiles: number;
    configFiles: number;
    documentationFiles: number;
  };
  
  // Directory structure
  directoryStructure: {
    hasSourceDir: boolean;
    hasTestDir: boolean;
    hasDocsDir: boolean;
    hasConfigDir: boolean;
    organizationPattern: 'flat' | 'feature-based' | 'layer-based' | 'mixed';
  };
  
  // Technology stack
  technologyStack: {
    runtime: string[];
    buildTools: string[];
    testingFrameworks: string[];
    linting: string[];
    formatting: string[];
  };
}

// Code style analysis results
export interface CodeStyleAnalysis {
  indentation: {
    type: IndentationType;
    size: number;
    consistency: number; // 0-1
  };
  
  lineLength: {
    average: number;
    max: number;
    recommended: number;
  };
  
  importStyle: {
    preferred: ImportStyle;
    namedImportUsage: number; // percentage
    defaultImportUsage: number;
    namespaceImportUsage: number;
  };
  
  namingConventions: {
    variables: 'camelCase' | 'snake_case' | 'mixed';
    functions: 'camelCase' | 'snake_case' | 'mixed';
    classes: 'PascalCase' | 'camelCase' | 'mixed';
    constants: 'UPPER_CASE' | 'camelCase' | 'mixed';
    files: 'kebab-case' | 'camelCase' | 'PascalCase' | 'mixed';
  };
  
  codeComplexity: {
    averageFunctionLength: number;
    averageCyclomaticComplexity: number;
    nestingDepth: { average: number; max: number };
  };
  
  consistency: {
    overall: number; // 0-1
    indentationConsistency: number;
    namingConsistency: number;
    structureConsistency: number;
  };
}

// Architecture pattern analysis
export interface ArchitectureAnalysis {
  patterns: {
    name: string;
    confidence: number;
    evidence: string[];
  }[];
  
  layerArchitecture: {
    hasLayers: boolean;
    layers: { name: string; files: number }[];
    separation: number; // 0-1, how well layers are separated
  };
  
  designPatterns: {
    singleton: number;
    factory: number;
    observer: number;
    strategy: number;
    decorator: number;
    adapter: number;
  };
  
  dependencyManagement: {
    coupling: QualityLevel;
    cohesion: QualityLevel;
    circularDependencies: number;
    dependencyInversion: number; // 0-1
  };
  
  testArchitecture: {
    testCoverage: number;
    testTypes: { unit: number; integration: number; e2e: number };
    testStructure: 'colocated' | 'separate' | 'mixed';
    mockingStrategy: 'minimal' | 'moderate' | 'extensive';
  };
}

// Team behavior and preference analysis
export interface TeamBehaviorAnalysis {
  codeQualityPreferences: {
    eslintStrictness: QualityLevel;
    typeScriptStrictness: QualityLevel;
    testCoverageExpectation: number;
    documentationLevel: QualityLevel;
  };
  
  workflowPatterns: {
    commitFrequency: 'frequent' | 'moderate' | 'batched';
    branchingStrategy: 'gitflow' | 'github-flow' | 'feature-branch' | 'trunk';
    reviewThoroughness: QualityLevel;
    automationPreference: QualityLevel;
  };
  
  riskTolerance: RiskTolerance;
  
  experienceLevel: {
    overall: QualityLevel;
    withCurrentTech: QualityLevel;
    withTesting: QualityLevel;
    withRefactoring: QualityLevel;
  };
  
  learningHistory: {
    acceptedSuggestions: number;
    rejectedSuggestions: number;
    modifiedSuggestions: number;
    preferredActionTypes: string[];
  };
}

// Quality trend analysis
export interface QualityTrendAnalysis {
  overallTrend: {
    direction: 'improving' | 'stable' | 'degrading';
    rate: number; // change per week
    confidence: number; // 0-1
  };
  
  metricTrends: {
    eslintWarnings: { trend: number; volatility: number };
    typeErrors: { trend: number; volatility: number };
    codeComplexity: { trend: number; volatility: number };
    testCoverage: { trend: number; volatility: number };
  };
  
  periodicPatterns: {
    dayOfWeek: Record<string, number>;
    timeOfDay: Record<string, number>;
    seasonal: Record<string, number>;
  };
  
  predictiveInsights: {
    nextWeekForecast: QualityMetrics;
    riskFactors: { factor: string; impact: number }[];
    recommendations: { action: string; priority: number }[];
  };
}

// Main context analyzer interface
export interface ContextAnalyzer {
  /**
   * Performs comprehensive project analysis
   */
  analyzeProject(rootPath: string): Promise<ProjectStructureAnalysis>;
  
  /**
   * Analyzes code style patterns and consistency
   */
  analyzeCodeStyle(rootPath: string): Promise<CodeStyleAnalysis>;
  
  /**
   * Identifies architectural patterns and design decisions
   */
  analyzeArchitecture(rootPath: string): Promise<ArchitectureAnalysis>;
  
  /**
   * Learns team behavior from historical data
   */
  analyzeTeamBehavior(trainingData: TrainingDataPoint[]): Promise<TeamBehaviorAnalysis>;
  
  /**
   * Analyzes quality trends and patterns
   */
  analyzeQualityTrends(
    historicalMetrics: QualityMetrics[],
    timeWindow: string
  ): Promise<QualityTrendAnalysis>;
  
  /**
   * Generates comprehensive context analysis
   */
  generateContextAnalysis(rootPath: string): Promise<CodeContextAnalysis>;
  
  /**
   * Updates context based on new data
   */
  updateContext(
    existingContext: CodeContextAnalysis,
    newData: TrainingDataPoint[]
  ): Promise<CodeContextAnalysis>;
}

// Implementation of the context analyzer
export class ODAvlContextAnalyzer implements ContextAnalyzer {
  private config: ContextAnalysisConfig;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  
  constructor(config: ContextAnalysisConfig) {
    this.config = config;
  }
  
  async analyzeProject(rootPath: string): Promise<ProjectStructureAnalysis> {
    const cacheKey = `project-${rootPath}`;
    if (this.config.enableCaching) {
      const cached = this.getCachedResult<ProjectStructureAnalysis>(cacheKey);
      if (cached) return cached;
    }
    
    // Analyze package.json for project type and dependencies
    const packageJsonPath = join(rootPath, 'package.json');
    let packageJson: Record<string, unknown> = {};
    if (existsSync(packageJsonPath)) {
      packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    }
    
    // Determine project type from dependencies and structure
    const projectType = await this.detectProjectType(rootPath, packageJson);
    
    // Analyze file structure
    const fileStats = await this.analyzeFileStructure(rootPath);
    
    // Detect package manager
    const packageManager = this.detectPackageManager(rootPath);
    
    // Analyze primary languages
    const primaryLanguages = await this.analyzePrimaryLanguages(rootPath);
    
    // Detect frameworks
    const frameworks = await this.detectFrameworks(packageJson, rootPath);
    
    // Analyze directory structure
    const directoryStructure = await this.analyzeDirectoryStructure(rootPath);
    
    // Analyze technology stack
    const technologyStack = await this.analyzeTechnologyStack(packageJson, rootPath);
    
    const result: ProjectStructureAnalysis = {
      projectType,
      primaryLanguages,
      frameworks,
      packageManager,
      fileStats,
      directoryStructure,
      technologyStack
    };
    
    if (this.config.enableCaching) {
      this.setCacheResult(cacheKey, result);
    }
    
    return result;
  }
  
  async analyzeCodeStyle(rootPath: string): Promise<CodeStyleAnalysis> {
    const cacheKey = `codestyle-${rootPath}`;
    if (this.config.enableCaching) {
      const cached = this.getCachedResult<CodeStyleAnalysis>(cacheKey);
      if (cached) return cached;
    }
    
    // Find source files to analyze
    const sourceFiles = await this.findSourceFiles(rootPath);
    const sampleFiles = sourceFiles.slice(0, Math.min(50, sourceFiles.length));
    
    // Analyze indentation patterns
    const indentation = await this.analyzeIndentation(sampleFiles);
    
    // Analyze line length patterns
    const lineLength = await this.analyzeLineLength(sampleFiles);
    
    // Analyze import styles
    const importStyle = await this.analyzeImportStyle(sampleFiles);
    
    // Analyze naming conventions
    const namingConventions = await this.analyzeNamingConventions(sampleFiles);
    
    // Analyze code complexity
    const codeComplexity = await this.analyzeCodeComplexity(sampleFiles);
    
    // Calculate consistency scores
    const consistency = await this.calculateStyleConsistency(sampleFiles);
    
    const result: CodeStyleAnalysis = {
      indentation,
      lineLength,
      importStyle,
      namingConventions,
      codeComplexity,
      consistency
    };
    
    if (this.config.enableCaching) {
      this.setCacheResult(cacheKey, result);
    }
    
    return result;
  }
  
  async analyzeArchitecture(rootPath: string): Promise<ArchitectureAnalysis> {
    const cacheKey = `architecture-${rootPath}`;
    if (this.config.enableCaching) {
      const cached = this.getCachedResult<ArchitectureAnalysis>(cacheKey);
      if (cached) return cached;
    }
    
    // Identify architectural patterns
    const patterns = await this.identifyArchitecturalPatterns(rootPath);
    
    // Analyze layer architecture
    const layerArchitecture = await this.analyzeLayerArchitecture(rootPath);
    
    // Detect design patterns
    const designPatterns = await this.detectDesignPatterns(rootPath);
    
    // Analyze dependency management
    const dependencyManagement = await this.analyzeDependencyManagement(rootPath);
    
    // Analyze test architecture
    const testArchitecture = await this.analyzeTestArchitecture(rootPath);
    
    const result: ArchitectureAnalysis = {
      patterns,
      layerArchitecture,
      designPatterns,
      dependencyManagement,
      testArchitecture
    };
    
    if (this.config.enableCaching) {
      this.setCacheResult(cacheKey, result);
    }
    
    return result;
  }
  
  async analyzeTeamBehavior(trainingData: TrainingDataPoint[]): Promise<TeamBehaviorAnalysis> {
    if (trainingData.length < this.config.minDataPointsForLearning) {
      return this.getDefaultTeamBehavior();
    }
    
    // Analyze code quality preferences from training data
    const codeQualityPreferences = this.analyzeQualityPreferences(trainingData);
    
    // Analyze workflow patterns
    const workflowPatterns = this.analyzeWorkflowPatterns(trainingData);
    
    // Determine risk tolerance
    const riskTolerance = this.determineRiskTolerance(trainingData);
    
    // Assess experience level
    const experienceLevel = this.assessExperienceLevel(trainingData);
    
    // Extract learning history
    const learningHistory = this.extractLearningHistory(trainingData);
    
    return {
      codeQualityPreferences,
      workflowPatterns,
      riskTolerance,
      experienceLevel,
      learningHistory
    };
  }
  
  async analyzeQualityTrends(
    historicalMetrics: QualityMetrics[],
    _timeWindow: string
  ): Promise<QualityTrendAnalysis> {
    
    if (historicalMetrics.length < 2) {
      return this.getDefaultTrendAnalysis();
    }
    
    // Sort metrics by timestamp
    const sortedMetrics = historicalMetrics.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Calculate overall trend
    const overallTrend = this.calculateOverallTrend(sortedMetrics);
    
    // Calculate metric-specific trends
    const metricTrends = this.calculateMetricTrends(sortedMetrics);
    
    // Identify periodic patterns
    const periodicPatterns = this.identifyPeriodicPatterns(sortedMetrics);
    
    // Generate predictive insights
    const predictiveInsights = this.generatePredictiveInsights(sortedMetrics);
    
    return {
      overallTrend,
      metricTrends,
      periodicPatterns,
      predictiveInsights
    };
  }
  
  async generateContextAnalysis(rootPath: string): Promise<CodeContextAnalysis> {
    // Perform all analyses in parallel
    const [projectAnalysis, codeStyleAnalysis, architectureAnalysis] = await Promise.all([
      this.analyzeProject(rootPath),
      this.analyzeCodeStyle(rootPath),
      this.analyzeArchitecture(rootPath)
    ]);
    
    // Combine results into comprehensive context
    const context: CodeContextAnalysis = {
      projectType: projectAnalysis.projectType,
      primaryLanguages: projectAnalysis.primaryLanguages.map(l => l.language),
      frameworks: projectAnalysis.frameworks.map(f => f.name),
      packageManager: projectAnalysis.packageManager,
      
      architecturalPatterns: architectureAnalysis.patterns.map(p => p.name),
      codingStyle: {
        indentation: codeStyleAnalysis.indentation.type,
        lineLength: codeStyleAnalysis.lineLength.recommended,
        importStyle: codeStyleAnalysis.importStyle.preferred
      },
      
      // Default values - would be populated from training data in real implementation
      preferredRecipes: [],
      riskTolerance: 'moderate',
      qualityThresholds: {
        eslintWarningTolerance: 5,
        typeErrorTolerance: 0
      },
      
      recentChanges: {
        filesModified: 0,
        linesChanged: 0,
        commitsInLastWeek: 1
      },
      
      qualityTrajectory: 'stable',
      technicalDebtLevel: 'medium'
    };
    
    return context;
  }
  
  async updateContext(
    existingContext: CodeContextAnalysis,
    newData: TrainingDataPoint[]
  ): Promise<CodeContextAnalysis> {
    
    if (newData.length === 0) {
      return existingContext;
    }
    
    // Analyze team behavior from new data
    const teamBehavior = await this.analyzeTeamBehavior(newData);
    
    // Update preferred recipes based on successful outcomes
    const successfulRecipes = newData
      .filter(d => d.outcome.success && d.outcome.qualityImprovement > 0)
      .map(d => d.action.type);
    
    const recipeFrequency = successfulRecipes.reduce((acc, recipe) => {
      acc[recipe] = (acc[recipe] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const preferredRecipes = Object.entries(recipeFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([recipe]) => recipe);
    
    // Update quality thresholds based on team tolerance
    const qualityThresholds = {
      eslintWarningTolerance: this.calculateWarningTolerance(newData),
      typeErrorTolerance: teamBehavior.codeQualityPreferences.typeScriptStrictness === 'high' ? 0 : 1
    };
    
    // Update recent changes statistics
    const recentChanges = {
      filesModified: Math.round(newData.reduce((sum, d) => sum + d.action.filesModified.length, 0) / newData.length),
      linesChanged: Math.round(newData.reduce((sum, d) => sum + d.action.linesChanged, 0) / newData.length),
      commitsInLastWeek: newData.length // assuming data spans a week
    };
    
    // Update quality trajectory and technical debt
    const avgQualityImprovement = newData.reduce((sum, d) => sum + d.outcome.qualityImprovement, 0) / newData.length;
    const qualityTrajectory = avgQualityImprovement > 5 ? 'improving' : avgQualityImprovement < -5 ? 'degrading' : 'stable';
    
    const avgComplexity = newData.reduce((sum, d) => {
      const score = d.projectContext.complexity === 'high' ? 3 : d.projectContext.complexity === 'medium' ? 2 : 1;
      return sum + score;
    }, 0) / newData.length;
    const technicalDebtLevel = avgComplexity > 2.5 ? 'high' : avgComplexity > 1.5 ? 'medium' : 'low';
    
    return {
      ...existingContext,
      preferredRecipes,
      riskTolerance: teamBehavior.riskTolerance,
      qualityThresholds,
      recentChanges,
      qualityTrajectory,
      technicalDebtLevel
    };
  }
  
  // Private helper methods
  
  private getCachedResult<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const ageHours = (Date.now() - cached.timestamp) / (1000 * 60 * 60);
    if (ageHours > this.config.cacheExpiryHours) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }
  
  private setCacheResult(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  
  private async detectProjectType(rootPath: string, packageJson: Record<string, unknown>): Promise<ProjectType> {
    // Check for common framework dependencies
    const deps = { 
      ...(packageJson.dependencies as Record<string, string> || {}), 
      ...(packageJson.devDependencies as Record<string, string> || {}) 
    };
    
    if (deps.react || deps['@types/react']) return 'frontend';
    if (deps.express || deps.fastify || deps.koa) return 'backend';
    if (deps['next'] || deps['nuxt']) return 'fullstack';
    if (packageJson.main && !deps.react && !deps.express) return 'library';
    if (existsSync(join(rootPath, 'packages')) || existsSync(join(rootPath, 'apps'))) return 'monorepo';
    
    return 'frontend'; // default
  }
  
  private detectPackageManager(rootPath: string): PackageManager {
    if (existsSync(join(rootPath, 'pnpm-lock.yaml'))) return 'pnpm';
    if (existsSync(join(rootPath, 'yarn.lock'))) return 'yarn';
    return 'npm';
  }
  
  private async analyzeFileStructure(rootPath: string) {
    const allFiles = await glob('**/*', { 
      cwd: rootPath, 
      nodir: true,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
    });
    
    const codeExtensions = ['.js', '.ts', '.tsx', '.jsx', '.vue', '.svelte'];
    const testExtensions = ['.test.', '.spec.', '__tests__'];
    const configExtensions = ['.config.', '.rc', 'file'];
    const docExtensions = ['.md', '.txt', '.rst'];
    
    const codeFiles = allFiles.filter(f => codeExtensions.some(ext => f.includes(ext))).length;
    const testFiles = allFiles.filter(f => testExtensions.some(ext => f.includes(ext))).length;
    const configFiles = allFiles.filter(f => configExtensions.some(ext => f.includes(ext))).length;
    const documentationFiles = allFiles.filter(f => docExtensions.some(ext => f.includes(ext))).length;
    
    return {
      totalFiles: allFiles.length,
      codeFiles,
      testFiles,
      configFiles,
      documentationFiles
    };
  }
  
  private async analyzePrimaryLanguages(rootPath: string) {
    const files = await glob('**/*.{js,ts,tsx,jsx}', { 
      cwd: rootPath,
      ignore: ['node_modules/**', '.git/**', 'dist/**']
    });
    
    const languageCounts = files.reduce((acc, file) => {
      const ext = extname(file);
      const lang = ext === '.ts' || ext === '.tsx' ? 'TypeScript' : 'JavaScript';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const total = Object.values(languageCounts).reduce((a, b) => a + b, 0);
    
    return Object.entries(languageCounts).map(([language, count]) => ({
      language,
      percentage: Math.round((count / total) * 100)
    }));
  }
  
  private async detectFrameworks(packageJson: Record<string, unknown>, _rootPath: string) {
    const deps = { 
      ...(packageJson.dependencies as Record<string, string> || {}), 
      ...(packageJson.devDependencies as Record<string, string> || {}) 
    };
    const frameworks: { name: string; confidence: number }[] = [];
    
    // Framework detection with confidence scores
    if (deps.react) frameworks.push({ name: 'React', confidence: 0.9 });
    if (deps.vue) frameworks.push({ name: 'Vue', confidence: 0.9 });
    if (deps.angular) frameworks.push({ name: 'Angular', confidence: 0.9 });
    if (deps.svelte) frameworks.push({ name: 'Svelte', confidence: 0.9 });
    if (deps.express) frameworks.push({ name: 'Express', confidence: 0.9 });
    if (deps.fastify) frameworks.push({ name: 'Fastify', confidence: 0.9 });
    if (deps.next) frameworks.push({ name: 'Next.js', confidence: 0.9 });
    
    return frameworks;
  }
  
  private async analyzeDirectoryStructure(rootPath: string) {
    const hasSourceDir = existsSync(join(rootPath, 'src'));
    const hasTestDir = existsSync(join(rootPath, 'test')) || existsSync(join(rootPath, 'tests'));
    const hasDocsDir = existsSync(join(rootPath, 'docs')) || existsSync(join(rootPath, 'documentation'));
    const hasConfigDir = existsSync(join(rootPath, 'config'));
    
    // Simplified organization pattern detection
    const organizationPattern: 'flat' | 'feature-based' | 'layer-based' | 'mixed' = hasSourceDir ? 'layer-based' : 'flat';
    
    return {
      hasSourceDir,
      hasTestDir,
      hasDocsDir,
      hasConfigDir,
      organizationPattern
    };
  }
  
  private async analyzeTechnologyStack(packageJson: Record<string, unknown>, _rootPath: string) {
    const deps = { 
      ...(packageJson.dependencies as Record<string, string> || {}), 
      ...(packageJson.devDependencies as Record<string, string> || {}) 
    };
    
    const runtime = [];
    const engines = packageJson.engines as Record<string, string> || {};
    if (deps.node || engines.node) runtime.push('Node.js');
    if (deps.deno) runtime.push('Deno');
    if (deps.bun) runtime.push('Bun');
    
    const buildTools = [];
    if (deps.webpack) buildTools.push('Webpack');
    if (deps.vite) buildTools.push('Vite');
    if (deps.rollup) buildTools.push('Rollup');
    if (deps.esbuild) buildTools.push('ESBuild');
    
    const testingFrameworks = [];
    if (deps.jest) testingFrameworks.push('Jest');
    if (deps.vitest) testingFrameworks.push('Vitest');
    if (deps.mocha) testingFrameworks.push('Mocha');
    if (deps.cypress) testingFrameworks.push('Cypress');
    
    const linting = [];
    if (deps.eslint) linting.push('ESLint');
    if (deps.tslint) linting.push('TSLint');
    
    const formatting = [];
    if (deps.prettier) formatting.push('Prettier');
    if (deps.rome) formatting.push('Rome');
    
    return {
      runtime,
      buildTools,
      testingFrameworks,
      linting,
      formatting
    };
  }
  
  private async findSourceFiles(rootPath: string): Promise<string[]> {
    return await glob('**/*.{js,ts,tsx,jsx}', {
      cwd: rootPath,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      absolute: true
    });
  }
  
  private async analyzeIndentation(files: string[]): Promise<CodeStyleAnalysis['indentation']> {
    let spaceCount = 0;
    let tabCount = 0;
    let totalLines = 0;
    
    for (const file of files.slice(0, 10)) { // Sample first 10 files
      try {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';
          if (leadingWhitespace.includes('\t')) tabCount++;
          else if (leadingWhitespace.includes(' ')) spaceCount++;
          totalLines++;
        }
      } catch {
        // Skip files that can't be read
      }
    }
    
    const type: IndentationType = tabCount > spaceCount ? 'tabs' : 'spaces';
    const size = type === 'spaces' ? 2 : 1; // Default sizes
    const consistency = totalLines > 0 ? Math.max(spaceCount, tabCount) / totalLines : 0;
    
    return { type, size, consistency };
  }
  
  private async analyzeLineLength(files: string[]): Promise<CodeStyleAnalysis['lineLength']> {
    const lineLengths: number[] = [];
    
    for (const file of files.slice(0, 10)) {
      try {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        lineLengths.push(...lines.map(line => line.length));
      } catch {
        // Skip files that can't be read
      }
    }
    
    if (lineLengths.length === 0) {
      return { average: 50, max: 80, recommended: 80 };
    }
    
    const average = Math.round(lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length);
    const max = Math.max(...lineLengths);
    const recommended = average > 100 ? 120 : 80;
    
    return { average, max, recommended };
  }
  
  private async analyzeImportStyle(files: string[]): Promise<CodeStyleAnalysis['importStyle']> {
    let namedImports = 0;
    let defaultImports = 0;
    let namespaceImports = 0;
    
    for (const file of files.slice(0, 10)) {
      try {
        const content = readFileSync(file, 'utf-8');
        const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
        
        for (const line of importLines) {
          if (line.includes('import {')) namedImports++;
          else if (line.includes('import * as')) namespaceImports++;
          else if (line.includes('import ')) defaultImports++;
        }
      } catch {
        // Skip files that can't be read
      }
    }
    
    const total = namedImports + defaultImports + namespaceImports;
    if (total === 0) {
      return {
        preferred: 'named',
        namedImportUsage: 70,
        defaultImportUsage: 25,
        namespaceImportUsage: 5
      };
    }
    
    const namedPercentage = Math.round((namedImports / total) * 100);
    const defaultPercentage = Math.round((defaultImports / total) * 100);
    const namespacePercentage = Math.round((namespaceImports / total) * 100);
    
    const preferred: ImportStyle = namedImports >= defaultImports ? 'named' : 'default';
    
    return {
      preferred,
      namedImportUsage: namedPercentage,
      defaultImportUsage: defaultPercentage,
      namespaceImportUsage: namespacePercentage
    };
  }
  
  private async analyzeNamingConventions(_files: string[]): Promise<CodeStyleAnalysis['namingConventions']> {
    // Simplified implementation - would use AST parsing in production
    return {
      variables: 'camelCase',
      functions: 'camelCase',
      classes: 'PascalCase',
      constants: 'UPPER_CASE',
      files: 'kebab-case'
    };
  }
  
  private async analyzeCodeComplexity(_files: string[]): Promise<CodeStyleAnalysis['codeComplexity']> {
    // Simplified implementation - would use proper complexity analysis
    return {
      averageFunctionLength: 15,
      averageCyclomaticComplexity: 3,
      nestingDepth: { average: 2, max: 5 }
    };
  }
  
  private async calculateStyleConsistency(_files: string[]): Promise<CodeStyleAnalysis['consistency']> {
    // Simplified implementation
    return {
      overall: 0.85,
      indentationConsistency: 0.9,
      namingConsistency: 0.8,
      structureConsistency: 0.85
    };
  }
  
  private async identifyArchitecturalPatterns(_rootPath: string): Promise<ArchitectureAnalysis['patterns']> {
    // Simplified pattern detection
    return [
      { name: 'MVC', confidence: 0.7, evidence: ['controllers/', 'models/', 'views/'] },
      { name: 'Component-based', confidence: 0.9, evidence: ['components/', '.jsx files', '.tsx files'] }
    ];
  }
  
  private async analyzeLayerArchitecture(rootPath: string): Promise<ArchitectureAnalysis['layerArchitecture']> {
    const hasLayers = existsSync(join(rootPath, 'src', 'controllers')) || 
                     existsSync(join(rootPath, 'src', 'services')) ||
                     existsSync(join(rootPath, 'src', 'models'));
    
    const layers = hasLayers ? [
      { name: 'presentation', files: 10 },
      { name: 'business', files: 8 },
      { name: 'data', files: 5 }
    ] : [];
    
    return {
      hasLayers,
      layers,
      separation: hasLayers ? 0.8 : 0.3
    };
  }
  
  private async detectDesignPatterns(_rootPath: string): Promise<ArchitectureAnalysis['designPatterns']> {
    // Simplified pattern detection - would analyze code structure in production
    return {
      singleton: 0.2,
      factory: 0.3,
      observer: 0.4,
      strategy: 0.1,
      decorator: 0.2,
      adapter: 0.1
    };
  }
  
  private async analyzeDependencyManagement(_rootPath: string): Promise<ArchitectureAnalysis['dependencyManagement']> {
    // Simplified analysis
    return {
      coupling: 'medium',
      cohesion: 'high',
      circularDependencies: 0,
      dependencyInversion: 0.6
    };
  }
  
  private async analyzeTestArchitecture(rootPath: string): Promise<ArchitectureAnalysis['testArchitecture']> {
    const hasTests = existsSync(join(rootPath, 'tests')) || existsSync(join(rootPath, 'test'));
    
    return {
      testCoverage: hasTests ? 75 : 0,
      testTypes: { unit: 60, integration: 30, e2e: 10 },
      testStructure: hasTests ? 'separate' : 'colocated',
      mockingStrategy: 'moderate'
    };
  }
  
  private getDefaultTeamBehavior(): TeamBehaviorAnalysis {
    return {
      codeQualityPreferences: {
        eslintStrictness: 'medium',
        typeScriptStrictness: 'medium',
        testCoverageExpectation: 70,
        documentationLevel: 'medium'
      },
      workflowPatterns: {
        commitFrequency: 'moderate',
        branchingStrategy: 'feature-branch',
        reviewThoroughness: 'medium',
        automationPreference: 'medium'
      },
      riskTolerance: 'moderate',
      experienceLevel: {
        overall: 'medium',
        withCurrentTech: 'medium',
        withTesting: 'medium',
        withRefactoring: 'medium'
      },
      learningHistory: {
        acceptedSuggestions: 0,
        rejectedSuggestions: 0,
        modifiedSuggestions: 0,
        preferredActionTypes: []
      }
    };
  }
  
  private analyzeQualityPreferences(trainingData: TrainingDataPoint[]): TeamBehaviorAnalysis['codeQualityPreferences'] {
    const avgWarningsBefore = trainingData.reduce((sum, d) => sum + d.beforeState.eslintWarnings, 0) / trainingData.length;
    const avgErrorsBefore = trainingData.reduce((sum, d) => sum + d.beforeState.typeErrors, 0) / trainingData.length;
    
    const eslintStrictness: QualityLevel = avgWarningsBefore > 10 ? 'low' : avgWarningsBefore > 3 ? 'medium' : 'high';
    const typeScriptStrictness: QualityLevel = avgErrorsBefore > 0 ? 'low' : 'high';
    
    return {
      eslintStrictness,
      typeScriptStrictness,
      testCoverageExpectation: 70, // Default
      documentationLevel: 'medium' // Default
    };
  }
  
  private analyzeWorkflowPatterns(trainingData: TrainingDataPoint[]): TeamBehaviorAnalysis['workflowPatterns'] {
    // Simplified analysis based on available data
    const avgFilesModified = trainingData.reduce((sum, d) => sum + d.action.filesModified.length, 0) / trainingData.length;
    
    return {
      commitFrequency: avgFilesModified > 5 ? 'batched' : avgFilesModified > 2 ? 'moderate' : 'frequent',
      branchingStrategy: 'feature-branch', // Default
      reviewThoroughness: 'medium', // Default
      automationPreference: 'high' // Since they're using ODAVL
    };
  }
  
  private determineRiskTolerance(trainingData: TrainingDataPoint[]): RiskTolerance {
    const acceptanceRate = trainingData.filter(d => d.outcome.userAcceptance).length / trainingData.length;
    
    if (acceptanceRate > 0.8) return 'aggressive';
    if (acceptanceRate > 0.6) return 'moderate';
    return 'conservative';
  }
  
  private assessExperienceLevel(trainingData: TrainingDataPoint[]): TeamBehaviorAnalysis['experienceLevel'] {
    const avgComplexity = trainingData.reduce((sum, d) => {
      const complexityScore = d.projectContext.complexity === 'high' ? 3 : d.projectContext.complexity === 'medium' ? 2 : 1;
      return sum + complexityScore;
    }, 0) / trainingData.length;
    
    const level: QualityLevel = avgComplexity > 2.5 ? 'high' : avgComplexity > 1.5 ? 'medium' : 'low';
    
    return {
      overall: level,
      withCurrentTech: level,
      withTesting: level,
      withRefactoring: level
    };
  }
  
  private extractLearningHistory(trainingData: TrainingDataPoint[]): TeamBehaviorAnalysis['learningHistory'] {
    const accepted = trainingData.filter(d => d.outcome.userAcceptance && d.outcome.success).length;
    const rejected = trainingData.filter(d => !d.outcome.userAcceptance).length;
    const modified = trainingData.filter(d => d.outcome.userAcceptance && !d.outcome.success).length;
    
    const actionTypes = trainingData.map(d => d.action.type);
    const preferredActionTypes = [...new Set(actionTypes)]
      .map(type => ({ type, count: actionTypes.filter(t => t === type).length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(({ type }) => type);
    
    return {
      acceptedSuggestions: accepted,
      rejectedSuggestions: rejected,
      modifiedSuggestions: modified,
      preferredActionTypes
    };
  }
  
  private getDefaultTrendAnalysis(): QualityTrendAnalysis {
    return {
      overallTrend: { direction: 'stable', rate: 0, confidence: 0.5 },
      metricTrends: {
        eslintWarnings: { trend: 0, volatility: 0.1 },
        typeErrors: { trend: 0, volatility: 0.1 },
        codeComplexity: { trend: 0, volatility: 0.1 },
        testCoverage: { trend: 0, volatility: 0.1 }
      },
      periodicPatterns: {
        dayOfWeek: {},
        timeOfDay: {},
        seasonal: {}
      },
      predictiveInsights: {
        nextWeekForecast: {
          eslintWarnings: 0,
          typeErrors: 0,
          codeComplexity: 0,
          testCoverage: 0,
          duplication: 0,
          timestamp: new Date().toISOString()
        },
        riskFactors: [],
        recommendations: []
      }
    };
  }
  
  private calculateOverallTrend(metrics: QualityMetrics[]): QualityTrendAnalysis['overallTrend'] {
    if (metrics.length < 2) {
      return { direction: 'stable', rate: 0, confidence: 0.5 };
    }
    
    const first = metrics[0];
    const last = metrics[metrics.length - 1];
    
    const warningChange = last.eslintWarnings - first.eslintWarnings;
    const errorChange = last.typeErrors - first.typeErrors;
    
    const totalChange = warningChange + errorChange;
    const direction = totalChange < -2 ? 'improving' : totalChange > 2 ? 'degrading' : 'stable';
    
    const timeSpan = new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime();
    const rate = totalChange / (timeSpan / (1000 * 60 * 60 * 24 * 7)); // per week
    
    return { direction, rate, confidence: 0.8 };
  }
  
  private calculateMetricTrends(_metrics: QualityMetrics[]): QualityTrendAnalysis['metricTrends'] {
    // Simplified trend calculation
    return {
      eslintWarnings: { trend: -0.1, volatility: 0.2 },
      typeErrors: { trend: -0.05, volatility: 0.1 },
      codeComplexity: { trend: 0.02, volatility: 0.15 },
      testCoverage: { trend: 0.5, volatility: 0.1 }
    };
  }
  
  private identifyPeriodicPatterns(_metrics: QualityMetrics[]): QualityTrendAnalysis['periodicPatterns'] {
    // Simplified pattern identification
    return {
      dayOfWeek: { 'Monday': 1.2, 'Friday': 0.8 },
      timeOfDay: { '09:00': 1.1, '17:00': 0.9 },
      seasonal: { 'Q1': 1.0, 'Q2': 0.9, 'Q3': 1.1, 'Q4': 0.8 }
    };
  }
  
  private generatePredictiveInsights(metrics: QualityMetrics[]): QualityTrendAnalysis['predictiveInsights'] {
    const latest = metrics[metrics.length - 1];
    
    return {
      nextWeekForecast: {
        eslintWarnings: Math.max(0, latest.eslintWarnings - 1),
        typeErrors: latest.typeErrors,
        codeComplexity: latest.codeComplexity,
        testCoverage: Math.min(100, latest.testCoverage + 2),
        duplication: latest.duplication,
        timestamp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      riskFactors: [
        { factor: 'increasing complexity', impact: 0.3 },
        { factor: 'weekend deployments', impact: 0.2 }
      ],
      recommendations: [
        { action: 'focus on reducing complexity', priority: 0.8 },
        { action: 'increase test coverage', priority: 0.6 }
      ]
    };
  }
  
  private calculateWarningTolerance(trainingData: TrainingDataPoint[]): number {
    const avgWarnings = trainingData.reduce((sum, d) => sum + d.beforeState.eslintWarnings, 0) / trainingData.length;
    return Math.ceil(avgWarnings * 1.2); // 20% tolerance above average
  }
  
  private calculateTrendDirection(trainingData: TrainingDataPoint[]): 'improving' | 'stable' | 'degrading' {
    const improvements = trainingData.filter(d => d.outcome.qualityImprovement > 0).length;
    const degradations = trainingData.filter(d => d.outcome.qualityImprovement < 0).length;
    
    if (improvements > degradations * 1.5) return 'improving';
    if (degradations > improvements * 1.5) return 'degrading';
    return 'stable';
  }
}