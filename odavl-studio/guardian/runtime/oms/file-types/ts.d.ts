/**
 * OMEGA-P5: TypeScript File Type Definition
 * Real AST-based parser for .ts files
 */
export interface FileMetadata {
    path: string;
    type: string;
    size: number;
    complexity: number;
    imports: string[];
    exports: string[];
    functions: number;
    classes: number;
    interfaces: number;
    hasTests: boolean;
    dependencies: string[];
}
export interface FileTypeDefinition {
    id: string;
    extensions: string[];
    category: 'config' | 'code' | 'infra' | 'docs' | 'app';
    riskWeight: number;
    importance: number;
    parse: (filePath: string) => Promise<FileMetadata>;
}
/**
 * TypeScript File Type Definition
 * OMEGA-P5: Risk and importance based on ODAVL intelligence
 */
export declare const TypeScriptFileType: FileTypeDefinition;
