// ODAVL-WAVE-X5: AI Self-Test - Minimal Validation
import { aiBrain } from '../../../config/ai/ai.brain.compact';
import { aiRecommender } from '../../../config/ai/ai.recommender';
import { aiDashboard } from '../../../config/ai/ai.dashboard';

export function runAITest(): { status: 'pass' | 'fail'; results: string[] } {
  const results: string[] = [];
  let status: 'pass' | 'fail' = 'pass';

  try {
    // Test brain inference
    const context = aiBrain.inferContext('test-session');
    results.push(`✅ Brain: Persona=${context.persona}, Confidence=${context.confidence}`);

    // Test recommender
    const cta = aiRecommender.generateCTA(context);
    results.push(`✅ CTA: "${cta.text}" (${cta.priority} priority, ${cta.confidence} confidence)`);

    // Test dashboard
    const insights = aiDashboard.generateInsights();
    results.push(`✅ Dashboard: ${insights.totalSessions} sessions tracked`);
    
    results.push('🎯 AI Self-Test PASSED - All systems operational');
  } catch (error) {
    status = 'fail';
    results.push(`❌ AI Self-Test FAILED: ${error}`);
  }

  return { status, results };
}

// Auto-run test on import in development
if (process.env.NODE_ENV === 'development') {
  console.log('🤖 ODAVL WAVE X-5 AI Self-Test Results:');
  const { results } = runAITest();
  results.forEach(result => console.log(result));
}