// Disable static generation - requires session context
export const dynamic = 'force-dynamic';

export default function HealthCheck() {
  return (
    <div style={{
      padding: '40px',
      backgroundColor: '#00ff00',
      fontSize: '30px',
      color: '#000'
    }}>
      <h1>✅ HEALTH CHECK - SERVER IS WORKING!</h1>
      <p>This page bypasses middleware and i18n.</p>
      <p>If you see this, Next.js is rendering correctly.</p>
    </div>
  );
}
