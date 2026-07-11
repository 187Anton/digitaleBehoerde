import { applicationDocumentUrl, type Application, type ApplicationStatus } from "./api";
import { ApplicationCommentThread } from "./ApplicationCommentThread";
import {
  applicationDocumentPreviewUrl,
  applicationDocumentUrl,
  type Application,
  type ApplicationDocument,
  type ApplicationStatus,
} from "./api";

type NextStatus = Exclude<ApplicationStatus, "SUBMITTED">;
type Props = {
  applications: Application[];
  isUpdating: boolean;
  onStatusChange: (applicationId: string, status: NextStatus) => Promise<void>;
  onComment: (applicationId: string, body: string) => Promise<boolean>;
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
const documentTypeLabels: Record<Application["documents"][number]["type"], string> = {
  OTHER: "Weiteres Dokument",
  IDENTITY_DOCUMENT: "Personalausweis",
  LANDLORD_CONFIRMATION: "Wohnungsgeberbestätigung",
  MOVE_IN_CONFIRMATION: "Einzugsbestätigung",
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

function documentPreview(
  applicationId: string,
  document: ApplicationDocument
): JSX.Element | null {
  const previewUrl = applicationDocumentPreviewUrl(applicationId, document.id);
  if (document.mimeType === "application/pdf") {
    return (
      <iframe
        className="document-preview document-preview-pdf"
        src={previewUrl}
        title={`Vorschau von ${document.originalName}`}
        loading="lazy"
      />
    );
  }
  if (document.mimeType === "image/jpeg" || document.mimeType === "image/png") {
    return (
      <img
        className="document-preview document-preview-image"
        src={previewUrl}
        alt={`Vorschau von ${document.originalName}`}
        loading="lazy"
      />
    );
  }
  return null;
}

export function CaseworkerApplications({
  applications,
  isUpdating,
  onStatusChange,
  onComment,
}: Props): JSX.Element {
  return (
    <section className="section stack">
      <div className="section-header">
        <div>
          <h2>Arbeitskorb</h2>
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
                <dt>Versandanschrift</dt>
                <dd>
                  {certificate.deliveryRecipient}, {certificate.deliveryStreet},{" "}
                  {certificate.deliveryPostalCode} {certificate.deliveryCity}
                </dd>
              </dl>
            ) : null}
            <h4>Dokumente</h4>
            {application.documents.length > 0 ? (
              <ul className="document-table">
                {application.documents.map((document) => (
                  <li className="document-row" key={document.id}>
                    <div className="doc-icon">{documentBadgeLabel(document.originalName)}</div>
                    <div>
                      <a
                        href={applicationDocumentUrl(application.id, document.id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {document.originalName}
                      </a>
                      <span>{documentTypeLabels[document.type]}</span>
                    </div>
                  <li className="document-preview-card" key={document.id}>
                    <div className="document-preview-header">
                      <div className="doc-icon">{documentBadgeLabel(document.originalName)}</div>
                      <div>
                        <strong>{document.originalName}</strong>
                        <a
                          href={applicationDocumentUrl(application.id, document.id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Herunterladen
                        </a>
                      </div>
                    </div>
                    {documentPreview(application.id, document) ?? (
                      <p>Für diesen Dateityp ist keine Vorschau verfügbar.</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Keine Dokumente vorhanden.</p>
            )}
            <ApplicationCommentThread
              comments={application.comments ?? []}
              canWrite
              isSubmitting={isUpdating}
              onSubmit={(body) => onComment(application.id, body)}
            />
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
