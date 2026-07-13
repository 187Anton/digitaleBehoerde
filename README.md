# Digitale Behörde App

## https://fhbrandenburgde-my.sharepoint.com/:w:/g/personal/guehrke_th-brandenburg_de/IQDr0vILESruS4mBkxUAq-QlAcY4wfl6bAGDR9loYE0H04s?e=Orwgs7

Web-App zur digitalen Abwicklung ausgewählter Behördengänge.

## Geplanter MVP

- Login und Registrierung

- Bürger-Dashboard

- Profil mit Stammdaten

- Digitale Formulare für ausgewählte Behördengänge

- Speicherung von Vorgängen

- Statusanzeige

- Einfache Sachbearbeiteransicht

- Docker Compose mit Frontend, Backend und Datenbank

## Lokal starten

Docker Compose startet das Backend im Produktionsmodus und verlangt deshalb ein lokales
`JWT_SECRET`. Zuerst die nicht versionierte Compose-Umgebung anlegen:

```bash
cp .env.example .env
openssl rand -hex 32
```

Den ausgegebenen Zufallswert anschließend in `.env` als `JWT_SECRET` eintragen. Dieses lokale
Secret niemals für eine Deployment-Umgebung wiederverwenden.

```bash
docker compose up --build -d
docker compose exec backend npx prisma db seed
```

Ohne gesetztes `JWT_SECRET` verweigert das Backend im Produktionsmodus den Start. In Azure wird
der Wert ausschließlich als GitHub-Secret an ein Container-App-Secret übergeben.

- Anwendung: http://localhost:3000
- Backend-Healthcheck: http://localhost:3001/api/health
- Prometheus: http://localhost:9090

- Login: buerger@example.com PW: password123
- Login: sachbearbeiter@example.com PW: password123

Prometheus überwacht HTTP-Anfragen, Antwortzeiten, Fehler sowie fachliche Antrags- und Statusmetriken. Alarmregeln und Incident-Ablauf sind in [docs/monitoring.md](docs/monitoring.md) beschrieben.

## Tests lokal ausführen

Frontend:

```bash
cd frontend
npm test
npm run build
```

Backend-Unit-Tests ohne Datenbank:

```bash
cd backend
npx vitest run tests/schema.unit.test.ts tests/dog-tax.unit.test.ts tests/profile.unit.test.ts tests/certificate-of-conduct.unit.test.ts
```

Backend-Integrationstests benötigen eine PostgreSQL-Testdatenbank:

```bash
docker compose up -d database
docker compose exec database createdb -U postgres digitale_behoerde_test

cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/digitale_behoerde_test" npx prisma migrate deploy
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/digitale_behoerde_test" JWT_SECRET="test-secret" npm test
```
