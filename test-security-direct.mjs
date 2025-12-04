// Test Security Detector directly to debug EISDIR issue
import { SecurityDetector } from './odavl-studio/insight/core/dist/detector/security.js';

const workspacePath = 'C:/Users/sabou/dev/odavl';

console.log('🔍 Testing Security Detector...\n');

try {
    const detector = new SecurityDetector(workspacePath);
    const errors = await detector.detect();
    
    console.log(`✅ Success! Found ${errors.length} security issues\n`);
    
    if (errors.length > 0) {
        console.log('First 5 issues:');
        errors.slice(0, 5).forEach((err, i) => {
            console.log(`${i + 1}. ${err.type} - ${err.file}:${err.line || '?'}`);
            console.log(`   ${err.message}`);
        });
    }
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
}
