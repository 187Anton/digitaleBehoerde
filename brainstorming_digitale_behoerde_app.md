# Brainstorming: App für digitale Behördengänge

## 1. Ausgangsidee

Die App soll Behördengänge in Deutschland vereinfachen, indem Bürgerinnen und Bürger zentrale Verwaltungsleistungen digital starten, ausfüllen, einreichen und nachverfolgen können. Im Mittelpunkt steht nicht nur eine digitale Darstellung von Formularen, sondern eine technische Prozessdigitalisierung: Anmeldung, Auswahl des Behördengangs, Formularausfüllung, Dokumenten-Upload, Übermittlung an die Behörde, Statusverfolgung und Bearbeitung durch eine Behördenansicht.

Der Prototyp soll als kleine, aber funktionsfähige Web-App für die Semesterarbeit umgesetzt und auf Azure bereitgestellt werden.

## 2. Ziel des Brainstormings

Dieses Dokument sammelt die fachlichen und technischen Grundentscheidungen für die App. Es dient als Grundlage für die weitere Projektbeschreibung, Anforderungsanalyse, Architekturplanung und Umsetzung im Modul Continuous Delivery and DevOps.

## 3. Problemraum

- Behördengänge sind häufig zeitaufwendig, papierbasiert und schwer verständlich.
- Informationen sind über verschiedene Webseiten, Ämter und Formulare verteilt.
- Bürgerinnen und Bürger wissen oft nicht, welche Angaben und Dokumente benötigt werden.
- Formulare sind teilweise kompliziert formuliert und wenig nutzerfreundlich.
- Statusinformationen zu Anträgen sind oft schwer nachvollziehbar.
- Behörden erhalten Anträge und Dokumente häufig nicht vollständig oder nicht strukturiert genug.

## 4. Zielgruppen

Die App richtet sich an zwei Hauptzielgruppen:

### Bürgerinnen und Bürger

- möchten Behördengänge möglichst einfach und vollständig digital erledigen
- brauchen eine verständliche Schritt-für-Schritt-Führung
- möchten persönliche Daten nicht mehrfach eingeben müssen
- möchten Dokumente direkt hochladen können
- möchten den Bearbeitungsstatus ihrer Anträge nachvollziehen können

### Kollaborierende Behörden

- erhalten strukturierte Anträge und Dokumente
- können Anliegen besser zuordnen
- können Anträge digital prüfen und den Status ändern
- können Rückfragen digital an Nutzer stellen
- profitieren von vollständigeren Anträgen und weniger Medienbrüchen

## 5. Fachlicher Umfang des Prototyps

Der Prototyp soll drei Behördengänge enthalten. Sie werden nicht alle gleich tief umgesetzt, damit der Projektumfang realistisch bleibt.

| Behördengang | Umsetzungstiefe | Inhalt |
|---|---|---|
| Wohnsitz ummelden | Hauptprozess, am vollständigsten | persönliche Daten, alte Adresse, neue Adresse, Einzugsdatum, Dokumenten-Upload, Absenden, Statusverfolgung |
| Hundesteuer anmelden | mittlerer Umfang | Halterdaten, Hundedaten, Haltungsbeginn, optionaler Nachweis, Statusverfolgung |
| Führungszeugnis beantragen | vereinfachter Umfang | persönliche Daten, Zweck des Führungszeugnisses, einfache Antragserstellung, Statusverfolgung |

Die Wohnsitzummeldung ist der zentrale Vorzeigeprozess. Hundesteuer und Führungszeugnis zeigen ergänzend, dass die Plattform mehrere Antragstypen verwalten kann.

## 6. Kernfunktionen

### 6.1 Login und Rollenmodell

Die App soll eine echte Login-Funktion enthalten. Vorgesehen sind mindestens zwei Rollen:

**Bürger / Nutzer**

- kann sich registrieren und einloggen
- kann persönliche Daten im Profil speichern
- kann Behördengänge auswählen und Anträge stellen
- kann Dokumente hochladen
- kann eigene Anträge und deren Status verfolgen
- kann Rückfragen der Behörde sehen und beantworten

**Behörde / Admin**

- kann sich in einer getrennten Ansicht anmelden
- kann eingegangene Anträge sehen
- kann Antragdetails und Dokumente prüfen
- kann den Status eines Antrags ändern
- kann Rückfragen oder Nachrichten an Bürger erstellen

### 6.2 Nutzerprofil

Nutzer sollen persönliche Daten speichern können, damit diese bei Behördengängen automatisch übernommen oder vorausgefüllt werden können.

Mögliche Profildaten:

- Vorname
- Nachname
- Geburtsdatum
- Geburtsort
- Staatsangehörigkeit
- aktuelle Adresse
- frühere Adresse
- Kontaktdaten wie E-Mail und Telefonnummer
- ausweisnahe Demo-Daten, z. B. Ausweisnummer oder ähnliche Identifikationsdaten als Prototyp-Feld

Hinweis für die Projektabgrenzung: Die Speicherung solcher Daten dient im Prototyp der fachlichen Demonstration. Eine echte Produktivversion müsste Datenschutz, Verschlüsselung, Identitätsprüfung, Berechtigungskonzepte und rechtliche Anforderungen deutlich strenger berücksichtigen.

### 6.3 Behördenservice-Katalog

Die Startseite bzw. der Servicebereich zeigt die verfügbaren Behördengänge:

- Wohnsitz ummelden
- Hundesteuer anmelden
- Führungszeugnis beantragen

Jeder Behördengang führt zu einem eigenen digitalen Prozess mit Formular, optionalem Dokumenten-Upload, Zusammenfassung und Absenden.

### 6.4 Schritt-für-Schritt-Prozess

Jeder Behördengang soll als geführter Prozess dargestellt werden. Der Ablauf folgt einem einheitlichen Muster:

1. Behördengang auswählen
2. Voraussetzungen und benötigte Angaben anzeigen
3. persönliche Daten aus dem Profil übernehmen oder ergänzen
4. fachliche Angaben zum Antrag erfassen
5. Dokumente hochladen, falls erforderlich
6. Zusammenfassung prüfen
7. Antrag absenden
8. Status in der Übersicht verfolgen

### 6.5 Formularausfüllung

- digitale Formulare je Behördengang
- Pflichtfeldprüfung
- einfache Plausibilitätsprüfung
- Vorbefüllung mit gespeicherten Profildaten
- Speicherung der Formularangaben in der SQL-Datenbank

### 6.6 Dokumenten-Upload

- Upload von PDF, Foto oder Scan
- Speicherung der Dateien im Backend bzw. Dateispeicher
- Speicherung der Upload-Metadaten in der SQL-Datenbank
- Zuordnung der Dokumente zu einem konkreten Antrag

Für den MVP reicht eine pragmatische Lösung, z. B. Speicherung im Backend-Dateisystem oder in einem Docker-Volume. Perspektivisch wäre Azure Blob Storage sinnvoll, ist aber für die erste Version nicht zwingend notwendig.

### 6.7 Statusübersicht

Bürger sehen eine Übersicht ihrer laufenden und abgeschlossenen Behördengänge.

Mögliche Statuswerte:

- Entwurf
- Eingereicht
- In Prüfung
- Rückfrage offen
- Abgeschlossen
- Abgelehnt

Zusätzlich sollte eine Detailansicht mit Statushistorie vorhanden sein.

### 6.8 Behördenansicht

Die Behördenansicht ist ein eigener Bereich für Behördenmitarbeiter oder Admins.

Funktionen:

- eingegangene Anträge ansehen
- Antragdetails und Dokumente prüfen
- Status ändern
- Rückfrage oder Nachricht an Nutzer erstellen

## 7. Nicht im MVP enthalten

Um den Projektumfang realistisch zu halten, werden folgende Punkte bewusst nicht umgesetzt:

- KI-Assistent
- echte Anbindung an reale Behörden-Fachverfahren
- echte Identifikation über Personalausweis/eID
- rechtssichere digitale Signatur
- vollständige Umsetzung aller realen Verwaltungsanforderungen
- vollständiges Bürgerportal mit vielen verschiedenen Verwaltungsleistungen

## 8. Nutzenversprechen

### Für Bürgerinnen und Bürger

- weniger Unsicherheit beim Ausfüllen von Anträgen
- weniger Papieraufwand
- bessere Übersicht über laufende Behördengänge
- weniger notwendige Vor-Ort-Termine
- verständlichere und geführte Formulare
- Wiederverwendung gespeicherter Profildaten

### Für Behörden

- vollständigere Anträge
- weniger Rückfragen wegen fehlender Angaben
- strukturiertere Eingangsdaten
- bessere Nachverfolgbarkeit
- digitale Statuskommunikation
- potenziell geringere Bearbeitungszeit

## 9. Technisches Zielbild

Die App soll als kleine lauffähige Web-App umgesetzt werden. Sie soll nicht nur ein UI-Mockup sein, sondern mit echtem Backend, Datenbank, Login, Rollenmodell, Datei-Upload und Statuslogik funktionieren.

Technisch vorgesehen sind:

- Frontend
- Backend
- kleine SQL-Datenbank
- Login und Registrierung
- rollenbasierte Bürger- und Behördenansicht
- echte Speicherung von Nutzerdaten und Behördengängen
- echter Dokumenten-Upload
- Dockerisierung
- Deployment auf Azure
- Unit-, Integration- und End-to-End-Tests
- Monitoring mit Prometheus

## 10. Empfohlener Technologie-Stack

| Bereich | Empfehlung | Begründung |
|---|---|---|
| Frontend | React mit TypeScript und Vite | schnell aufzusetzen, gut testbar, geeignet für mehrere Ansichten und Formularprozesse |
| Backend | Node.js mit Express und TypeScript | leichtgewichtig, gut für REST-API, Authentifizierung, Uploads und Prometheus-Metriken |
| Datenbank | PostgreSQL | echte relationale SQL-Datenbank, gut mit Docker und Azure nutzbar |
| ORM | Prisma | klare Datenmodelle, Migrationen, TypeScript-Unterstützung |
| Authentifizierung | E-Mail/Passwort mit bcrypt und JWT oder HttpOnly-Cookie | realistische Login-Funktion mit Rollenprüfung |
| Datei-Upload | Multer | Standardlösung für Datei-Uploads in Express |
| Containerisierung | Docker und Docker Compose | gut für lokale Entwicklung, Demo und Azure-Deployment |
| Tests | Vitest/Jest, Supertest, Playwright | deckt Unit-, Integration- und End-to-End-Tests ab |
| CI/CD | GitHub Actions | geeignet für Tests, Build, Docker-Images und Deployment |
| Monitoring | Prometheus, optional Grafana | passend für DevOps-Anforderungen und technische Überwachung |

## 11. Datenbank und Speicherung

Gespeichert werden sollen mindestens:

- Nutzerkonten
- Rollen
- persönliche Profildaten
- Adressdaten
- ausweisnahe Demo-Daten, soweit für den Prototyp sinnvoll
- Anträge bzw. Behördengänge
- Formularangaben je Antragstyp
- Upload-Metadaten zu Dokumenten
- Statushistorie
- Nachrichten oder Rückfragen zwischen Behörde und Nutzer

Möglicher grober Tabellenentwurf:

```text
users
- id
- email
- password_hash
- role
- created_at

user_profiles
- id
- user_id
- first_name
- last_name
- date_of_birth
- place_of_birth
- nationality
- phone
- current_address
- previous_address
- id_card_number_demo

applications
- id
- user_id
- service_type
- status
- created_at
- updated_at

residence_change_forms
- id
- application_id
- old_address
- new_address
- move_in_date

 dog_tax_forms
- id
- application_id
- dog_name
- dog_breed
- dog_birth_date
- keeping_since

certificate_of_conduct_forms
- id
- application_id
- purpose
- delivery_type

documents
- id
- application_id
- file_name
- file_path
- document_type
- uploaded_at

status_history
- id
- application_id
- old_status
- new_status
- changed_by
- changed_at

messages
- id
- application_id
- sender_id
- message
- created_at
```

## 12. Tests

Es sollen drei Testebenen umgesetzt werden.

### Unit-Tests

Testen einzelne Funktionen und Logikbausteine, z. B.:

- Pflichtfeldprüfung
- Statuslogik
- Rollenprüfung
- Validierungsfunktionen

### Integrationstests

Testen das Zusammenspiel von API, Backend und Datenbank, z. B.:

- Registrierung und Login
- Antrag erstellen
- Formularangaben speichern
- Dokument-Metadaten speichern
- Status ändern

### End-to-End-Tests

Testen komplette Nutzerflüsse im Browser, z. B.:

1. Login
2. Wohnsitzummeldung auswählen
3. Formular ausfüllen
4. Dokument hochladen
5. Antrag absenden
6. Status prüfen
7. Behördenlogin
8. Antrag öffnen
9. Status ändern
10. Statusänderung als Bürger sehen

## 13. CI/CD und DevOps-Bezug

Da die App im Modul Continuous Delivery and DevOps umgesetzt wird, muss der DevOps-Zyklus sichtbar dokumentiert werden.

Relevante Punkte:

- Projektziel und Anforderungen an die Software beschreiben
- Zielgruppe und Hauptfunktionalitäten erklären
- Planung und Anforderungsanalyse dokumentieren
- verwendete Programmiersprache, Frameworks und Bibliotheken beschreiben
- Git-Nutzung mit Commit-Historie, Branching-Strategie und Pull Requests zeigen
- Teststrategie mit Unit-Tests, Integrationstests und End-to-End-Tests beschreiben
- Continuous-Delivery-Pipeline darstellen
- Release-Prozess und Automatisierungswerkzeuge dokumentieren
- Deployment-Prozess inklusive Azure und Docker erklären
- Monitoring und einfacher Incident-Management-Prozess darstellen

Empfohlene GitHub-Actions-Pipeline:

1. Code auschecken
2. Abhängigkeiten installieren
3. Linting ausführen
4. Unit-Tests ausführen
5. Integrationstests ausführen
6. Frontend und Backend bauen
7. Docker-Images bauen
8. optional Images in eine Container Registry pushen
9. Deployment auf Azure ausführen

## 14. Azure-Deployment

Für das Projekt sind drei Azure-Varianten realistisch.

### Option A: Azure App Service + Azure Database for PostgreSQL

Frontend und Backend werden als Web-App bzw. API bereitgestellt. PostgreSQL läuft als verwaltete Azure-Datenbank.

Vorteile:

- relativ professionell
- gute Dokumentierbarkeit
- passt gut zu echter Web-App
- weniger Serveradministration

Nachteile:

- Deployment mit mehreren Komponenten etwas komplexer
- Prometheus muss sinnvoll integriert werden

### Option B: Azure Container Apps + PostgreSQL

Frontend, Backend und ggf. Monitoring laufen containerisiert. PostgreSQL kann als Azure Database for PostgreSQL oder als Container laufen.

Vorteile:

- passt sehr gut zu Docker
- moderne Cloud-native Lösung
- CI/CD mit Docker-Images gut erklärbar
- Prometheus/Grafana lassen sich konzeptionell gut anbinden

Nachteile:

- etwas mehr Komplexität als App Service
- Azure-Konfiguration muss sorgfältig dokumentiert werden

### Option C: Azure VM mit Docker Compose

Eine kleine virtuelle Maschine wird genutzt, auf der Docker Compose läuft.

Vorteile:

- am einfachsten zu verstehen
- lokale und serverseitige Umgebung sind sehr ähnlich
- Prometheus und Grafana lassen sich einfach mitdeployen
- gut für eine Semester-Demo

Nachteile:

- weniger cloud-native
- mehr Verantwortung für Server, Firewall und Updates
- fachlich weniger elegant als Container Apps oder App Service

### Vorläufige Empfehlung

Für diese Semesterarbeit ist **Azure VM mit Docker Compose** die pragmatischste Variante, wenn schnelle Umsetzbarkeit und sichere Demo wichtiger sind als Cloud-native Perfektion.

**Azure Container Apps** wäre die modernere Alternative, wenn genug Zeit für Azure-Konfiguration vorhanden ist und der Fokus stärker auf Container-Architektur liegen soll.

## 15. Monitoring

Prometheus soll für Monitoring verwendet werden. Das Backend sollte dafür einen `/metrics`-Endpunkt bereitstellen, z. B. mit `prom-client`.

Mögliche Metriken:

- Anzahl HTTP-Requests
- Antwortzeiten
- Fehleranzahl
- Anzahl erstellter Anträge
- Anzahl Statusänderungen
- Healthcheck des Backends

Optional kann Grafana ergänzt werden, um die Prometheus-Metriken grafisch darzustellen.

## 16. Risiken und Herausforderungen

- Datenschutz und Datensicherheit, besonders bei persönlichen und ausweisnahen Daten
- sichere Authentifizierung und Rollenprüfung
- Dateiupload sicher begrenzen und prüfen
- Integration mit bestehenden Fachverfahren wird nicht umgesetzt, muss aber als Grenze genannt werden
- unterschiedliche Prozesse je Kommune/Bundesland
- Barrierefreiheit und einfache Sprache
- ausreichender, aber nicht überladener Projektumfang
- Azure-Deployment und Monitoring können technisch aufwendig werden

## 17. Offene Entscheidungen

- JWT oder Cookie-basierte Sessions für Login?
- PostgreSQL in Azure als Container oder als verwaltete Azure-Datenbank?
- Azure VM oder Azure Container Apps?
- Grafana zusätzlich zu Prometheus einsetzen?
- Soll die Behördenansicht nur Statusänderungen ermöglichen oder auch Rückfragen/Nachrichten?
- Welche Upload-Dateitypen werden erlaubt?
- Wie streng soll die Formularvalidierung sein?
- Welche Profildaten werden wirklich gespeichert und welche nur als Demo-Felder gezeigt?

## 18. Vorläufige Produktbeschreibung

Die App ist ein digitales Bürgerportal für einfache Behördengänge. Bürgerinnen und Bürger können sich registrieren, persönliche Daten in einem Profil speichern, einen Behördengang auswählen und den jeweiligen Antrag digital ausfüllen. Im Prototyp werden die Vorgänge Wohnsitz ummelden, Hundesteuer anmelden und Führungszeugnis beantragen abgebildet.

Die App führt Nutzer Schritt für Schritt durch den Prozess, übernimmt passende Profildaten in Formulare, ermöglicht den Upload von Dokumenten und speichert den Antrag in einer SQL-Datenbank. Anschließend kann der Nutzer den Bearbeitungsstatus verfolgen. Behördenmitarbeiter können sich in einer getrennten Ansicht anmelden, eingegangene Anträge einsehen, Dokumente prüfen, Statusänderungen vornehmen und Rückfragen stellen.

Der Schwerpunkt liegt auf technischer Prozessdigitalisierung und auf einer sauberen DevOps-Umsetzung mit Docker, Azure-Deployment, Tests, CI/CD und Prometheus-Monitoring.

