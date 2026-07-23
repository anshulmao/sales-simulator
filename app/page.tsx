// PLACEHOLDER — this page belongs to the FRONTEND lane.
// The backend lane only added it so the dev server has a root route and the
// session endpoint is testable. Replace it with the real call UI.

export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 32, lineHeight: 1.5 }}>
      <h1>Twimbit Sales Simulator</h1>
      <p>Backend lane is live. The call UI belongs to the frontend lane.</p>
      <p>
        Session endpoint: <code>POST /api/session</code>
      </p>
    </main>
  );
}
