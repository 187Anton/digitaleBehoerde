import { FormEvent, useState } from "react";
import type { AuthResponse, ProfileUpdateInput } from "./api";

type Props = {
  user: AuthResponse["user"];
  isSubmitting: boolean;
  onSubmit: (data: ProfileUpdateInput) => Promise<void>;
};

const fieldStyle = { display: "block", margin: "6px 0 12px", width: "100%" };

export function ProfileForm({ user, isSubmitting, onSubmit }: Props): JSX.Element {
  const [form, setForm] = useState({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    birthDate: user.birthDate ?? "",
    birthPlace: user.birthPlace ?? "",
    street: user.street ?? "",
    postalCode: user.postalCode ?? "",
    city: user.city ?? "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: ProfileUpdateInput = {};
    if (form.firstName) payload.firstName = form.firstName;
    if (form.lastName) payload.lastName = form.lastName;
    if (form.birthDate) payload.birthDate = form.birthDate;
    if (form.birthPlace) payload.birthPlace = form.birthPlace;
    if (form.street) payload.street = form.street;
    if (form.postalCode) payload.postalCode = form.postalCode;
    if (form.city) payload.city = form.city;
    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "520px", marginTop: "24px" }}>
      <fieldset style={{ margin: "20px 0", padding: "16px" }}>
        <legend>Persönliche Daten</legend>
        <label>
          Vorname
          <input
            value={form.firstName}
            onChange={(event) => update("firstName", event.target.value)}
            maxLength={120}
            style={fieldStyle}
          />
        </label>
        <label>
          Nachname
          <input
            value={form.lastName}
            onChange={(event) => update("lastName", event.target.value)}
            maxLength={120}
            style={fieldStyle}
          />
        </label>
        <label>
          Geburtsdatum
          <input
            type="date"
            value={form.birthDate}
            onChange={(event) => update("birthDate", event.target.value)}
            style={fieldStyle}
          />
        </label>
        <label>
          Geburtsort
          <input
            value={form.birthPlace}
            onChange={(event) => update("birthPlace", event.target.value)}
            maxLength={120}
            style={fieldStyle}
          />
        </label>
      </fieldset>

      <fieldset style={{ margin: "20px 0", padding: "16px" }}>
        <legend>Anschrift</legend>
        <label>
          Straße und Hausnummer
          <input
            value={form.street}
            onChange={(event) => update("street", event.target.value)}
            maxLength={120}
            style={fieldStyle}
          />
        </label>
        <label>
          Postleitzahl
          <input
            value={form.postalCode}
            onChange={(event) => update("postalCode", event.target.value)}
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            style={fieldStyle}
          />
        </label>
        <label>
          Ort
          <input
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
            maxLength={120}
            style={fieldStyle}
          />
        </label>
      </fieldset>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Wird gespeichert ..." : "Profil speichern"}
      </button>
    </form>
  );
}
