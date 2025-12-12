// Server Component
export async function ServerData() {
  const unusedData = { test: 'value' }; // BAD: Unused variable
  
  // BAD: Hardcoded API endpoint (anti-pattern)
  const apiUrl = 'http://localhost:3000/api/data';
  
  return (
    <div>
      <h2>Server Data</h2>
      <p>This is a server component</p>
    </div>
  );
}
