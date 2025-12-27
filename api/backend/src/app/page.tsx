export default function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>SendikaApp Backend API</h1>
      <p>Backend service is running ✅</p>
      <div style={{ marginTop: '2rem' }}>
        <h3>Available Endpoints:</h3>
        <ul style={{ textAlign: 'left' }}>
          <li><code>GET /api/health</code> - Health check</li>
          <li><code>POST /api/auth/register/basic</code> - Basic registration</li>
          <li><code>POST /api/auth/register/details</code> - Detailed registration (requires auth)</li>
        </ul>
      </div>
    </div>
  )
}

