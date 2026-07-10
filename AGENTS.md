# AGENTS.md

## Zweck und Geltungsbereich

Diese Datei gilt für das gesamte Repository. Sie beschreibt den aktuellen Stand und die Arbeitsregeln für weitere Änderungen. Bei Widersprüchen sind ausführbarer Code, Tests und Konfiguration maßgeblich; Dokumentation ist anschließend zu korrigieren.

## Projektüberblick

Die Anwendung ist ein deutschsprachiges Serviceportal für digitale Behördengänge. Bürger können sich registrieren, ihr Profil pflegen, Anträge einreichen, Dokumente hochladen und den Bearbeitungsstatus sehen. Sachbearbeiter sehen alle Anträge und führen erlaubte Statuswechsel aus.

Aktuell unterstützte Vorgänge:

- Wohnsitzummeldung (`RESIDENCE_CHANGE`)
- Hundesteuer (`DOG_TAX`)
- Führungszeugnis (`CERTIFICATE_OF_CONDUCT`)

Technik:

- Frontend: React 18, TypeScript, Vite, CSS; Auslieferung über nginx
- Backend: Node.js 20, Express, TypeScript (strict, ESM), Zod
- Datenhaltung: PostgreSQL 16, Prisma 5
- Authentifizierung: JWT in einem HTTP-only Cookie
- Dokumente: lokal im Development, Azure Blob Storage in der Deployment-Umgebung
- Tests: Vitest/Supertest und Playwright
- Betrieb: Docker Compose, Prometheus, Azure Container Apps via GitHub Actions

## Repository-Struktur

- `frontend/src/`: React-Anwendung, Formulare, API-Client und globale Styles
- `frontend/e2e/`: Playwright-End-to-End-Tests und Fixtures
- `backend/src/app.ts`: Express-App, Middleware, Router und Fehlerbehandlung
- `backend/src/routes/`: HTTP-Endpunkte nach Fachbereich
- `backend/src/schemas/`: Zod-Schemas und Eingabevalidierung
- `backend/src/lib/`: Prisma, Auth, Upload/Storage, Metriken und Environment
- `backend/src/middleware/`: Authentifizierung und Rollenprüfung
- `backend/tests/`: Unit- und Integrationstests
- `backend/prisma/schema.prisma`: Datenmodell und Enums
- `backend/prisma/migrations/`: unveränderliche, versionierte SQL-Migrationen
- `backend/prisma/seed.ts`: idempotente Demo-Benutzer
- `monitoring/`: Prometheus-Konfiguration und Alarmregeln
- `docs/monitoring.md`: Metriken und Incident-Ablauf
- `.github/workflows/deploy.yml`: vollständige CI-/Deployment-Pipeline
- `docker-compose.yml`: lokaler Full-Stack-Betrieb

## Lokales Setup

Voraussetzungen: Docker mit Compose sowie Node.js 20 und npm für Entwicklung außerhalb der Container.

Einfachster Full-Stack-Start:

```bash
docker compose up --build -d
docker compose exec backend npx prisma db seed
```

Danach sind erreichbar:

- Frontend: `http://localhost:3000`
- Backend-Healthcheck: `http://localhost:3001/api/health`
- Prometheus: `http://localhost:9090`

Die aktuellen Demo-Konten stehen in `backend/prisma/seed.ts`. Der Seed ist die maßgebliche Quelle für Zugangsdaten.

Entwicklung ohne vollständigen Container-Build:

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Das Vite-Frontend leitet `/api` standardmäßig an `http://localhost:3001` weiter. Mit `VITE_PROXY_TARGET` lässt sich das Proxy-Ziel ändern; `VITE_API_BASE_URL` setzt stattdessen die Basis-URL des API-Clients.

## Umgebungsvariablen

Backend:

- `DATABASE_URL`: PostgreSQL-Verbindungsstring; für Prisma und Integrationstests erforderlich
- `JWT_SECRET`: Signaturschlüssel; in Produktion zwingend explizit und geheim setzen
- `PORT`: Standard `3001`
- `NODE_ENV`: beeinflusst unter anderem Cookie-Sicherheit
- `CORS_ORIGIN`: kommaseparierte erlaubte Origins, Standard `http://localhost:3000`
- `UPLOAD_DIR`: temporäres/lokales Upload-Verzeichnis, Standard `uploads`
- `DOCUMENT_STORAGE`: `local` oder `azure`
- `AZURE_STORAGE_ACCOUNT`: bei Azure-Speicherung erforderlich
- `AZURE_STORAGE_CONTAINER`: Standard `application-documents`

Keine echten Secrets oder `.env`-Dateien committen. Neue Variablen auch in `backend/.env.example`, Docker-/Deployment-Konfiguration und dieser Datei bzw. dem README ergänzen.

## Entwicklungsregeln

### Allgemein

- Änderungen klein und aufgabenspezifisch halten; keine unabhängigen Nutzeränderungen überschreiben.
- Commit-Messages im Conventional-Commits-Format schreiben: `<type>(<scope>): <beschreibung>`, zum Beispiel `feat(frontend): add application filter` oder `fix(backend): reject invalid status transition`. Geeignete Typen sind insbesondere `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `build` und `ci`. Breaking Changes mit `!` und/oder einem `BREAKING CHANGE:`-Footer kennzeichnen.
- Branches, Commits und andere Projektartefakte nicht nach verwendeten KI-Werkzeugen oder Assistenten wie `codex` benennen. Branch-Namen beschreiben stattdessen ausschließlich ihren Zweck, zum Beispiel `docs/add-agent-guidance`, `feature/application-filter` oder `fix/status-transition`.
- UI-Texte und API-Fehlermeldungen bleiben auf Deutsch. Interne Namen, Typen und Statuswerte bleiben Englisch.
- Es gibt derzeit keinen Linter oder Formatter. Den vorhandenen Stil beibehalten: zwei Leerzeichen, doppelte Anführungszeichen, Semikolons und möglichst kleine, klar benannte Funktionen.
- Abhängigkeiten nur ergänzen, wenn vorhandene APIs oder Standardbibliotheken nicht ausreichen. Passende Lockdatei mit aktualisieren.
- Änderungen an Verhalten, Setup, Monitoring oder Betrieb in `README.md` beziehungsweise `docs/` nachziehen.

### Backend und API

- Das Backend ist ESM mit `moduleResolution: NodeNext`. Relative TypeScript-Imports müssen deshalb die spätere `.js`-Endung verwenden, zum Beispiel `../lib/prisma.js`.
- Neue Router in `backend/src/routes/` anlegen und in `backend/src/app.ts` registrieren.
- Alle externen Eingaben vor Verarbeitung mit Zod validieren. Fachliche Schemas gehören nach `backend/src/schemas/`.
- Geschützte Endpunkte verwenden `requireAuth`; rollenbezogene Endpunkte zusätzlich `requireRole` oder eine explizite Rollenprüfung.
- Bürger dürfen nur eigene Anträge und Dokumente sehen. Sachbearbeiterzugriffe müssen ausdrücklich autorisiert sein.
- Fehler sollen einen passenden HTTP-Status und `{ error: string }` liefern. Unerwartete Fehler gehen an die zentrale Fehlerbehandlung.
- Datumswerte ohne Uhrzeit als `YYYY-MM-DD` validieren und nach dem bestehenden UTC-Muster in `Date` umwandeln.
- Keine personenbezogenen Daten, E-Mail-Adressen, Tokens, Dokumentnamen oder IDs in Logs und Metrik-Labels aufnehmen.
- Neue dynamische Routen für Metriken normalisieren; Kardinalität von Prometheus-Labels begrenzen.

### Datenbank und Prisma

- `backend/prisma/schema.prisma` und die zugehörige Migration gemeinsam ändern.
- Vorhandene Migrationen niemals nachträglich bearbeiten. Eine neue Migration erzeugen und committen.
- Lokal für eine Schemaänderung typischerweise:

```bash
cd backend
npx prisma migrate dev --name <kurzer_name>
npx prisma generate
```

- In CI und Produktion wird `npx prisma migrate deploy` verwendet.
- Beziehungen und Löschverhalten bewusst festlegen; bestehende fachliche Detaildatensätze hängen per Cascade am Antrag.
- Seeds idempotent halten (`upsert`) und nur für Demo-/Entwicklungsdaten verwenden.

### Frontend

- Netzwerkzugriffe und gemeinsam genutzte API-Typen in `frontend/src/api.ts` bündeln.
- Requests müssen `credentials: "include"` beibehalten, da die Anmeldung Cookie-basiert ist.
- Neue Fachformulare als fokussierte Komponenten analog zu den bestehenden `*Form.tsx`-Dateien umsetzen.
- Lade-, Erfolgs- und Fehlerzustände sichtbar behandeln. Serverseitige Validierung und Autorisierung nie durch reine UI-Prüfungen ersetzen.
- Das Frontend ist eine SPA; nginx und Vite müssen `/api` weiterhin korrekt an das Backend weiterleiten.
- Bei UI-Änderungen Responsivität, Tastaturbedienung, Labels, Fokusführung und verständliche deutsche Texte prüfen.

### Authentifizierung und Dokumente

- Authentifizierung bleibt Cookie-basiert. Cookie-Flags (`httpOnly`, `sameSite`, `secure`) bei Änderungen an Auth oder Deployment mitprüfen.
- Passwörter nur mit bcrypt hashen und nie protokollieren oder zurückgeben.
- Uploadgrenze ist 5 MiB; erlaubt sind PDF, JPEG und PNG. MIME-Type, Dateiendung und Magic Bytes werden geprüft und dürfen nicht abgeschwächt werden.
- Gespeicherte interne Dateinamen und Storage-Pfade nicht über öffentliche API-Antworten offenlegen; `publicDocumentSelect` verwenden.
- Fehlerfälle müssen temporäre Dateien bereinigen. Tests dürfen keine Upload-Artefakte hinterlassen.

## Tests und Verifikation

Die kleinste sinnvolle Testsuite zuerst ausführen, danach vor Abschluss alle betroffenen Builds und Tests.

Frontend:

```bash
cd frontend
npm test
npm run build
```

`npm test` führt aktuell den TypeScript-Typecheck aus. Für geänderte Nutzerabläufe zusätzlich Playwright gegen laufendes Frontend, Backend und eine vorbereitete Datenbank ausführen:

```bash
cd frontend
npm run test:e2e
```

Backend-Unit-Tests ohne Datenbank:

```bash
cd backend
npx vitest run tests/schema.unit.test.ts tests/dog-tax.unit.test.ts tests/profile.unit.test.ts tests/certificate-of-conduct.unit.test.ts
npm run build
```

Vollständige Backend-Suite mit separater Testdatenbank:

```bash
docker compose up -d database
docker compose exec database createdb -U postgres digitale_behoerde_test
cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/digitale_behoerde_test" npx prisma migrate deploy
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/digitale_behoerde_test" JWT_SECRET="test-secret" npm test
```

Falls die Testdatenbank bereits existiert, ist der `createdb`-Fehler unkritisch. Niemals Integrationstests gegen eine Entwicklungs- oder Produktionsdatenbank starten: Die Tests verwenden `deleteMany()` und löschen Daten. Backend-Tests laufen absichtlich nicht dateiparallel, weil sie Datenbank, Metrik-Registry und Upload-Verzeichnis teilen.

Bei Änderungen an Docker, Proxy, Storage, Metriken oder Deployment zusätzlich passend prüfen:

```bash
docker compose config
docker compose build
```

Für Monitoring-Änderungen `/metrics`, `monitoring/prometheus.yml`, `monitoring/alerts.yml` und `docs/monitoring.md` gemeinsam betrachten.

## Fachliche Invarianten

- Rollen sind `CITIZEN` und `CASEWORKER`.
- Neue Anträge starten mit `SUBMITTED`.
- Erlaubte Statusfolge: `SUBMITTED -> IN_REVIEW -> APPROVED` oder `REJECTED`; Endstatus können nicht weiter geändert werden.
- Statusupdates sind gegen parallele Bearbeitung abgesichert und müssen diese Absicherung behalten.
- Bürger sehen nur eigene Anträge; Sachbearbeiter sehen alle Anträge.
- Zusätzliche Dokumente sind nur für eigene Anträge im Status `SUBMITTED` erlaubt.
- Antragsmetriken werden erst nach erfolgreicher Datenbankoperation erhöht.

## Vorgehen für neue Behördengänge

Ein neuer Vorgang berührt üblicherweise alle folgenden Ebenen:

1. Prisma-Enum, Fachmodell, Relation und neue Migration
2. Zod-Schema mit Unit-Tests
3. Bürger-Endpunkt mit Authentifizierung, Rollenprüfung und Integrationstests
4. Servicekatalog und gemeinsame API-Typen
5. Frontend-Formular, Einbindung in `App.tsx` und verständliche Statusdarstellung
6. Sachbearbeiteransicht und Dokumentzugriff, falls benötigt
7. Metriken, Seed-/Demo-Daten und Dokumentation, soweit betroffen
8. End-to-End-Test für den wichtigsten Nutzerpfad

## Abschlusskriterien

Eine Änderung ist fertig, wenn:

- fachliches Verhalten, Autorisierung und Fehlerfälle abgedeckt sind,
- TypeScript in Frontend und Backend baut,
- relevante Unit-, Integrations- und gegebenenfalls E2E-Tests erfolgreich sind,
- eine Schemaänderung eine neue Migration enthält,
- keine Secrets, personenbezogenen Testdaten, Uploads oder Build-Artefakte eingecheckt wurden,
- Dokumentation, Environment-Beispiele, Docker/CI und Monitoring bei Bedarf synchronisiert sind,
- im Abschlussbericht ausgeführte Prüfungen und nicht ausgeführte Prüfungen transparent genannt werden.
