# CDSE · Classe-de-participation Planer

Web-App zur Planung der Horaires der *Classes de participation* im CDSE.
Sie gibt der Cheffin einen Überblick, **wer wann wo** ist, und schlägt bei
Ausfällen automatisch den **besten Springer / Remplacementer** vor.

## Features

- **Situationskarte (Palantir-Style):** dunkle Karte von Luxemburg mit
  glühenden Nodes je Standort; Klick öffnet die Klassen-Detailseite.
- **Ausfall & Ersatz:** eingeben wer fehlt (Person + Blöcke) → das Tool zeigt
  betroffene Klassen und rankt verfügbare Springer als „beste Wahl".
- **Springer-Bewertung** nach vier gewichtbaren Kriterien:
  - **Verfügbarkeit** – nicht selbst in dem Block eingeteilt / abwesend
  - **Qualifikation** – passende Kompetenzen für die Klasse
  - **Faire Verteilung** – wer bisher am wenigsten eingesprungen ist
  - **Distanz** – Luftlinie (Haversine) vom Wohnort zum Standort
- **Voll konfigurierbar:** beliebig viele Klassen, Personen & Rollen,
  Stundenplan-Vorlage, benötigte Betreuer (Default 2), Qualifikationen,
  Schultypen, Gewichtung der Kriterien, eigene Ortschaften.
- **Statistik:** Einsätze & Stunden pro Springer, Ausfälle pro Person,
  Auslastung der Klassen, Verteilungs-Spread — inkl. **PDF-Export**.
- **Lokale Speicherung** im Browser + **Export/Import** als JSON-Datei
  (Backup & Weitergabe).

## Standard-Stundenplan

| Tag | Blöcke |
|-----|--------|
| Montag | 08–12 · 14–16 |
| Dienstag | 08–12 |
| Mittwoch | 08–12 · 14–16 |
| Donnerstag | 08–12 |
| Freitag | 08–12 · 14–16 |

Frei änderbar unter **Einstellungen → Stundenplan-Vorlage**.

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal ansehen
```

Stack: React 19 · TypeScript · Vite · Tailwind CSS 4 · Zustand · React Router.
Die Luxemburg-Karte ist ein selbst-gerendertes SVG (keine externen Kacheln).

## Struktur

```
src/
  data/        Ortschaften, Grenzverlauf, Standard-/Seed-Daten
  lib/         Geo-Distanz, Stundenplan-Helfer, Empfehlungs-Engine, Statistik
  store/       Zustand-Store (localStorage-Persistenz, Import/Export)
  components/  Karte, Layout, Springer-Dialog, UI-Bausteine
  pages/       Karte, Klassen, Personen, Ausfall, Statistik, Einstellungen
```

Die Springer-Logik steckt in `src/lib/recommend.ts`.
