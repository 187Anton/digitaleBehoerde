import { FormEvent, useState } from "react";
import type { AuthResponse, ProfileUpdateInput } from "./api";

type Props = {
  user: AuthResponse["user"];
  isSubmitting: boolean;
  onSubmit: (data: ProfileUpdateInput) => Promise<void>;
};

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
    <form className="form-panel" onSubmit={handleSubmit}>
      <fieldset className="form-fieldset">
        <legend>Persönliche Daten</legend>
        <div className="form-grid">
          <label className="field">
            Vorname
            <input
              value={form.firstName}
              onChange={(event) => update("firstName", event.target.value)}
              maxLength={120}
            />
          </label>
          <label className="field">
            Nachname
            <input
              value={form.lastName}
              onChange={(event) => update("lastName", event.target.value)}
              maxLength={120}
            />
          </label>
          <label className="field">
            Geburtsdatum
            <input
              type="date"
              value={form.birthDate}
              onChange={(event) => update("birthDate", event.target.value)}
            />
          </label>
          <label className="field">
            Geburtsort
            <input
              value={form.birthPlace}
              onChange={(event) => update("birthPlace", event.target.value)}
              maxLength={120}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-fieldset">
        <legend>Anschrift</legend>
        <div className="form-grid">
          <label className="field">
            Straße und Hausnummer
            <input
              value={form.street}
              onChange={(event) => update("street", event.target.value)}
              maxLength={120}
            />
          </label>
          <label className="field">
            Postleitzahl
            <input
              value={form.postalCode}
              onChange={(event) => update("postalCode", event.target.value)}
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
            />
          </label>
          <label className="field">
            Ort
            <input
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
              maxLength={120}
            />
          </label>
        </div>
      </fieldset>

      <div className="button-row">
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Wird gespeichert ..." : "Profil speichern"}
        </button>
      </div>
    </form>
  );
}
