export default function Home() {
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>Leyu & Mahi Bot</h1>
      <p>Fan story submission bot is running.</p>
      <p>
        <a href="/dashboard">Story dashboard</a> ·{' '}
        <a href="/api/test-story">Insert test story</a>
      </p>
    </div>
  );
}
