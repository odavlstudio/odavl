/**
 * Test Java Parser directly on sample code
 */

import { JavaParser } from './odavl-studio/insight/core/src/parsers/java-parser.js';
import * as path from 'path';
import * as fs from 'fs/promises';

async function testJavaParser() {
    console.log('🔍 Testing Java Parser\n');
    console.log('='.repeat(70));
    
    const filePath = path.join(process.cwd(), 'test-fixtures', 'java', 'UserService.java');
    console.log(`📁 File: ${filePath}\n`);
    
    try {
        const parser = new JavaParser();
        
        // Read file
        const code = await fs.readFile(filePath, 'utf-8');
        console.log(`📄 File size: ${code.length} bytes`);
        console.log(`📄 Lines: ${code.split('\n').length}\n`);
        
        // Parse
        console.log('🔄 Parsing...');
        const startTime = Date.now();
        const ast = parser.parseToAST(code);
        const endTime = Date.now();
        
        console.log(`✅ Parsed successfully in ${endTime - startTime}ms\n`);
        
        // Display raw AST structure to understand what java-ast returns
        console.log('🔍 Raw AST structure:');
        console.log('Keys:', Object.keys(ast.raw || {}));
        console.log('Type:', ast.raw?.name || typeof ast.raw);
        if (ast.raw?.children) {
            console.log('Children keys:', Object.keys(ast.raw.children));
        }
        console.log('\n');
        
        // Display results
        console.log(`📦 Package: ${ast.package?.name || '(none)'}`);
        console.log(`📥 Imports: ${ast.imports.length}`);
        console.log(`📂 Classes: ${ast.classes.length}\n`);
        
        // Display imports
        if (ast.imports.length > 0) {
            console.log('📥 Imports:');
            for (const imp of ast.imports) {
                console.log(`  - ${imp.package} ${imp.isStatic ? '(static)' : ''} ${imp.isWildcard ? '(*)' : ''}`);
            }
            console.log('');
        }
        
        // Display classes
        for (const classDecl of ast.classes) {
            console.log(`📂 Class: ${classDecl.name}`);
            console.log(`   Modifiers: ${classDecl.modifiers.join(', ') || '(none)'}`);
            console.log(`   Type: ${classDecl.isInterface ? 'Interface' : classDecl.isEnum ? 'Enum' : 'Class'}`);
            console.log(`   Line: ${classDecl.line}`);
            console.log(`   Methods: ${classDecl.methods.length}`);
            console.log(`   Fields: ${classDecl.fields.length}\n`);
            
            // Display methods
            if (classDecl.methods.length > 0) {
                console.log('  🔧 Methods:');
                for (const method of classDecl.methods) {
                    console.log(`    - ${method.name}(${method.parameters.map(p => `${p.type} ${p.name}`).join(', ')}): ${method.returnType}`);
                    console.log(`      Modifiers: ${method.modifiers.join(', ') || '(none)'}`);
                    console.log(`      Line: ${method.line}, Body lines: ${method.bodyLines}`);
                }
                console.log('');
            }
            
            // Display fields
            if (classDecl.fields.length > 0) {
                console.log('  📝 Fields:');
                for (const field of classDecl.fields) {
                    console.log(`    - ${field.type} ${field.name}`);
                    console.log(`      Modifiers: ${field.modifiers.join(', ') || '(none)'}`);
                    console.log(`      Line: ${field.line}`);
                }
                console.log('');
            }
        }
        
        console.log('='.repeat(70));
        console.log('✅ Java Parser test complete!\n');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

testJavaParser();
