// Lead capture form validation and submission
export async function captureEmail(email: string, source: string) {
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isValid) throw new Error('Invalid email');
  
  await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, source, timestamp: Date.now() })
  });
}
