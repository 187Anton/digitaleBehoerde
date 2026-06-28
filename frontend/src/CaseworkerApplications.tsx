import { applicationDocumentUrl, type Application, type ApplicationStatus } from "./api";

type NextStatus = Exclude<ApplicationStatus, "SUBMITTED">;
type Props = {
  applications: Application[];
  isUpdating: boolean;
  onStatusChange: (applicationId: string, status: NextStatus) => Promise<void>;
};

const statusLabels: Record<ApplicationStatus, string> = {
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

const deliveryTypeLabels: Record<NonNullable<Application["certificateOfConduct"]>["deliveryType"], string> = {
  PRIVATE: "Private Anschrift",
  AUTHORITY: "Behörde",
};

const statusClassNames: Record<ApplicationStatus, string> = {
  SUBMITTED: "submitted",
  IN_REVIEW: "in-review",
  APPROVED: "approved",
  REJECTED: "rejected",
};

function statusClassName(status: ApplicationStatus): string {
  return `status-pill ${statusClassNames[status]}`;
}

function documentBadgeLabel(fileName: string): string {
  const extension = fileName.split(".").pop()?.trim().toUpperCase();
  return extension && extension.length <= 4 ? extension : "Datei";
}

export function CaseworkerApplications({
  applications,
  isUpdating,
  onStatusChange,
}: Props): JSX.Element {
  return (
    <section className="section stack">
      <div className="section-header">
        <div>
          <h2>Antragsbearbeitung</h2>
          <span>{applications.length} Anträge im Arbeitskorb</span>
        </div>
      </div>
      {applications.length === 0 ? <p className="muted">Keine Anträge vorhanden.</p> : null}
      {applications.map((application) => {
        const residence = application.residenceChange;
        const dogTax = application.dogTax;
        const certificate = application.certificateOfConduct;
        const citizenName = [application.user?.firstName, application.user?.lastName]
          .filter(Boolean)
          .join(" ");

        return (
          <article className="status-card caseworker-card" key={application.id}>
            <div className="status-card-head">
              <h3>{applicationTypeLabels[application.type]}</h3>
              <strong className={statusClassName(application.status)}>{statusLabels[application.status]}</strong>
            </div>
            <p>
              Antragsteller: {citizenName || application.user?.email || "Unbekannt"}
              {citizenName && application.user?.email ? ` (${application.user.email})` : ""}
            </p>
            <p>
              Eingereicht am {new Date(application.createdAt).toLocaleDateString("de-DE")}
            </p>
            {residence ? (
              <dl className="detail-list">
                <dt>Bisherige Anschrift</dt>
                <dd>
                  {residence.oldStreet}, {residence.oldPostalCode} {residence.oldCity}
                </dd>
                <dt>Neue Anschrift</dt>
                <dd>
                  {residence.newStreet}, {residence.newPostalCode} {residence.newCity}
                </dd>
                <dt>Einzugsdatum</dt>
                <dd>{new Date(residence.moveDate).toLocaleDateString("de-DE")}</dd>
                <dt>Umziehende Personen</dt>
                <dd>{residence.householdSize}</dd>
              </dl>
            ) : null}
            {dogTax ? (
              <dl className="detail-list">
                <dt>Hund</dt>
                <dd>
                  {dogTax.dogName}
                  {dogTax.dogBreed ? `, ${dogTax.dogBreed}` : ""}
                </dd>
                <dt>Halteranschrift</dt>
                <dd>
                  {dogTax.ownerStreet}, {dogTax.ownerPostalCode} {dogTax.ownerCity}
                </dd>
                <dt>Steuerbeginn</dt>
                <dd>{new Date(dogTax.taxStartDate).toLocaleDateString("de-DE")}</dd>
              </dl>
            ) : null}
            {certificate ? (
              <dl className="detail-list">
                <dt>Zweck</dt>
                <dd>{certificate.purpose}</dd>
                <dt>Zustellung</dt>
                <dd>{deliveryTypeLabels[certificate.deliveryType]}</dd>
              </dl>
            ) : null}
            <h4>Dokumente</h4>
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
              <p>Keine Dokumente vorhanden.</p>
            )}
            <div className="button-row">
              {application.status === "SUBMITTED" ? (
                <button
                  className="primary-button"
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onStatusChange(application.id, "IN_REVIEW")}
                >
                  Bearbeitung beginnen
                </button>
              ) : null}
              {application.status === "IN_REVIEW" ? (
                <>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onStatusChange(application.id, "APPROVED")}
                  >
                    Genehmigen
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onStatusChange(application.id, "REJECTED")}
                  >
                    Ablehnen
                  </button>
                </>
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}
