// API endpoint for email capture
export async function POST(request: Request) {
  const { email, source } = await request.json();
  
  // Validate
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response('Invalid email', { status: 400 });
  }
  
  // Save to database
  await prisma.lead.create({
    data: { email, source, capturedAt: new Date() }
  });
  
  // Send welcome email
  await sendEmail(email, 'welcome');
  
  return new Response('OK', { status: 200 });
}
