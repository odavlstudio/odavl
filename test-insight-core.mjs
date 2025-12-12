// Test Insight Core ESM import from Brain context
import { loadDetector } from '@odavl-studio/insight-core/detector';

console.log('✅ loadDetector imported:', typeof loadDetector);

try {
  const detector = await loadDetector('typescript');
  console.log('✅ Detector loaded:', typeof detector.analyze);
  
  // Try to analyze current directory
  const results = await detector.analyze(process.cwd());
  console.log('✅ Analysis complete:', results?.length || 0, 'issues');
} catch (error) {
  console.error('❌ ERROR:', error.message);
  console.error('Stack:', error.stack);
}
