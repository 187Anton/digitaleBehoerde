import { FormEvent, useEffect, useState } from "react";
import {
  Application,
  AuthResponse,
  ResidenceChangeInput,
  DogTaxInput,
  CertificateOfConductInput,
  ProfileUpdateInput,
  Service,
  addApplicationComment,
  applicationDocumentUrl,
  createResidenceChange,
  createDogTax,
  createCertificateOfConduct,
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
import { ProfileForm } from "./ProfileForm";
import { CertificateOfConductForm } from "./CertificateOfConductForm";
import { ApplicationCommentThread } from "./ApplicationCommentThread";
type Mode = "login" | "register";
type View = "catalog" | "service-detail" | "applications" | "profile";

const statusLabels: Record<Application["status"], string> = {
  SUBMITTED: "Eingereicht",
  IN_REVIEW: "In Bearbeitung",
  APPROVED: "Genehmigt",
  REJECTED: "Abgelehnt",
};
const applicationTypeLabels: Record<Application["type"], string> = {
  RESIDENCE_CHANGE: "Wohnsitz ummelden",
  DOG_TAX: "Hundesteuer anmelden",
  CERTIFICATE_OF_CONDUCT: "Führungszeugnis beantragen",
};
const serviceCategoryLabels: Record<Service["type"], string> = {
  RESIDENCE_CHANGE: "Meldewesen",
  DOG_TAX: "Kommunale Steuer",
  CERTIFICATE_OF_CONDUCT: "Bescheinigung",
};

const statusClassNames: Record<Application["status"], string> = {
  SUBMITTED: "submitted",
  IN_REVIEW: "in-review",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const viewTitles: Record<View, string> = {
  catalog: "Antragskatalog",
  "service-detail": "Antrag stellen",
  applications: "Meine Anträge",
  profile: "Mein Profil",
};

function statusClassName(status: Application["status"]): string {
  return `status-pill ${statusClassNames[status]}`;
}

function documentBadgeLabel(fileName: string): string {
  const extension = fileName.split(".").pop()?.trim().toUpperCase();
  return extension && extension.length <= 4 ? extension : "Datei";
}

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
  async function handleCertificateOfConduct(data: CertificateOfConductInput) {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await createCertificateOfConduct(data);
      setApplications((current) => [response.application, ...current]);
      setView("applications");
      setActiveService(null);
      setMessage("Führungszeugnis wurde erfolgreich beantragt.");
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
      setMessage(error instanceof Error ? error.message : "Status konnte nicht geändert werden.");
    } finally {
      setIsLoading(false);
    }
  }
  async function handleApplicationComment(applicationId: string, body: string): Promise<boolean> {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await addApplicationComment(applicationId, body);
      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                comments: [...(application.comments ?? []), response.comment],
              }
            : application
        )
      );
      setMessage("Kommentar wurde hinzugefügt.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kommentar konnte nicht gespeichert werden.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="brand">
            <div className="brand-mark">DB</div>
            <div>
              <strong>Digitale Behörde</strong>
              <span>Serviceportal</span>
            </div>
          </div>
          <div>
            <h2>{mode === "login" ? "Login" : "Registrierung"}</h2>
            <p>Mit Ihrem Konto können Sie Anträge digital einreichen und verfolgen.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <label className="field">
              E-Mail
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="field">
              Passwort
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {mode === "register" ? (
              <>
                <label className="field">
                  Vorname
                  <input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
                </label>
                <label className="field">
                  Nachname
                  <input value={lastName} onChange={(event) => setLastName(event.target.value)} />
                </label>
              </>
            ) : null}
            <button className="primary-button" type="submit" disabled={isLoading}>
              {mode === "login" ? "Einloggen" : "Registrieren"}
            </button>
          </form>
          <button
            className="ghost-button"
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Zur Registrierung" : "Zum Login"}
          </button>
          {message ? <div className="message-banner">{message}</div> : null}
        </section>
      </main>
    );
  }

  const topbarTitle = user.role === "CASEWORKER" ? "Antragsbearbeitung" : viewTitles[view];
  const completedApplications = applications.filter((application) => application.status === "APPROVED").length;
  const openApplications = applications.filter((application) => application.status !== "APPROVED").length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">DB</div>
          <div>
            <strong>Digitale Behörde</strong>
            <span>Serviceportal</span>
          </div>
        </div>
        {user.role === "CITIZEN" ? (
          <nav className="nav-list" aria-label="Hauptnavigation">
            <button
              className={`nav-item ${view === "catalog" || view === "service-detail" ? "active" : ""}`}
              type="button"
              onClick={backToCatalog}
            >
              Antragskatalog
            </button>
            <button
              className={`nav-item ${view === "applications" ? "active" : ""}`}
              type="button"
              onClick={() => setView("applications")}
            >
              Meine Anträge ({applications.length})
            </button>
            <button
              className={`nav-item ${view === "profile" ? "active" : ""}`}
              type="button"
              onClick={() => setView("profile")}
            >
              Mein Profil
            </button>
          </nav>
        ) : null}
        <div className="sidebar-note">
          <strong>{user.role === "CASEWORKER" ? "Sachbearbeitung" : "Bürgerkonto"}</strong>
          <p>{user.email}</p>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Digitale Behörde</span>
            <h1>{topbarTitle}</h1>
            <p>
              Angemeldet als {user.email} ({user.role})
            </p>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" type="button" onClick={handleLogout} disabled={isLoading}>
              Abmelden
            </button>
          </div>
        </header>

        <main className="page-frame stack">
          {message ? <div className="message-banner">{message}</div> : null}

          {user.role === "CITIZEN" && view === "catalog" ? (
            <>
              <section className="hero-panel">
                <div className="hero-copy">
                  <span className="eyebrow">Online-Serviceportal</span>
                  <h2>Online-Anträge starten</h2>
                  <p>Bitte wählen Sie einen Vorgang. Verfügbare Leistungen können direkt online eingereicht werden.</p>
                </div>
                <div className="hero-status">
                  <div className="metric">
                    <strong>{services.length}</strong>
                    <span>Vorgänge</span>
                  </div>
                  <div className="metric">
                    <strong>{applications.length}</strong>
                    <span>Meine Anträge</span>
                  </div>
                  <div className="metric">
                    <strong>{completedApplications}</strong>
                    <span>Genehmigt</span>
                  </div>
                </div>
              </section>

              <section className="section">
                <div className="section-header">
                  <div>
                    <h2>Verfügbare Vorgänge</h2>
                    <span>Starten Sie den passenden Online-Antrag.</span>
                  </div>
                </div>
                <ul className="service-grid">
                  {services.map((service) => (
                    <li
                      className={`service-card ${service.available ? "available" : "unavailable"}`}
                      key={service.type}
                      onClick={() => openService(service)}
                    >
                      <span className="service-kicker">{serviceCategoryLabels[service.type]}</span>
                      <div className="card-footer">
                        <h3>{service.title}</h3>
                        {service.available ? null : <span className="status-pill in-review">Bald verfügbar</span>}
                      </div>
                      <p>{service.description}</p>
                    </li>
                  ))}
                </ul>
                {services.length === 0 ? <p className="muted">Vorgänge werden geladen ...</p> : null}
              </section>
            </>
          ) : null}

          {user.role === "CITIZEN" && view === "service-detail" && activeService ? (
            <section className="section">
              <div className="detail-head">
                <div>
                  <h2>{activeService.title}</h2>
                  <p>{activeService.description}</p>
                </div>
                <button className="ghost-button" type="button" onClick={backToCatalog}>
                  Zurück zum Katalog
                </button>
              </div>
              {activeService.type === "RESIDENCE_CHANGE" ? (
                <ResidenceChangeForm isSubmitting={isLoading} onSubmit={handleResidenceChange} />
              ) : null}
              {activeService.type === "DOG_TAX" ? (
                <DogTaxForm isSubmitting={isLoading} onSubmit={handleDogTax} />
              ) : null}
              {activeService.type === "CERTIFICATE_OF_CONDUCT" ? (
                <CertificateOfConductForm isSubmitting={isLoading} onSubmit={handleCertificateOfConduct} />
              ) : null}
            </section>
          ) : null}

          {user.role === "CITIZEN" && view === "applications" ? (
            <section className="section">
              <div className="section-header">
                <div>
                  <h2>Antragsübersicht</h2>
                  <span>{openApplications} offen, {completedApplications} genehmigt</span>
                </div>
              </div>
              {applications.length === 0 ? <p className="muted">Noch keine Anträge eingereicht.</p> : null}
              <ul className="application-list">
                {applications.map((application) => (
                  <li className="application-row" key={application.id}>
                    <div>
                      <strong>{applicationTypeLabels[application.type]}</strong>
                      <p>
                        Eingereicht am {new Date(application.createdAt).toLocaleDateString("de-DE")}
                        {application.residenceChange
                          ? ` · Neue Anschrift: ${application.residenceChange.newStreet}, ${application.residenceChange.newPostalCode} ${application.residenceChange.newCity}`
                          : ""}
                        {application.dogTax
                          ? ` · Hund: ${application.dogTax.dogName}, Steuerbeginn ${new Date(application.dogTax.taxStartDate).toLocaleDateString("de-DE")}`
                          : ""}
                        {application.certificateOfConduct
                          ? ` · Zweck: ${application.certificateOfConduct.purpose}`
                          : ""}
                      </p>
                      {application.documents.length > 0 ? (
                        <ul className="document-table">
                          {application.documents.map((document) => (
                            <li className="document-row" key={document.id}>
                              <div className="doc-icon">{documentBadgeLabel(document.originalName)}</div>
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
                        <label className="field upload-box">
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
                          />
                        </label>
                      ) : null}
                      <ApplicationCommentThread comments={application.comments ?? []} />
                    </div>
                    <span className={statusClassName(application.status)}>{statusLabels[application.status]}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {user.role === "CITIZEN" && view === "profile" ? (
            <>
              <section className="profile-hero">
                <div className="avatar">{(user.firstName?.[0] ?? user.email[0]).toUpperCase()}</div>
                <div>
                  <span className="eyebrow">Bürgerkonto</span>
                  <h2>Stammdaten</h2>
                  <p>Diese Daten werden in Zukunft beim Ausfüllen von Anträgen vorgeschlagen.</p>
                </div>
              </section>
              <section className="section">
                <ProfileForm user={user} isSubmitting={isLoading} onSubmit={handleProfileUpdate} />
              </section>
            </>
          ) : null}

          {user.role === "CASEWORKER" ? (
            <CaseworkerApplications
              applications={applications}
              isUpdating={isLoading}
              onStatusChange={handleStatusChange}
              onComment={handleApplicationComment}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
export default App;
