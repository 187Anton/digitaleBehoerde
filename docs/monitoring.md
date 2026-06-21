# Monitoring und Incident-Ablauf

## Komponenten

- Das Backend stellt Prometheus-Metriken unter `/metrics` bereit.
- Prometheus fragt das Backend alle 15 Sekunden ab.
- Lokale Prometheus-Oberfläche: `http://localhost:9090`.
- Backend-Healthcheck: `http://localhost:3001/api/health`.

## Relevante Metriken

| Metrik | Aussage |
|---|---|
| `digitale_behoerde_http_requests_total` | Anfragen nach Methode, normalisierter Route und Statuscode |
| `digitale_behoerde_http_request_duration_seconds` | Antwortzeit als Histogramm |
| `digitale_behoerde_applications_created_total` | Anzahl eingereichter Anträge nach Typ |
| `digitale_behoerde_application_status_changes_total` | Erfolgreiche Statuswechsel |
| `digitale_behoerde_process_*` | Laufzeit-, Speicher- und CPU-Metriken des Backends |

IDs und personenbezogene Werte werden nicht als Labels ausgegeben. UUIDs in Routen werden zu `:id` normalisiert.

## Alarmregeln

- `BackendNichtErreichbar`: Scrape seit einer Minute fehlgeschlagen.
- `ErhoehteFehlerrate`: mehr als 5 Prozent 5xx-Antworten über fünf Minuten.
- `LangsameAntworten`: p95-Antwortzeit über eine Sekunde während fünf Minuten.

## Incident-Ablauf

1. Alarm und Beginn des Vorfalls dokumentieren.
2. `/api/health`, Prometheus-Target und Containerstatus prüfen.
3. Backend- und Datenbanklogs auf zeitgleiche Fehler untersuchen.
4. Betroffene Funktion eingrenzen und bei Bedarf die letzte stabile Revision aktivieren.
5. Wiederherstellung über Healthcheck, Fehlerrate und einen vollständigen Testantrag bestätigen.
6. Ursache, Auswirkungen, Korrektur und vorbeugende Maßnahme kurz festhalten.
