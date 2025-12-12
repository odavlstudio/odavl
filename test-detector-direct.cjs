// Direct detector test
const path = require('path');

async function testDetector() {
  try {
    // Import from bundled detector
    const { loadDetector } = require('@odavl-studio/insight-core/detector');
    
    console.log('✅ loadDetector imported');
    
    const detector = await loadDetector('typescript');
    console.log('✅ Detector loaded:', detector.constructor.name);
    
    // Try to analyze
    const workspaceRoot = process.cwd();
    console.log('Analyzing:', workspaceRoot);
    
    const results = await detector.analyze(workspaceRoot);
    console.log('✅ Analysis complete');
    console.log('Results:', Array.isArray(results) ? `${results.length} issues` : 'Not an array');
    
    if (results && results.length > 0) {
      console.log('Sample issue:', results[0]);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDetector();
