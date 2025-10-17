export function generateAdvice(metrics: any, policies: any): string {
    if (metrics.riskScore > 50) return '⚠️ High risk detected, review gates failing frequently.';
    if (metrics.verifyDuration > 5000) return '💡 Optimize verification phase for faster builds.';
    return '✅ All systems healthy.';
}
