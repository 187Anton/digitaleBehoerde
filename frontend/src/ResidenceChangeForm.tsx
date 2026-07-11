import { FormEvent, useState } from "react";
import type { ResidenceChangeInput } from "./api";

type Props = {
  isSubmitting: boolean;
  initialData?: ResidenceChangeInput;
  isEditing?: boolean;
  onSubmit: (data: ResidenceChangeInput, document: File | null) => Promise<void>;
};

export function ResidenceChangeForm({
  isSubmitting,
  initialData,
  isEditing = false,
  onSubmit,
}: Props): JSX.Element {
  const [form, setForm] = useState<ResidenceChangeInput>({
    moveDate: initialData?.moveDate.slice(0, 10) ?? "",
    oldStreet: initialData?.oldStreet ?? "",
    oldPostalCode: initialData?.oldPostalCode ?? "",
    oldCity: initialData?.oldCity ?? "",
    newStreet: initialData?.newStreet ?? "",
    newPostalCode: initialData?.newPostalCode ?? "",
    newCity: initialData?.newCity ?? "",
    householdSize: initialData?.householdSize ?? 1,
  });
  const [document, setDocument] = useState<File | null>(null);

  function update<K extends keyof ResidenceChangeInput>(key: K, value: ResidenceChangeInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(form, document);
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <label className="field">
        Einzugsdatum
        <input
          type="date"
          value={form.moveDate}
          onChange={(event) => update("moveDate", event.target.value)}
          required
        />
      </label>

      <fieldset className="form-fieldset">
        <legend>Bisherige Anschrift</legend>
        <div className="form-grid">
          <label className="field">
            Straße und Hausnummer
            <input
              value={form.oldStreet}
              onChange={(event) => update("oldStreet", event.target.value)}
              required
              maxLength={120}
            />
          </label>
          <label className="field">
            Postleitzahl
            <input
              value={form.oldPostalCode}
              onChange={(event) => update("oldPostalCode", event.target.value)}
              required
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
            />
          </label>
          <label className="field">
            Ort
            <input
              value={form.oldCity}
              onChange={(event) => update("oldCity", event.target.value)}
              required
              maxLength={120}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-fieldset">
        <legend>Neue Anschrift</legend>
        <div className="form-grid">
          <label className="field">
            Straße und Hausnummer
            <input
              value={form.newStreet}
              onChange={(event) => update("newStreet", event.target.value)}
              required
              maxLength={120}
            />
          </label>
          <label className="field">
            Postleitzahl
            <input
              value={form.newPostalCode}
              onChange={(event) => update("newPostalCode", event.target.value)}
              required
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
            />
          </label>
          <label className="field">
            Ort
            <input
              value={form.newCity}
              onChange={(event) => update("newCity", event.target.value)}
              required
              maxLength={120}
            />
          </label>
        </div>
      </fieldset>

      <label className="field">
        Anzahl umziehender Personen
        <input
          type="number"
          min={1}
          max={20}
          value={form.householdSize}
          onChange={(event) => update("householdSize", Number(event.target.value))}
          required
        />
      </label>

      {!isEditing ? (
        <label className="field upload-box">
          Nachweisdokument (PDF, JPEG oder PNG, maximal 5 MB)
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(event) => setDocument(event.target.files?.[0] ?? null)}
            required
          />
        </label>
      ) : null}

      <div className="button-row">
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Antrag wird gespeichert ..."
            : isEditing
              ? "Änderungen speichern"
              : "Wohnsitzummeldung absenden"}
        </button>
      </div>
    </form>
  );
}
