import { PythonTypeDetector } from './odavl-studio/insight/core/src/detector/python/python-type-detector.js';
import { execSync } from 'child_process';

async function debugMypy() {
    console.log('🔍 Debugging Python Type Detector\n');
    
    const testDir = 'C:\\Users\\sabou\\dev\\odavl\\test-fixtures\\python';
    
    // Test 1: Run mypy manually
    console.log('1. Testing mypy command directly:');
    try {
        const output = execSync(`mypy "${testDir}" --config-file="${testDir}\\mypy.ini" --show-column-numbers --no-error-summary`, { 
            encoding: 'utf-8', 
            stdio: ['ignore', 'pipe', 'pipe'] 
        });
        console.log('STDOUT:', output);
    } catch (error: any) {
        console.log('Exit code:', error.status);
        console.log('STDOUT length:', (error.stdout || '').length);
        console.log('STDERR length:', (error.stderr || '').length);
        console.log('\nSTDOUT sample:');
        console.log((error.stdout || '').split('\n').slice(0, 5).join('\n'));
        console.log('\nSTDERR sample:');
        console.log((error.stderr || '').split('\n').slice(0, 5).join('\n'));
    }
    
    // Test 2: Run detector
    console.log('\n\n2. Testing PythonTypeDetector:');
    const detector = new PythonTypeDetector(testDir);
    const issues = await detector.detect();
    console.log('Issues found:', issues.length);
    if (issues.length > 0) {
        issues.slice(0, 3).forEach(issue => {
            console.log(`- ${issue.severity}: ${issue.message} (${issue.file}:${issue.line})`);
        });
    }
}

debugMypy().catch(console.error);
