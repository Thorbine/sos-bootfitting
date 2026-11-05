# SOS Bootfitting

Aufnahme-App für die Bootfitting-Werkstatt (SOS Sport Braunschweig). Installierbare Web-App (PWA) ohne Backend:
Kunde, Schuh, Fußschema mit Druckstellen, Maßnahmen und Fotos erfassen, daraus ein A4-PDF erzeugen und per
Teilen-Menü versenden oder drucken. Kundendaten bleiben nur als Entwurf auf dem jeweiligen Gerät und werden nach
14 Tagen oder nach bestätigtem Versand gelöscht.

## Lokal testen

```bash
python3 -m http.server 8123
```

Dann `http://localhost:8123` öffnen.

## Auf GitHub Pages veröffentlichen

1. Neues öffentliches Repo anlegen und diesen Ordner pushen (Branch `main`).
2. Im Repo: Settings → Pages → Source „Deploy from a branch“ → `main` / `(root)`.
3. Die Adresse `https://<name>.github.io/<repo>/` auf den Geräten öffnen und zum Home-Bildschirm hinzufügen
   (iOS: Teilen → „Zum Home-Bildschirm“, Android: Menü → „App installieren“).

Updates: Änderung committen und auf `main` pushen. Nach etwa einer Minute holen sich die Geräte beim nächsten
Start mit Internet die neue Version.

## Anpassen

Alles Fachliche steht in `config.js`: Fitter, Marken, Foto-Labels, Maßnahmen mit Preisen und Einheiten.
Preise erscheinen nur bei extern gekauften Schuhen. Nach Änderungen `version` hochzählen.

## Dateien

| Datei | Inhalt |
| --- | --- |
| `index.html`, `style.css` | Oberfläche |
| `app.js` | Formular, Entwürfe, Fotos, Versand |
| `foot.js` | Fußschema (SVG) |
| `pdf.js` | Preisberechnung und PDF-Layout |
| `store.js` | Entwürfe in IndexedDB |
| `sw.js`, `manifest.webmanifest` | Offline-Betrieb und Installation |
| `vendor/jspdf.umd.min.js` | jsPDF 2.5.1 (lokal eingebunden, läuft offline) |
