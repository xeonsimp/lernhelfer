# Lernhelfer

Jede Woche das Wichtigste aus OLAT, ohne selbst zu suchen: Ein Programm am Windows-PC oder Mac holt Folien, PS-Unterlagen und Onlinetests aus OLAT (Universität Innsbruck); nur mit iPad lädt man sie selbst hoch, Onlinetests auch per Bildschirmfoto, und die App macht daraus pro Fach eine Wochenausgabe mit Zusammenfassung, Übungsaufgaben, Lexikon, Terminen und Fristen.

**App:** https://xnik243.github.io/lernhelfer/ · **Anleitung:** https://xnik243.github.io/lernhelfer/#/anleitung

Einrichten dauert etwa 15 Minuten: In der App auf „Einrichten“ tippen und den vier Schritten folgen. Jede Person nutzt ihren eigenen KI-Zugang (OpenRouter) und ihren eigenen privaten Speicher (GitHub); Schlüssel bleiben im Browser des Geräts, Unterlagen im privaten Speicher.

## Dateien

- `index.html` – die ganze App (statisch, GitHub Pages)
- `holen.py` – OLAT-Abgleich am PC oder Mac; `einrichten.ps1` installiert ihn unter Windows (Datei aus der App), `einrichten-mac.sh` am Mac (Befehl aus der App fürs Terminal, launchd statt Aufgabenplanung)
- `test_holen.py` – Prüfungen, vor allem für den Testschutz (`python test_holen.py`)
- `verschluesseln.mjs` – verschlüsselt die Prompts geschützter Bereiche ins private Daten-Repo
