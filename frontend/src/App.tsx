function App(): JSX.Element {
  return (
    <main style={{ fontFamily: "Arial, sans-serif", padding: "40px" }}>
      <h1>Digitale Behörde</h1>
      <p>Frontend läuft erfolgreich.</p>
      <p>Wenn du diesen Text siehst, funktioniert React im Docker-Container.</p>

      <section style={{ marginTop: "24px" }}>
        <h2>Systemstatus</h2>
        <p>
          Backend-Test:{" "}
          <a href="http://localhost:3001/api/health" target="_blank" rel="noreferrer">
            /api/health öffnen
          </a>
        </p>
      </section>
    </main>
  );
}

export default App;
