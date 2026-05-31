import { FormEvent, useEffect, useState } from "react";
import {
  AuthResponse,
  fetchCurrentUser,
  login,
  logout,
  register,
} from "./api";

type Mode = "login" | "register";

function App(): JSX.Element {
  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [email, setEmail] = useState("buerger@example.com");
  const [password, setPassword] = useState("password123");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCurrentUser()
      .then((response) => setUser(response.user))
      .catch(() => setUser(null));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response =
        mode === "login"
          ? await login({ email, password })
          : await register({ email, password, firstName, lastName });

      setUser(response.user);
      setMessage(mode === "login" ? "Erfolgreich angemeldet." : "Registrierung erfolgreich.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    setIsLoading(true);
    setMessage("");

    try {
      await logout();
      setUser(null);
      setMessage("Erfolgreich abgemeldet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Abmeldung fehlgeschlagen.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={{ fontFamily: "Arial, sans-serif", padding: "40px" }}>
      <h1>Digitale Behörde</h1>
      <p>Einfacher Login gegen das Backend.</p>

      {user ? (
        <section style={{ marginTop: "24px" }}>
          <h2>Angemeldet</h2>
          <p>
            {user.email} ({user.role})
          </p>
          <button type="button" onClick={handleLogout} disabled={isLoading}>
            Abmelden
          </button>
        </section>
      ) : (
        <section style={{ marginTop: "24px", maxWidth: "360px" }}>
          <h2>{mode === "login" ? "Login" : "Registrierung"}</h2>
          <form onSubmit={handleSubmit}>
            <label>
              E-Mail
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                style={{ display: "block", margin: "6px 0 12px", width: "100%" }}
              />
            </label>

            <label>
              Passwort
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                style={{ display: "block", margin: "6px 0 12px", width: "100%" }}
              />
            </label>

            {mode === "register" ? (
              <>
                <label>
                  Vorname
                  <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    style={{ display: "block", margin: "6px 0 12px", width: "100%" }}
                  />
                </label>
                <label>
                  Nachname
                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    style={{ display: "block", margin: "6px 0 12px", width: "100%" }}
                  />
                </label>
              </>
            ) : null}

            <button type="submit" disabled={isLoading}>
              {mode === "login" ? "Einloggen" : "Registrieren"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            style={{ marginTop: "12px" }}
          >
            {mode === "login" ? "Zur Registrierung" : "Zum Login"}
          </button>
        </section>
      )}

      {message ? <p style={{ marginTop: "16px" }}>{message}</p> : null}
    </main>
  );
}

export default App;
