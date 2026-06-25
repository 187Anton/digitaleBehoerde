import { FormEvent, useState } from "react";
import type { DogTaxInput } from "./api";

type Props = {
  isSubmitting: boolean;
  onSubmit: (data: DogTaxInput, document: File | null) => Promise<void>;
};

const fieldStyle = { display: "block", margin: "6px 0 12px", width: "100%" };

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
    <form onSubmit={handleSubmit} style={{ maxWidth: "520px", marginTop: "24px" }}>
      <fieldset style={{ margin: "20px 0", padding: "16px" }}>
        <legend>Angaben zum Hund</legend>
        <label>
          Name des Hundes
          <input
            value={form.dogName}
            onChange={(event) => update("dogName", event.target.value)}
            required
            maxLength={120}
            style={fieldStyle}
          />
        </label>
        <label>
          Rasse (optional)
          <input
            value={form.dogBreed ?? ""}
            onChange={(event) => update("dogBreed", event.target.value)}
            maxLength={120}
            style={fieldStyle}
          />
        </label>
        <label>
          Geburtsdatum (optional)
          <input
            type="date"
            value={form.dogBirthDate ?? ""}
            onChange={(event) => update("dogBirthDate", event.target.value)}
            style={fieldStyle}
          />
        </label>
        <label>
          Chipnummer (optional, 15 Ziffern)
          <input
            value={form.chipNumber ?? ""}
            onChange={(event) => update("chipNumber", event.target.value)}
            inputMode="numeric"
            pattern="[0-9]{15}"
            maxLength={15}
            style={fieldStyle}
          />
        </label>
      </fieldset>

      <fieldset style={{ margin: "20px 0", padding: "16px" }}>
        <legend>Anschrift des Halters</legend>
        <label>
          Straße und Hausnummer
          <input
            value={form.ownerStreet}
            onChange={(event) => update("ownerStreet", event.target.value)}
            required
            maxLength={120}
            style={fieldStyle}
          />
        </label>
        <label>
          Postleitzahl
          <input
            value={form.ownerPostalCode}
            onChange={(event) => update("ownerPostalCode", event.target.value)}
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
            value={form.ownerCity}
            onChange={(event) => update("ownerCity", event.target.value)}
            required
            maxLength={120}
            style={fieldStyle}
          />
        </label>
      </fieldset>

      <label>
        Gewünschter Steuerbeginn
        <input
          type="date"
          value={form.taxStartDate}
          onChange={(event) => update("taxStartDate", event.target.value)}
          required
          style={fieldStyle}
        />
      </label>

      <label>
        Nachweisdokument (optional, PDF, JPEG oder PNG, maximal 5 MB)
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={(event) => setDocument(event.target.files?.[0] ?? null)}
          style={fieldStyle}
        />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Antrag wird gesendet ..." : "Hundesteuer anmelden"}
      </button>
    </form>
  );
}
