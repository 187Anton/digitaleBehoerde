import { FormEvent, useEffect, useState } from "react";
import {
  Application,
  AuthResponse,
  ResidenceChangeInput,
  DogTaxInput,
  Service,
  applicationDocumentUrl,
  createResidenceChange,
  createDogTax,
  fetchApplications,
  fetchCaseworkerApplications,
  updateProfile,
  fetchCurrentUser,
  fetchServices,
  login,
  logout,
  register,
  updateApplicationStatus,
  uploadApplicationDocument,
} from "./api";
import { CaseworkerApplications } from "./CaseworkerApplications";
import { ResidenceChangeForm } from "./ResidenceChangeForm";
import { DogTaxForm } from "./DogTaxForm";
type Mode = "login" | "register";
type View = "catalog" | "service-detail" | "applications" | "profile";

const statusLabels: Record<Application["status"], string> = {
  SUBMITTED: "Eingereicht",
  IN_REVIEW: "In Bearbeitung",
  APPROVED: "Genehmigt",
  REJECTED: "Abgelehnt",
};
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
  const [applications, setApplications] = useState<Application[]>([]);
  useEffect(() => {
    fetchCurrentUser()
      .then((response) => setUser(response.user))
      .catch(() => setUser(null));
  }, []);
  useEffect(() => {
    if (!user) {
      return;
    }
    if (user.role === "CASEWORKER") {
      fetchCaseworkerApplications()
        .then((response) => setApplications(response.applications))
        .catch(() => setApplications([]));
      return;
    }
    Promise.all([fetchServices(), fetchApplications()])
      .then(([servicesResponse, applicationsResponse]) => {
        setServices(servicesResponse.services);
        setApplications(applicationsResponse.applications);
      })
      .catch(() => {
        setServices([]);
        setApplications([]);
      });
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
      setApplications([]);
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
  async function handleResidenceChange(data: ResidenceChangeInput, document: File) {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await createResidenceChange(data);
      try {
        const uploadResponse = await uploadApplicationDocument(response.application.id, document);
        response.application.documents = [uploadResponse.document];
      } catch (error) {
        setApplications((current) => [response.application, ...current]);
        setView("applications");
        setActiveService(null);
        setMessage(
          `Antrag wurde angelegt, aber das Dokument fehlt: ${
            error instanceof Error ? error.message : "Upload fehlgeschlagen."
          }`
        );
        return;
      }
      setApplications((current) => [response.application, ...current]);
      setView("applications");
      setActiveService(null);
      setMessage("Wohnsitzummeldung wurde erfolgreich eingereicht.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Antrag konnte nicht gesendet werden.");
    } finally {
      setIsLoading(false);
    }
  }
  async function handleDogTax(data: DogTaxInput, document: File | null) {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await createDogTax(data);
      if (document) {
        try {
          const uploadResponse = await uploadApplicationDocument(response.application.id, document);
          response.application.documents = [uploadResponse.document];
        } catch (error) {
          setApplications((current) => [response.application, ...current]);
          setView("applications");
          setActiveService(null);
          setMessage(
            `Antrag wurde angelegt, aber das Dokument fehlt: ${
              error instanceof Error ? error.message : "Upload fehlgeschlagen."
            }`
          );
          return;
        }
      }
      setApplications((current) => [response.application, ...current]);
      setView("applications");
      setActiveService(null);
      setMessage("Hundesteuer wurde erfolgreich angemeldet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Antrag konnte nicht gesendet werden.");
    } finally {
      setIsLoading(false);
    }
  }
  async function handleDocumentUpload(applicationId: string, file: File) {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await uploadApplicationDocument(applicationId, file);
      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? { ...application, documents: [...application.documents, response.document] }
            : application
        )
      );
      setMessage("Dokument wurde hochgeladen.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Dokument konnte nicht hochgeladen werden.");
    } finally {
      setIsLoading(false);
    }
  }
  async function handleProfileUpdate(data: ProfileUpdateInput) {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await updateProfile(data);
      setUser(response.user);
      setMessage("Profil wurde gespeichert.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profil konnte nicht gespeichert werden.");
    } finally {
      setIsLoading(false);
    }
  }

    async function handleStatusChange(
    applicationId: string,
    status: "IN_REVIEW" | "APPROVED" | "REJECTED"
  ) {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await updateApplicationStatus(applicationId, status);
      setApplications((current) =>
        current.map((application) =>
          application.id === response.application.id ? response.application : application
        )
      );
      setMessage("Antragsstatus wurde aktualisiert.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status konnte nicht geaendert werden.");
    } finally {
      setIsLoading(false);
    }
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
          {user.role === "CITIZEN" ? (
            <nav style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button type="button" onClick={backToCatalog}>
                Antragskatalog
              </button>
              <button type="button" onClick={() => setView("applications")}>
                Meine Antraege ({applications.length})
              </button>
              <button type="button" onClick={() => setView("profile")}>
                Mein Profil
              </button>
            </nav>
          ) : null}
          {user.role === "CITIZEN" && view === "catalog" ? (
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
          {user.role === "CITIZEN" && view === "service-detail" && activeService ? (
            <section style={{ marginTop: "24px" }}>
              <button type="button" onClick={backToCatalog} style={{ marginBottom: "16px" }}>
                Zurueck zum Katalog
              </button>
              <h2>{activeService.title}</h2>
              <p>{activeService.description}</p>
              {activeService.type === "RESIDENCE_CHANGE" ? (
                <ResidenceChangeForm
                  isSubmitting={isLoading}
                  onSubmit={handleResidenceChange}
                />
              ) : null}
              {activeService.type === "DOG_TAX" ? (
                <DogTaxForm
                  isSubmitting={isLoading}
                  onSubmit={handleDogTax}
                />
              ) : null}
            </section>
          ) : null}
          {user.role === "CITIZEN" && view === "applications" ? (
            <section style={{ marginTop: "24px" }}>
              <h2>Meine Antraege</h2>
              {applications.length === 0 ? <p>Noch keine Antraege eingereicht.</p> : null}
              <ul style={{ listStyle: "none", padding: 0 }}>
                {applications.map((application) => (
                  <li
                    key={application.id}
                    style={{ border: "1px solid #ccc", padding: "16px", marginBottom: "12px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                      <strong>
                        {application.type === "RESIDENCE_CHANGE" ? "Wohnsitz ummelden" : "Hundesteuer anmelden"}
                      </strong>
                      <span>{statusLabels[application.status]}</span>
                    </div>
                    <p style={{ marginBottom: 0, color: "#555" }}>
                      Eingereicht am {new Date(application.createdAt).toLocaleDateString("de-DE")}
                      {application.residenceChange
                        ? ` · Neue Anschrift: ${application.residenceChange.newStreet}, ${application.residenceChange.newPostalCode} ${application.residenceChange.newCity}`
                        : ""}
                      {application.dogTax
                        ? ` · Hund: ${application.dogTax.dogName}, Steuerbeginn ${new Date(application.dogTax.taxStartDate).toLocaleDateString("de-DE")}`
                        : ""}
                    </p>
                    {application.documents.length > 0 ? (
                      <ul>
                        {application.documents.map((document) => (
                          <li key={document.id}>
                            <a
                              href={applicationDocumentUrl(application.id, document.id)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {document.originalName}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Kein Dokument vorhanden.</p>
                    )}
                    {application.status === "SUBMITTED" ? (
                      <label>
                        Weiteres Dokument hochladen
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          disabled={isLoading}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void handleDocumentUpload(application.id, file);
                            }
                            event.target.value = "";
                          }}
                          style={{ display: "block", marginTop: "6px" }}
                        />
                      </label>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {user.role === "CITIZEN" && view === "profile" ? (
            <section style={{ marginTop: "24px" }}>
              <h2>Mein Profil</h2>
              <p>Diese Daten werden in Zukunft beim Ausfüllen von Anträgen vorgeschlagen.</p>
              <ProfileForm
                user={user}
                isSubmitting={isLoading}
                onSubmit={handleProfileUpdate}
              />
            </section>
          ) : null}
          {user.role === "CASEWORKER" ? (
            <CaseworkerApplications
              applications={applications}
              isUpdating={isLoading}
              onStatusChange={handleStatusChange}
            />
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
