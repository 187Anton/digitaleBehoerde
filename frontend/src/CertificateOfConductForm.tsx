import { FormEvent, useState } from "react";
import type { CertificateOfConductInput } from "./api";

type Props = {
  isSubmitting: boolean;
  onSubmit: (data: CertificateOfConductInput) => Promise<void>;
};

const fieldStyle = { display: "block", margin: "6px 0 12px", width: "100%" };

export function CertificateOfConductForm({ isSubmitting, onSubmit }: Props): JSX.Element {
  const [form, setForm] = useState<CertificateOfConductInput>({
    purpose: "",
    deliveryType: "PRIVATE",
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
    <form onSubmit={handleSubmit} style={{ maxWidth: "520px", marginTop: "24px" }}>
      <label>
        Zweck des Führungszeugnisses
        <input
          value={form.purpose}
          onChange={(event) => update("purpose", event.target.value)}
          required
          maxLength={120}
          style={fieldStyle}
        />
      </label>

      <label>
        Zustellung
        <select
          value={form.deliveryType}
          onChange={(event) =>
            update("deliveryType", event.target.value as CertificateOfConductInput["deliveryType"])
          }
          required
          style={fieldStyle}
        >
          <option value="PRIVATE">An meine private Anschrift</option>
          <option value="AUTHORITY">Direkt an eine Behörde</option>
        </select>
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Antrag wird gesendet ..." : "Führungszeugnis beantragen"}
      </button>
    </form>
  );
}
