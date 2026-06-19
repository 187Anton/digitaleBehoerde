import type { Application, ApplicationStatus } from "./api";

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
        const citizenName = [application.user?.firstName, application.user?.lastName]
          .filter(Boolean)
          .join(" ");

        return (
          <article
            key={application.id}
            style={{ border: "1px solid #ccc", padding: "20px", marginBottom: "16px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
              <h3 style={{ marginTop: 0 }}>Wohnsitz ummelden</h3>
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
