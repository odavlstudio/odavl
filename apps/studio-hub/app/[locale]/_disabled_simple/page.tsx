export default function SimpleTestPage() {
  return (
    <div style={{
      padding: '40px',
      fontSize: '30px',
      color: 'white',
      backgroundColor: '#0070f3',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{fontSize: '60px', marginBottom: '20px'}}>
        ✅ ODAVL Studio v2.0
      </h1>
      <p style={{fontSize: '24px', marginBottom: '40px'}}>
        The page is rendering successfully!
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        maxWidth: '1200px'
      }}>
        <div style={{
          background: 'white',
          color: '#0070f3',
          padding: '30px',
          borderRadius: '10px'
        }}>
          <h2>Insight</h2>
          <p style={{fontSize: '16px'}}>ML-powered error detection</p>
        </div>
        <div style={{
          background: 'white',
          color: '#0070f3',
          padding: '30px',
          borderRadius: '10px'
        }}>
          <h2>Autopilot</h2>
          <p style={{fontSize: '16px'}}>Self-healing infrastructure</p>
        </div>
        <div style={{
          background: 'white',
          color: '#0070f3',
          padding: '30px',
          borderRadius: '10px'
        }}>
          <h2>Guardian</h2>
          <p style={{fontSize: '16px'}}>Pre-deploy testing</p>
        </div>
      </div>
    </div>
  );
}
