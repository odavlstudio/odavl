// Test detector loading from Brain's perspective
const { runBrainPipeline } = require('@odavl-studio/odavl-brain');

async function test() {
  try {
    const result = await runBrainPipeline({
      projectRoot: process.cwd(),
      detectors: ['typescript'], // Only one detector
      skipAutopilot: true,
      skipGuardian: true,
      verbose: false,
    });
    
    console.log('✅ Brain pipeline completed');
    console.log('Launch Score:', result.launchScore);
    console.log('Issues:', result.phases.insight?.totalIssues || 0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
