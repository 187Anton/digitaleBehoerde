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

```bash
docker compose up --build -d
docker compose exec backend npx prisma db seed
```

- Anwendung: http://localhost:3000
- Backend-Healthcheck: http://localhost:3001/api/health
- Prometheus: http://localhost:9090

Prometheus überwacht HTTP-Anfragen, Antwortzeiten, Fehler sowie fachliche Antrags- und Statusmetriken. Alarmregeln und Incident-Ablauf sind in [docs/monitoring.md](docs/monitoring.md) beschrieben.
