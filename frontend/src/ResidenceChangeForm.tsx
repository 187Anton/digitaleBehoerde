import { FormEvent, useState } from "react";
import type { ResidenceChangeInput } from "./api";

type Props = {
  isSubmitting: boolean;
  onSubmit: (data: ResidenceChangeInput, document: File) => Promise<void>;
};

const fieldStyle = { display: "block", margin: "6px 0 12px", width: "100%" };

export function ResidenceChangeForm({ isSubmitting, onSubmit }: Props): JSX.Element {
  const [form, setForm] = useState<ResidenceChangeInput>({
    moveDate: "",
    oldStreet: "",
    oldPostalCode: "",
    oldCity: "",
    newStreet: "",
    newPostalCode: "",
    newCity: "",
    householdSize: 1,
  });
  const [document, setDocument] = useState<File | null>(null);

  function update<K extends keyof ResidenceChangeInput>(key: K, value: ResidenceChangeInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (document) {
      await onSubmit(form, document);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "520px", marginTop: "24px" }}>
      <label>
        Einzugsdatum
        <input
          type="date"
          value={form.moveDate}
          onChange={(event) => update("moveDate", event.target.value)}
          required
          style={fieldStyle}
        />
      </label>

      <fieldset style={{ margin: "20px 0", padding: "16px" }}>
        <legend>Bisherige Anschrift</legend>
        <label>
          Strasse und Hausnummer
          <input
            value={form.oldStreet}
            onChange={(event) => update("oldStreet", event.target.value)}
            required
            maxLength={120}
            style={fieldStyle}
          />
        </label>
        <label>
          Postleitzahl
          <input
            value={form.oldPostalCode}
            onChange={(event) => update("oldPostalCode", event.target.value)}
            required
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            style={fieldStyle}
          />
        </label>
        <label>
          Ort
          <input
            value={form.oldCity}
            onChange={(event) => update("oldCity", event.target.value)}
            required
            maxLength={120}
            style={fieldStyle}
          />
        </label>
      </fieldset>

      <fieldset style={{ margin: "20px 0", padding: "16px" }}>
        <legend>Neue Anschrift</legend>
        <label>
          Strasse und Hausnummer
          <input
            value={form.newStreet}
            onChange={(event) => update("newStreet", event.target.value)}
            required
            maxLength={120}
            style={fieldStyle}
          />
        </label>
        <label>
          Postleitzahl
          <input
            value={form.newPostalCode}
            onChange={(event) => update("newPostalCode", event.target.value)}
            required
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            style={fieldStyle}
          />
        </label>
        <label>
          Ort
          <input
            value={form.newCity}
            onChange={(event) => update("newCity", event.target.value)}
            required
            maxLength={120}
            style={fieldStyle}
          />
        </label>
      </fieldset>

      <label>
        Anzahl umziehender Personen
        <input
          type="number"
          min={1}
          max={20}
          value={form.householdSize}
          onChange={(event) => update("householdSize", Number(event.target.value))}
          required
          style={fieldStyle}
        />
      </label>

      <label>
        Nachweisdokument (PDF, JPEG oder PNG, maximal 5 MB)
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={(event) => setDocument(event.target.files?.[0] ?? null)}
          required
          style={fieldStyle}
        />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Antrag wird gesendet ..." : "Wohnsitzummeldung absenden"}
      </button>
    </form>
  );
}
