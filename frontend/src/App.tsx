import { FormEvent, useEffect, useState } from "react";
import {
  AuthResponse,
  Service,
  fetchCurrentUser,
  fetchServices,
  login,
  logout,
  register,
} from "./api";
type Mode = "login" | "register";
type View = "catalog" | "service-detail";
function App(): JSX.Element {
  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [email, setEmail] = useState("buerger@example.com");
  const [password, setPassword] = useState("password123");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<View>("catalog");
  const [services, setServices] = useState<Service[]>([]);
  const [activeService, setActiveService] = useState<Service | null>(null);
  useEffect(() => {
    fetchCurrentUser()
      .then((response) => setUser(response.user))
      .catch(() => setUser(null));
  }, []);
  useEffect(() => {
    if (!user) {
      return;
    }
    fetchServices()
      .then((response) => setServices(response.services))
      .catch(() => setServices([]));
  }, [user]);
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
      setView("catalog");
      setActiveService(null);
      setMessage("Erfolgreich abgemeldet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Abmeldung fehlgeschlagen.");
    } finally {
      setIsLoading(false);
    }
  }
  function openService(service: Service) {
    if (!service.available) {
      return;
    }
    setActiveService(service);
    setView("service-detail");
  }
  function backToCatalog() {
    setActiveService(null);
    setView("catalog");
  }
  return (
    <main style={{ fontFamily: "Arial, sans-serif", padding: "40px" }}>
      <h1>Digitale Behörde</h1>
      {user ? (
        <section style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0 }}>
              Angemeldet als {user.email} ({user.role})
            </p>
            <button type="button" onClick={handleLogout} disabled={isLoading}>
              Abmelden
            </button>
          </div>
          {view === "catalog" ? (
            <section style={{ marginTop: "24px" }}>
              <h2>Antragskatalog</h2>
              <p>Bitte waehlen Sie einen Vorgang.</p>
              <ul style={{ listStyle: "none", padding: 0, marginTop: "16px" }}>
                {services.map((service) => (
                  <li
                    key={service.type}
                    onClick={() => openService(service)}
                    style={{
                      border: "1px solid #ccc",
                      padding: "16px",
                      marginBottom: "12px",
                      cursor: service.available ? "pointer" : "not-allowed",
                      opacity: service.available ? 1 : 0.55,
                      background: service.available ? "#fff" : "#f5f5f5",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ margin: 0 }}>{service.title}</h3>
                      {service.available ? null : (
                        <span style={{ fontSize: "12px", color: "#666" }}>Bald verfuegbar</span>
                      )}
                    </div>
                    <p style={{ margin: "8px 0 0", color: "#444" }}>{service.description}</p>
                  </li>
                ))}
              </ul>
              {services.length === 0 ? <p>Vorgaenge werden geladen ...</p> : null}
            </section>
          ) : null}
          {view === "service-detail" && activeService ? (
            <section style={{ marginTop: "24px" }}>
              <button type="button" onClick={backToCatalog} style={{ marginBottom: "16px" }}>
                Zurueck zum Katalog
              </button>
              <h2>{activeService.title}</h2>
              <p>{activeService.description}</p>
              <p style={{ marginTop: "24px", color: "#666" }}>
                Das Antragsformular folgt im naechsten Feature.
              </p>
            </section>
          ) : null}
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