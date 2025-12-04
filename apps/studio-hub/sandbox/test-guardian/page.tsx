import type { Metadata } from 'next';

// Disable static generation - requires session context
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Test Guardian - ODAVL Studio | Live Quality Testing Demo',
  description: 'Interactive demonstration of ODAVL Guardian testing capabilities including accessibility, SEO, performance, and security analysis. Explore our three products: Insight (ML error detection), Autopilot (self-healing), and Guardian (quality assurance) - all designed for autonomous code quality improvement.',
  openGraph: {
    title: 'Test Guardian - ODAVL Studio | Live Quality Testing Demo',
    description: 'Interactive demonstration of ODAVL Guardian testing capabilities including accessibility, SEO, performance, and security analysis. Explore our ML-powered products for autonomous code quality.',
    url: 'https://studio.odavl.com/test-guardian',
    siteName: 'ODAVL Studio',
    images: [
      {
        url: '/og-test-guardian.png',
        width: 1200,
        height: 630,
        alt: 'ODAVL Guardian Testing Demo'
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Test Guardian - ODAVL Studio | Live Quality Testing Demo',
    description: 'Interactive demonstration of ODAVL Guardian testing capabilities including accessibility, SEO, performance, and security analysis.',
    images: ['/og-test-guardian.png'],
  },
  alternates: {
    canonical: 'https://studio.odavl.com/test-guardian',
  },
};

export default function TestGuardianPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🛡️ ODAVL Guardian Test Page</h1>        <div style={{ marginTop: '2rem' }}>
          <h2>ODAVL Studio Products</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem' }}>
              <h3>🔍 ODAVL Insight</h3>
              <p>ML-powered error detection with 12 specialized detectors</p>
              <button style={{ marginTop: '1rem', minHeight: '56px', lineHeight: '56px', padding: '16px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Learn More
              </button>
            </div>
            
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem' }}>
              <h3>🤖 ODAVL Autopilot</h3>
              <p>Self-healing code infrastructure with O-D-A-V-L cycle</p>
              <button style={{ marginTop: '1rem', minHeight: '56px', lineHeight: '56px', padding: '16px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Learn More
              </button>
            </div>
            
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem' }}>
              <h3>🛡️ ODAVL Guardian</h3>
              <p>Pre-deploy testing with 9 detectors for quality assurance</p>
              <button style={{ marginTop: '1rem', minHeight: '56px', lineHeight: '56px', padding: '16px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Learn More
              </button>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h2>Features</h2>
          <ul>
            <li>🚀 Real-time code quality analysis</li>
            <li>🔒 Security vulnerability detection</li>
            <li>♿ Accessibility compliance checking</li>
            <li>📊 SEO optimization recommendations</li>
            <li>📱 Mobile responsiveness validation</li>
            <li>⚡ Performance monitoring</li>
          </ul>
        </div>
        
        <form style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Contact Us</h3>
          <div style={{ marginTop: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Email:
            </label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label htmlFor="message" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Message:
            </label>
            <textarea
              id="message"
              rows={4}
              placeholder="Your message..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <button type="submit" style={{ marginTop: '1rem', minHeight: '56px', lineHeight: '56px', padding: '16px 24px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Send Message
          </button>
        </form>
        
        <footer style={{ marginTop: '3rem', padding: '2rem 0', borderTop: '1px solid #ddd', textAlign: 'center' }}>
          <p>© 2025 ODAVL Studio. All rights reserved.</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
            Built with ❤️ for developers worldwide
          </p>
        </footer>
      </div>
  );
}
