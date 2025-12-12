// A/B testing framework
export function getVariant(experimentId: string): 'A' | 'B' {
  const stored = localStorage.getItem(`exp_${experimentId}`);
  if (stored) return stored as 'A' | 'B';
  
  const variant = Math.random() < 0.5 ? 'A' : 'B';
  localStorage.setItem(`exp_${experimentId}`, variant);
  return variant;
}
