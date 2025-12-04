'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <div style={{ textAlign: 'center', maxWidth: '600px', color: '#fff' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#ef4444' }}>
          Something went wrong!
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '1.1rem' }}>
          An unexpected error occurred. Please try again.
        </p>
        <button onClick={reset} style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.75rem 2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
          Try Again
        </button>
      </div>
    </div>
  );
}
