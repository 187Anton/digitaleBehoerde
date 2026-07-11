import { useMemo, useState } from "react";
import { ApplicationCommentThread } from "./ApplicationCommentThread";
import {
  applicationDocumentPreviewUrl,
  applicationDocumentUrl,
  type Application,
  type ApplicationDocument,
  type ApplicationStatus,
} from "./api";

type NextStatus = Exclude<ApplicationStatus, "SUBMITTED">;
type TypeFilter = "ALL" | Application["type"];
type StatusFilter = "ALL" | ApplicationStatus;
type SortMode = "OLDEST" | "NEWEST" | "STATUS";
type Props = {
  applications: Application[];
  isUpdating: boolean;
  onStatusChange: (applicationId: string, status: NextStatus) => Promise<void>;
  onOpenChat: (application: Application) => void;
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

const typeTabs: Array<{ value: TypeFilter; label: string }> = [
  { value: "ALL", label: "Alle" },
  { value: "RESIDENCE_CHANGE", label: "Wohnsitz" },
  { value: "DOG_TAX", label: "Hundesteuer" },
  { value: "CERTIFICATE_OF_CONDUCT", label: "Führungszeugnis" },
];

const statusSortOrder: Record<ApplicationStatus, number> = {
  SUBMITTED: 0,
  IN_REVIEW: 1,
  APPROVED: 2,
  REJECTED: 3,
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
  onOpenChat,
  onComment,
}: Props): JSX.Element {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("OLDEST");

  const visibleApplications = useMemo(() => {
    const filtered = applications.filter(
      (application) =>
        (typeFilter === "ALL" || application.type === typeFilter)
        && (statusFilter === "ALL" || application.status === statusFilter)
    );
    return filtered.sort((left, right) => {
      if (sortMode === "STATUS") {
        const statusDifference = statusSortOrder[left.status] - statusSortOrder[right.status];
        if (statusDifference !== 0) {
          return statusDifference;
        }
      }
      const dateDifference =
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      return sortMode === "NEWEST" ? -dateDifference : dateDifference;
    });
  }, [applications, sortMode, statusFilter, typeFilter]);

  return (
    <section className="section stack">
      <div className="section-header">
        <div>
          <h2>Arbeitskorb</h2>
          <span>
            {visibleApplications.length} von {applications.length} Anträgen angezeigt
          </span>
        </div>
      </div>
      <div className="filter-tabs" role="tablist" aria-label="Antragstyp auswählen">
        {typeTabs.map((tab) => {
          const count = tab.value === "ALL"
            ? applications.length
            : applications.filter((application) => application.type === tab.value).length;
          return (
            <button
              className={typeFilter === tab.value ? "active" : ""}
              type="button"
              role="tab"
              aria-selected={typeFilter === tab.value}
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>
      <div className="filter-toolbar">
        <label className="field">
          Status
          <select
            aria-label="Antragsstatus filtern"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="ALL">Alle Status</option>
            <option value="SUBMITTED">Eingereicht</option>
            <option value="IN_REVIEW">In Bearbeitung</option>
            <option value="APPROVED">Genehmigt</option>
            <option value="REJECTED">Abgelehnt</option>
          </select>
        </label>
        <label className="field">
          Sortierung
          <select
            aria-label="Anträge sortieren"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="OLDEST">Älteste zuerst</option>
            <option value="NEWEST">Neueste zuerst</option>
            <option value="STATUS">Nach Status</option>
          </select>
        </label>
      </div>
      {visibleApplications.length === 0 ? (
        <p className="muted">Keine Anträge für die gewählten Filter vorhanden.</p>
      ) : null}
      {visibleApplications.map((application) => {
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
              <button
                className="ghost-button"
                type="button"
                onClick={() => onOpenChat(application)}
              >
                Nachrichten ({application.unreadChatMessages ?? 0})
              </button>
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
