import { FormEvent, useState } from "react";
import type { CertificateOfConductInput } from "./api";

type Props = {
  isSubmitting: boolean;
  initialData?: CertificateOfConductInput;
  isEditing?: boolean;
  onSubmit: (data: CertificateOfConductInput) => Promise<void>;
};

export function CertificateOfConductForm({
  isSubmitting,
  initialData,
  isEditing = false,
  onSubmit,
}: Props): JSX.Element {
  const [form, setForm] = useState<CertificateOfConductInput>({
    purpose: initialData?.purpose ?? "",
    deliveryType: initialData?.deliveryType ?? "PRIVATE",
  });

  function update<K extends keyof CertificateOfConductInput>(
    key: K,
    value: CertificateOfConductInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <label className="field">
        Zweck des Führungszeugnisses
        <input
          value={form.purpose}
          onChange={(event) => update("purpose", event.target.value)}
          required
          maxLength={120}
        />
      </label>

      <label className="field">
        Zustellung
        <select
          value={form.deliveryType}
          onChange={(event) =>
            update("deliveryType", event.target.value as CertificateOfConductInput["deliveryType"])
          }
          required
        >
          <option value="PRIVATE">An meine private Anschrift</option>
          <option value="AUTHORITY">Direkt an eine Behörde</option>
        </select>
      </label>

      <div className="button-row">
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Antrag wird gespeichert ..."
            : isEditing
              ? "Änderungen speichern"
              : "Führungszeugnis beantragen"}
        </button>
      </div>
    </form>
  );
}
