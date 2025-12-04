/**
 * Java Parser - java-ast integration
 * Parses Java code to Abstract Syntax Tree
 */

import { parse, createVisitor } from 'java-ast';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface JavaImport {
    package: string;
    isStatic: boolean;
    isWildcard: boolean;
    line: number;
}

export interface JavaClass {
    name: string;
    modifiers: string[];
    superClass?: string;
    interfaces: string[];
    isInterface: boolean;
    isEnum: boolean;
    isAnnotation: boolean;
    line: number;
    methods: JavaMethod[];
    fields: JavaField[];
    annotations: JavaAnnotation[];
}

export interface JavaMethod {
    name: string;
    modifiers: string[];
    returnType: string;
    parameters: JavaParameter[];
    exceptions: string[];
    line: number;
    annotations: JavaAnnotation[];
    bodyLines: number;
}

export interface JavaParameter {
    name: string;
    type: string;
    annotations: JavaAnnotation[];
}

export interface JavaField {
    name: string;
    type: string;
    modifiers: string[];
    initializer?: string;
    line: number;
    annotations: JavaAnnotation[];
}

export interface JavaAnnotation {
    name: string;
    arguments: Record<string, any>;
    line: number;
}

export interface JavaPackage {
    name: string;
    line: number;
}

export interface JavaAST {
    package?: JavaPackage;
    imports: JavaImport[];
    classes: JavaClass[];
    raw: any; // Original AST from java-ast
}

export class JavaParser {
    /**
     * Parse Java source code to AST
     * @param code Java source code
     * @returns JavaAST structure
     */
    parseToAST(code: string): JavaAST {
        try {
            console.log(`[JavaParser] Parsing ${code.length} characters...`);
            const rawAST = parse(code);
            console.log(`[JavaParser] Raw AST parsed successfully, type:`, typeof rawAST);
            
            const result: JavaAST = {
                imports: [],
                classes: [],
                raw: rawAST,
            };

            // Extract package
            result.package = this.extractPackage(rawAST);
            console.log(`[JavaParser] Extracted package:`, result.package?.name || 'none');

            // Extract imports
            result.imports = this.extractImports(rawAST);
            console.log(`[JavaParser] Extracted ${result.imports.length} imports`);

            // Extract classes (including interfaces, enums, annotations)
            result.classes = this.extractClasses(rawAST);
            console.log(`[JavaParser] Extracted ${result.classes.length} classes`);

            return result;
        } catch (error) {
            console.error('[JavaParser] Parsing failed:', error);
            throw new Error(`Java parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Extract package declaration from AST
     */
    private extractPackage(ast: any): JavaPackage | undefined {
        try {
            const visitor = createVisitor({
                visitPackageDeclaration: (ctx: any) => {
                    return {
                        name: this.getQualifiedName(ctx.qualifiedName),
                        line: ctx.location?.startLine || 0,
                    };
                },
                defaultResult: () => undefined,
            });
            return visitor.visit(ast);
        } catch {
            return undefined;
        }
    }

    /**
     * Extract imports from AST
     */
    private extractImports(ast: any): JavaImport[] {
        const imports: JavaImport[] = [];
        
        try {
            const visitor = createVisitor({
                visitImportDeclaration: (ctx: any) => {
                    const packageName = this.getQualifiedName(ctx.qualifiedName);
                    imports.push({
                        package: packageName,
                        isStatic: !!ctx.Static,
                        isWildcard: !!ctx.Star,
                        line: ctx.location?.startLine || 0,
                    });
                    return undefined;
                },
                defaultResult: () => undefined,
            });
            visitor.visit(ast);
        } catch (error) {
            console.error('Failed to extract imports:', error);
        }

        return imports;
    }

    /**
     * Extract classes (including interfaces, enums) from AST
     */
    private extractClasses(ast: any): JavaClass[] {
        const classes: JavaClass[] = [];

        try {
            console.log('[JavaParser extractClasses] Starting class extraction...');
            const visitor = createVisitor({
                visitClassDeclaration: (ctx: any) => {
                    console.log('[JavaParser] Visit class declaration');
                    
                    // Extract class name from ANTLR context
                    // Structure: children[0] = "class" keyword, children[1] = IdentifierContext, children[2] = ClassBodyContext
                    let className = '';
                    
                    if (ctx.children && ctx.children.length > 1) {
                        const identCtx = ctx.children[1]; // IdentifierContext
                        
                        // ANTLR tokens have start/stop indices, but text may be in different places
                        // Try to get text from the token
                        if (identCtx._start) {
                            const token = identCtx._start;
                            // Get text from the input stream using token indices
                            const stream = token.source?.stream;
                            if (stream && stream.data) {
                                const start = token.start;
                                const stop = token.stop;
                                className = stream.data.substring(start, stop + 1);
                            } else if (token._text) {
                                className = token._text;
                            }
                        }
                        
                        // Fallback: if IdentifierContext has children, try to extract from them
                        if (!className && identCtx.children && identCtx.children.length > 0) {
                            const terminalNode = identCtx.children[0];
                            if (terminalNode._symbol) {
                                const symbol = terminalNode._symbol;
                                const stream = symbol.source?.stream;
                                if (stream && stream.data) {
                                    className = stream.data.substring(symbol.start, symbol.stop + 1);
                                } else if (symbol._text) {
                                    className = symbol._text;
                                }
                            }
                        }
                    }
                    
                    console.log('[JavaParser] Extracted class name:', className);
                    
                    // Find ClassBodyContext in children
                    let classBody = null;
                    if (ctx.children) {
                        for (const child of ctx.children) {
                            if (child.constructor?.name === 'ClassBodyContext') {
                                classBody = child;
                                break;
                            }
                        }
                    }
                    console.log('[JavaParser] ClassBody found:', classBody ? 'yes' : 'no');
                    
                    if (className) {
                        classes.push({
                            name: className,
                            modifiers: this.extractModifiers(ctx.classModifier),
                            superClass: this.extractSuperClass(ctx.normalClassDeclaration),
                            interfaces: this.extractInterfaces(ctx.normalClassDeclaration?.superinterfaces),
                            isInterface: false,
                            isEnum: false,
                            isAnnotation: false,
                            line: ctx._start?._line || ctx.location?.startLine || 0,
                            methods: this.extractMethods(classBody),
                            fields: this.extractFields(classBody),
                            annotations: [],
                        });
                    }
                    return undefined;
                },
                visitInterfaceDeclaration: (ctx: any) => {
                    console.log('[JavaParser] Visit interface declaration');
                    const interfaceName = this.getIdentifier(ctx.normalInterfaceDeclaration?.typeIdentifier);
                    if (interfaceName) {
                        classes.push({
                            name: interfaceName,
                            modifiers: this.extractModifiers(ctx.interfaceModifier),
                            interfaces: [],
                            isInterface: true,
                            isEnum: false,
                            isAnnotation: false,
                            line: ctx.location?.startLine || 0,
                            methods: this.extractInterfaceMethods(ctx.normalInterfaceDeclaration?.interfaceBody),
                            fields: [],
                            annotations: [],
                        });
                    }
                    return undefined;
                },
                visitEnumDeclaration: (ctx: any) => {
                    console.log('[JavaParser] Visit enum declaration');
                    const enumName = this.getIdentifier(ctx.typeIdentifier);
                    if (enumName) {
                        classes.push({
                            name: enumName,
                            modifiers: [],
                            interfaces: [],
                            isInterface: false,
                            isEnum: true,
                            isAnnotation: false,
                            line: ctx.location?.startLine || 0,
                            methods: [],
                            fields: [],
                            annotations: [],
                        });
                    }
                    return undefined;
                },
                defaultResult: () => undefined,
            });
            console.log('[JavaParser extractClasses] Created visitor, calling visit()...');
            visitor.visit(ast);
            console.log('[JavaParser extractClasses] Visit complete, found', classes.length, 'classes');
        } catch (error) {
            console.error('[JavaParser extractClasses] Failed to extract classes:', error);
            if (error instanceof Error) {
                console.error('[JavaParser extractClasses] Stack:', error.stack);
            }
        }

        return classes;
    }

    /**
     * Extract methods from class body
     */
    private extractMethods(classBody: any): JavaMethod[] {
        const methods: JavaMethod[] = [];
        
        if (!classBody || !classBody.children) return methods;

        // Iterate through class body declarations
        for (const child of classBody.children) {
            // Skip braces and other non-declaration nodes
            if (!child.children) continue;
            
            // Look for method declarations in various paths
            let methodDecl = null;
            
            // Try to find method declaration
            if (child.constructor?.name === 'ClassBodyDeclarationContext') {
                // Look deeper into the structure
                if (child.children) {
                    for (const cbdChild of child.children) {
                        if (cbdChild.constructor?.name === 'MemberDeclarationContext') {
                            // MemberDeclarationContext can contain MethodDeclarationContext or FieldDeclarationContext
                            if (cbdChild.children) {
                                for (const mdChild of cbdChild.children) {
                                    if (mdChild.constructor?.name === 'MethodDeclarationContext') {
                                        methodDecl = mdChild;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            if (methodDecl && methodDecl.children) {
                // Extract method name from children
                // Structure: child[0]=returnType, child[1]=IdentifierContext (method name), child[2]=params, child[3]=body
                let methodName = '';
                let methodLine = 0;
                
                if (methodDecl.children.length > 1) {
                    const identCtx = methodDecl.children[1];
                    if (identCtx && identCtx.constructor?.name === 'IdentifierContext' && identCtx._start) {
                        const token = identCtx._start;
                        const stream = token.source?.stream;
                        if (stream && stream.data) {
                            methodName = stream.data.substring(token.start, token.stop + 1);
                            methodLine = token._line || 0;
                        }
                    }
                }
                
                if (methodName) {
                    methods.push({
                        name: methodName,
                        modifiers: [],
                        returnType: 'void',
                        parameters: [],
                        exceptions: [],
                        line: methodLine || methodDecl._start?._line || 0,
                        annotations: [],
                        bodyLines: this.estimateBodyLines(methodDecl),
                    });
                }
            }
        }

        return methods;
    }

    /**
     * Extract methods from interface body
     */
    private extractInterfaceMethods(interfaceBody: any): JavaMethod[] {
        const methods: JavaMethod[] = [];
        if (!interfaceBody || !interfaceBody.children) return methods;

        // Iterate through interface body declarations
        for (const child of interfaceBody.children) {
            if (!child.children) continue;
            
            // Look for interface method declarations
            if (child.children.interfaceMethodDeclaration) {
                const methodDecl = child.children.interfaceMethodDeclaration[0];
                
                if (methodDecl && methodDecl.children) {
                    // Extract method name
                    let methodName = '';
                    let methodLine = 0;
                    
                    for (const mdChild of methodDecl.children) {
                        if (mdChild.constructor?.name === 'MethodDeclaratorContext') {
                            if (mdChild.children && mdChild.children.length > 0) {
                                const firstChild = mdChild.children[0];
                                if (firstChild.constructor?.name === 'IdentifierContext' && firstChild._start) {
                                    const token = firstChild._start;
                                    const stream = token.source?.stream;
                                    if (stream && stream.data) {
                                        methodName = stream.data.substring(token.start, token.stop + 1);
                                        methodLine = token._line || 0;
                                    }
                                }
                            }
                        }
                    }
                    
                    if (methodName) {
                        methods.push({
                            name: methodName,
                            modifiers: [],
                            returnType: 'void',
                            parameters: [],
                            exceptions: [],
                            line: methodLine || methodDecl._start?._line || 0,
                            annotations: [],
                            bodyLines: 0,
                        });
                    }
                }
            }
        }

        return methods;
    }

    /**
     * Extract fields from class body
     */
    private extractFields(classBody: any): JavaField[] {
        const fields: JavaField[] = [];
        if (!classBody || !classBody.children) return fields;

        // Navigate: ClassBodyDeclarationContext → MemberDeclarationContext → FieldDeclarationContext
        for (const child of classBody.children) {
            if (!child.children) continue;
            
            let fieldDecl = null;
            
            // Navigate through context hierarchy
            if (child.constructor?.name === 'ClassBodyDeclarationContext') {
                for (const cbdChild of child.children) {
                    if (cbdChild.constructor?.name === 'MemberDeclarationContext') {
                        for (const mdChild of cbdChild.children) {
                            if (mdChild.constructor?.name === 'FieldDeclarationContext') {
                                fieldDecl = mdChild;
                                break;
                            }
                        }
                    }
                }
            }
            
            if (fieldDecl && fieldDecl.children) {
                // Extract field type (first child is usually TypeTypeContext)
                let fieldType = 'unknown';
                if (fieldDecl.children.length > 0 && fieldDecl.children[0]._start) {
                    const typeToken = fieldDecl.children[0]._start;
                    const stream = typeToken.source?.stream;
                    if (stream && stream.data) {
                        // Extract just the type name (simplified)
                        const typeStart = typeToken.start;
                        const typeStop = typeToken.stop;
                        fieldType = stream.data.substring(typeStart, typeStop + 1);
                    }
                }
                
                // Extract variable declarators (field names)
                for (const fdChild of fieldDecl.children) {
                    if (fdChild.constructor?.name === 'VariableDeclaratorsContext') {
                        if (fdChild.children) {
                            for (const vdChild of fdChild.children) {
                                if (vdChild.constructor?.name === 'VariableDeclaratorContext') {
                                    // Navigate to VariableDeclaratorIdContext → IdentifierContext
                                    if (vdChild.children) {
                                        for (const vidChild of vdChild.children) {
                                            if (vidChild.constructor?.name === 'VariableDeclaratorIdContext') {
                                                if (vidChild.children && vidChild.children.length > 0) {
                                                    const identCtx = vidChild.children[0];
                                                    if (identCtx.constructor?.name === 'IdentifierContext' && identCtx._start) {
                                                        const token = identCtx._start;
                                                        const stream = token.source?.stream;
                                                        if (stream && stream.data) {
                                                            const fieldName = stream.data.substring(token.start, token.stop + 1);
                                                            const fieldLine = token._line || 0;
                                                            
                                                            // Extract modifiers from ClassBodyDeclarationContext
                                                            const modifiers: string[] = [];
                                                            for (const siblingChild of child.children) {
                                                                if (siblingChild.constructor?.name === 'ModifierContext') {
                                                                    // Extract modifier keyword (public, private, static, final, volatile, etc.)
                                                                    if (siblingChild._start) {
                                                                        const modToken = siblingChild._start;
                                                                        const modStream = modToken.source?.stream;
                                                                        if (modStream && modStream.data) {
                                                                            const modifier = modStream.data.substring(modToken.start, modToken.stop + 1);
                                                                            modifiers.push(modifier);
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                            
                                                            fields.push({
                                                                name: fieldName,
                                                                type: fieldType,
                                                                modifiers,
                                                                line: fieldLine,
                                                                annotations: [],
                                                            });
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return fields;
    }

    /**
     * Extract parameters from method declarator
     */
    private extractParameters(methodDeclarator: any): JavaParameter[] {
        const parameters: JavaParameter[] = [];
        if (!methodDeclarator) return parameters;

        const formalParams = methodDeclarator.children?.formalParameterList?.[0]?.children?.formalParameter;
        if (formalParams) {
            for (const param of formalParams) {
                const paramName = this.getIdentifier(param.children?.variableDeclaratorId?.[0]?.children?.Identifier?.[0]);
                if (paramName) {
                    parameters.push({
                        name: paramName,
                        type: this.extractParameterType(param),
                        annotations: [],
                    });
                }
            }
        }

        return parameters;
    }

    /**
     * Helper: Extract modifiers (public, private, static, etc.)
     */
    private extractModifiers(modifiers: any[]): string[] {
        if (!modifiers || !Array.isArray(modifiers)) return [];
        
        const result: string[] = [];
        for (const mod of modifiers) {
            if (mod.children) {
                // Extract modifier keywords
                for (const key of Object.keys(mod.children)) {
                    if (key.match(/^(Public|Private|Protected|Static|Final|Abstract|Synchronized|Native|Strictfp|Transient|Volatile)$/i)) {
                        result.push(key.toLowerCase());
                    }
                }
            }
        }
        return result;
    }

    /**
     * Helper: Extract qualified name (package or import)
     */
    private getQualifiedName(qualifiedName: any): string {
        if (!qualifiedName || !qualifiedName[0]) return '';
        
        const identifiers = qualifiedName[0].children?.Identifier;
        if (identifiers && Array.isArray(identifiers)) {
            return identifiers.map((id: any) => id.image).join('.');
        }
        
        return '';
    }

    /**
     * Helper: Extract identifier (class name, method name, etc.)
     */
    private getIdentifier(identifier: any): string {
        if (!identifier) return '';
        return identifier.image || '';
    }

    /**
     * Helper: Extract super class name
     */
    private extractSuperClass(normalClassDeclaration: any): string | undefined {
        if (!normalClassDeclaration?.superclass) return undefined;
        const classType = normalClassDeclaration.superclass[0]?.children?.classType?.[0];
        return this.getIdentifier(classType?.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]);
    }

    /**
     * Helper: Extract interface names
     */
    private extractInterfaces(superinterfaces: any): string[] {
        if (!superinterfaces || !superinterfaces[0]) return [];
        const interfaceTypeList = superinterfaces[0].children?.interfaceTypeList?.[0]?.children?.interfaceType;
        if (!interfaceTypeList) return [];
        
        return interfaceTypeList.map((iface: any) => {
            const classType = iface.children?.classType?.[0];
            return this.getIdentifier(classType?.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]);
        }).filter(Boolean);
    }

    /**
     * Helper: Extract return type
     */
    private extractReturnType(result: any): string {
        if (!result || !result[0]) return 'void';
        
        if (result[0].children?.Void) return 'void';
        
        const unannType = result[0].children?.unannType?.[0];
        if (unannType) {
            // Try to extract primitive or reference type
            if (unannType.children?.primitiveType) {
                return this.extractPrimitiveType(unannType.children.primitiveType[0]);
            }
            if (unannType.children?.referenceType) {
                return this.extractReferenceType(unannType.children.referenceType[0]);
            }
        }
        
        return 'unknown';
    }

    /**
     * Helper: Extract field type
     */
    private extractFieldType(fieldDecl: any): string {
        const unannType = fieldDecl.children?.unannType?.[0];
        if (!unannType) return 'unknown';
        
        if (unannType.children?.primitiveType) {
            return this.extractPrimitiveType(unannType.children.primitiveType[0]);
        }
        if (unannType.children?.referenceType) {
            return this.extractReferenceType(unannType.children.referenceType[0]);
        }
        
        return 'unknown';
    }

    /**
     * Helper: Extract parameter type
     */
    private extractParameterType(param: any): string {
        const unannType = param.children?.unannType?.[0];
        if (!unannType) return 'unknown';
        
        if (unannType.children?.primitiveType) {
            return this.extractPrimitiveType(unannType.children.primitiveType[0]);
        }
        if (unannType.children?.referenceType) {
            return this.extractReferenceType(unannType.children.referenceType[0]);
        }
        
        return 'unknown';
    }

    /**
     * Helper: Extract primitive type (int, boolean, etc.)
     */
    private extractPrimitiveType(primitiveType: any): string {
        if (!primitiveType || !primitiveType.children) return 'unknown';
        
        const typeKeys = ['Int', 'Long', 'Short', 'Byte', 'Char', 'Float', 'Double', 'Boolean'];
        for (const key of typeKeys) {
            if (primitiveType.children[key]) {
                return key.toLowerCase();
            }
        }
        
        return 'unknown';
    }

    /**
     * Helper: Extract reference type (String, List<T>, etc.)
     */
    private extractReferenceType(referenceType: any): string {
        if (!referenceType || !referenceType.children) return 'unknown';
        
        const classOrInterfaceType = referenceType.children.classOrInterfaceType?.[0];
        if (classOrInterfaceType) {
            const typeIdentifier = classOrInterfaceType.children?.classType?.[0]?.children?.typeIdentifier?.[0];
            return this.getIdentifier(typeIdentifier?.children?.Identifier?.[0]) || 'unknown';
        }
        
        return 'unknown';
    }

    /**
     * Helper: Estimate body lines (for complexity analysis)
     * Uses ANTLR token positions to calculate method span
     */
    private estimateBodyLines(methodDecl: any): number {
        // ANTLR contexts have _start and _stop tokens
        if (methodDecl._start && methodDecl._stop) {
            const startLine = methodDecl._start._line || 0;
            const stopLine = methodDecl._stop._line || startLine;
            const bodyLines = Math.max(0, stopLine - startLine + 1);
            return bodyLines;
        }
        
        // Fallback: try location property (for compatibility)
        if (methodDecl.location) {
            const startLine = methodDecl.location.startLine || 0;
            const endLine = methodDecl.location.endLine || startLine;
            return Math.max(0, endLine - startLine - 1);
        }
        
        return 0;
    }

    /**
     * Parse Java file from disk
     */
    async parseFile(filePath: string): Promise<JavaAST> {
        const code = await fs.readFile(filePath, 'utf-8');
        return this.parseToAST(code);
    }

    /**
     * Find all Java files in a directory
     */
    async findJavaFiles(dir: string): Promise<string[]> {
        const files: string[] = [];
        
        async function walk(directory: string) {
            const entries = await fs.readdir(directory, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(directory, entry.name);
                
                // Skip common Java build/dependency directories
                if (entry.name === 'node_modules' || 
                    entry.name === '.git' || 
                    entry.name === 'target' || 
                    entry.name === 'build' || 
                    entry.name === 'out' ||
                    entry.name === '.gradle' ||
                    entry.name === '.mvn') {
                    continue;
                }
                
                if (entry.isDirectory()) {
                    await walk(fullPath);
                } else if (entry.name.endsWith('.java')) {
                    files.push(fullPath);
                }
            }
        }
        
        await walk(dir);
        return files;
    }

    /**
     * Detect if a directory is a Java project
     */
    async isJavaProject(dir: string): Promise<boolean> {
        try {
            // Check for Maven (pom.xml)
            await fs.access(path.join(dir, 'pom.xml'));
            return true;
        } catch {
            // Check for Gradle (build.gradle or build.gradle.kts)
            try {
                await fs.access(path.join(dir, 'build.gradle'));
                return true;
            } catch {
                try {
                    await fs.access(path.join(dir, 'build.gradle.kts'));
                    return true;
                } catch {
                    // Check for any .java files
                    const javaFiles = await this.findJavaFiles(dir);
                    return javaFiles.length > 0;
                }
            }
        }
    }

    /**
     * Detect Java version from project
     */
    async detectJavaVersion(dir: string): Promise<string | undefined> {
        try {
            // Try Maven pom.xml
            const pomPath = path.join(dir, 'pom.xml');
            try {
                const pomContent = await fs.readFile(pomPath, 'utf-8');
                const versionMatch = pomContent.match(/<maven\.compiler\.(source|target)>(\d+)<\/maven\.compiler\.(source|target)>/);
                if (versionMatch) return versionMatch[2];
            } catch {}

            // Try Gradle build.gradle
            const gradlePath = path.join(dir, 'build.gradle');
            try {
                const gradleContent = await fs.readFile(gradlePath, 'utf-8');
                const versionMatch = gradleContent.match(/sourceCompatibility\s*=\s*['"]?(\d+)['"]?/);
                if (versionMatch) return versionMatch[1];
            } catch {}

            return undefined;
        } catch {
            return undefined;
        }
    }
}
