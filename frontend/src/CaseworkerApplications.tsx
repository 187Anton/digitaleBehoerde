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

export function CaseworkerApplications({
  applications,
  isUpdating,
  onStatusChange,
}: Props): JSX.Element {
  return (
    <section style={{ marginTop: "24px" }}>
      <h2>Antragsbearbeitung</h2>
      {applications.length === 0 ? <p>Keine Antraege vorhanden.</p> : null}
      {applications.map((application) => {
        const residence = application.residenceChange;
        const dogTax = application.dogTax;
        const certificate = application.certificateOfConduct;
        const citizenName = [application.user?.firstName, application.user?.lastName]
          .filter(Boolean)
          .join(" ");

        return (
          <article
            key={application.id}
            style={{ border: "1px solid #ccc", padding: "20px", marginBottom: "16px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
              <h3 style={{ marginTop: 0 }}>{applicationTypeLabels[application.type]}</h3>
              <strong>{statusLabels[application.status]}</strong>
            </div>
            <p>
              Antragsteller: {citizenName || application.user?.email || "Unbekannt"}
              {citizenName && application.user?.email ? ` (${application.user.email})` : ""}
            </p>
            <p>
              Eingereicht am {new Date(application.createdAt).toLocaleDateString("de-DE")}
            </p>
            {residence ? (
              <dl>
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
              <dl>
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
              <dl>
                <dt>Zweck</dt>
                <dd>{certificate.purpose}</dd>
                <dt>Zustellung</dt>
                <dd>{deliveryTypeLabels[certificate.deliveryType]}</dd>
              </dl>
            ) : null}
            <h4>Dokumente</h4>
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
              <p>Keine Dokumente vorhanden.</p>
            )}
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              {application.status === "SUBMITTED" ? (
                <button
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
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onStatusChange(application.id, "APPROVED")}
                  >
                    Genehmigen
                  </button>
                  <button
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
