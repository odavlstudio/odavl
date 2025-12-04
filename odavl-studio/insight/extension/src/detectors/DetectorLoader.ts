/**
 * Lazy Detector Loader - loads detector modules on-demand
 */
import { ProgrammingLanguage } from '../language-detector';

export class DetectorLoader {
  private detectorModules: {
    typescript?: any;
    python?: any;
    java?: any;
  } = {};

  /**
   * Get detector for language (lazy-load on first use)
   * 
   * @param language Programming language
   * @returns Detector instance or null
   */
  async getDetectorForLanguage(language: ProgrammingLanguage): Promise<any | null> {
    try {
      // Check cache first
      if (this.detectorModules[language]) {
        return this.detectorModules[language];
      }
      
      // Lazy-load detector module
      let DetectorClass: any;
      
      switch (language) {
        case 'typescript':
        case 'javascript':
          const tsModule = await import('@odavl-studio/insight-core/detector/typescript-detector');
          DetectorClass = tsModule.TypeScriptDetector;
          break;
          
        case 'python':
          const pyModule = await import('@odavl-studio/insight-core/detector/python-types-detector');
          DetectorClass = pyModule.PythonTypesDetector;
          break;
          
        case 'java':
          const javaModule = await import('@odavl-studio/insight-core/detector/java-exception-detector');
          DetectorClass = javaModule.JavaExceptionDetector;
          break;
          
        default:
          console.warn(`No detector available for language: ${language}`);
          return null;
      }
      
      // Instantiate and cache
      const detector = new DetectorClass();
      this.detectorModules[language] = detector;
      
      return detector;
    } catch (error) {
      console.error(`Failed to load detector for ${language}:`, error);
      return null;
    }
  }

  /**
   * Run detector on single file
   * 
   * @param detector Detector instance
   * @param filePath File path
   * @param language Programming language
   * @param workspaceRoot Workspace root (needed for most detectors)
   * @returns Array of issues
   */
  async runOnFile(detector: any, filePath: string, language: ProgrammingLanguage, workspaceRoot: string): Promise<any[]> {
    try {
      const allIssues = await detector.analyze(workspaceRoot);
      
      // Filter issues for this file only
      const fileIssues = allIssues.filter((issue: any) => issue.file === filePath);
      
      // Add language to each issue
      return fileIssues.map((issue: any) => ({
        ...issue,
        language,
      }));
    } catch (error) {
      console.error(`Detector error on file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Run detector on workspace
   * 
   * @param detector Detector instance
   * @param workspaceRoot Workspace root path
   * @param language Programming language
   * @returns Array of issues
   */
  async runOnWorkspace(detector: any, workspaceRoot: string, language: ProgrammingLanguage): Promise<any[]> {
    try {
      const issues = await detector.analyze(workspaceRoot);
      
      // Add language to each issue
      return issues.map((issue: any) => ({
        ...issue,
        language,
      }));
    } catch (error) {
      console.error(`Detector error on workspace for ${language}:`, error);
      return [];
    }
  }
}
