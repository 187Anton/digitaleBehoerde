import { applicationDocumentUrl, type Application } from "./api";

type Props = {
  applications: Application[];
};

const applicationTypeLabels: Record<Application["type"], string> = {
  RESIDENCE_CHANGE: "Wohnsitz ummelden",
  DOG_TAX: "Hundesteuer anmelden",
  CERTIFICATE_OF_CONDUCT: "Führungszeugnis beantragen",
};

function documentBadgeLabel(fileName: string): string {
  const extension = fileName.split(".").pop()?.trim().toUpperCase();
  return extension && extension.length <= 4 ? extension : "Datei";
}

export function CitizenDocuments({ applications }: Props): JSX.Element {
  const documents = applications.flatMap((application) =>
    application.documents.map((document) => ({ application, document }))
  );

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2>Dokumentenübersicht</h2>
          <span>{documents.length} hochgeladene Dokumente</span>
        </div>
      </div>

      {documents.length === 0 ? (
        <p className="muted">Sie haben noch keine Dokumente hochgeladen.</p>
      ) : (
        <ul className="document-table">
          {documents.map(({ application, document }) => (
            <li className="citizen-document-row" key={document.id}>
              <div className="doc-icon">{documentBadgeLabel(document.originalName)}</div>
              <div>
                <strong>{document.originalName}</strong>
                <span>
                  {applicationTypeLabels[application.type]} · Hochgeladen am{" "}
                  {new Date(document.uploadedAt).toLocaleDateString("de-DE")}
                </span>
              </div>
              <a
                className="file-button"
                href={applicationDocumentUrl(application.id, document.id)}
                target="_blank"
                rel="noreferrer"
              >
                Herunterladen
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
