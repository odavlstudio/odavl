export default function NotFound() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem' }}>404</h1>
        <p style={{ fontSize: '1.5rem', color: '#94a3b8', marginBottom: '2rem' }}>Page Not Found</p>
        <a href="/" style={{ color: '#3b82f6', textDecoration: 'underline', fontSize: '1.1rem' }}>
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
