import { FormEvent, useState } from "react";
import type { DogTaxInput } from "./api";

type Props = {
  isSubmitting: boolean;
  onSubmit: (data: DogTaxInput, document: File | null) => Promise<void>;
};

export function DogTaxForm({ isSubmitting, onSubmit }: Props): JSX.Element {
  const [form, setForm] = useState<DogTaxInput>({
    dogName: "",
    dogBreed: "",
    dogBirthDate: "",
    chipNumber: "",
    ownerStreet: "",
    ownerPostalCode: "",
    ownerCity: "",
    taxStartDate: "",
  });
  const [document, setDocument] = useState<File | null>(null);

  function update<K extends keyof DogTaxInput>(key: K, value: DogTaxInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: DogTaxInput = {
      dogName: form.dogName,
      ownerStreet: form.ownerStreet,
      ownerPostalCode: form.ownerPostalCode,
      ownerCity: form.ownerCity,
      taxStartDate: form.taxStartDate,
    };
    if (form.dogBreed) payload.dogBreed = form.dogBreed;
    if (form.dogBirthDate) payload.dogBirthDate = form.dogBirthDate;
    if (form.chipNumber) payload.chipNumber = form.chipNumber;
    await onSubmit(payload, document);
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <fieldset className="form-fieldset">
        <legend>Angaben zum Hund</legend>
        <div className="form-grid">
          <label className="field">
            Name des Hundes
            <input
              value={form.dogName}
              onChange={(event) => update("dogName", event.target.value)}
              required
              maxLength={120}
            />
          </label>
          <label className="field">
            Rasse (optional)
            <input
              value={form.dogBreed ?? ""}
              onChange={(event) => update("dogBreed", event.target.value)}
              maxLength={120}
            />
          </label>
          <label className="field">
            Geburtsdatum (optional)
            <input
              type="date"
              value={form.dogBirthDate ?? ""}
              onChange={(event) => update("dogBirthDate", event.target.value)}
            />
          </label>
          <label className="field">
            Chipnummer (optional, 15 Ziffern)
            <input
              value={form.chipNumber ?? ""}
              onChange={(event) => update("chipNumber", event.target.value)}
              inputMode="numeric"
              pattern="[0-9]{15}"
              maxLength={15}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-fieldset">
        <legend>Anschrift des Halters</legend>
        <div className="form-grid">
          <label className="field">
            Straße und Hausnummer
            <input
              value={form.ownerStreet}
              onChange={(event) => update("ownerStreet", event.target.value)}
              required
              maxLength={120}
            />
          </label>
          <label className="field">
            Postleitzahl
            <input
              value={form.ownerPostalCode}
              onChange={(event) => update("ownerPostalCode", event.target.value)}
              required
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
            />
          </label>
          <label className="field">
            Ort
            <input
              value={form.ownerCity}
              onChange={(event) => update("ownerCity", event.target.value)}
              required
              maxLength={120}
            />
          </label>
        </div>
      </fieldset>

      <label className="field">
        Gewünschter Steuerbeginn
        <input
          type="date"
          value={form.taxStartDate}
          onChange={(event) => update("taxStartDate", event.target.value)}
          required
        />
      </label>

      <label className="field upload-box">
        Nachweisdokument (optional, PDF, JPEG oder PNG, maximal 5 MB)
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={(event) => setDocument(event.target.files?.[0] ?? null)}
        />
      </label>

      <div className="button-row">
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Antrag wird gesendet ..." : "Hundesteuer anmelden"}
        </button>
      </div>
    </form>
  );
}
