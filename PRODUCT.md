# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Studierende im 1. Semester Wirtschaftswissenschaften an der Universität Innsbruck (Fächer: BWL, VWL, Mathematik, Wirtschaftsenglisch). Nutzt die App gleich oft für längeres Vorbereiten (abends/Wochenende, iPad auf dem Sofa oder am Schreibtisch) und für einen kurzen Check kurz vor der Einheit (unterwegs, im Hörsaal). Auch am PC im Browser.

Später sollen Kommiliton:innen die App ebenfalls nutzen. Jede Person braucht dafür eigene Schlüssel (OpenRouter, GitHub-Token), ein eigenes privates Daten-Repo und den eigenen OLAT-Abgleich am PC. Der erste Eindruck zählt deshalb: Die App soll beim Herzeigen auffallen und trotzdem täglich schnell zu bedienen sein.

## Product Purpose

Aus den Unterlagen, die Lehrende in OLAT hochladen (Vorlesungsfolien, PS-Unterlagen, Syllabus), automatisch das Relevante für die kommende Woche machen: was zuletzt dran war, was als Nächstes kommt, was bis wann fällig ist. Erfolg: Fach antippen und sofort wissen, was zu tun und zu lernen ist, ohne selbst zwischen Dateien suchen zu müssen.

## Positioning

Kennt den Terminplan jedes Fachs (aus dem Syllabus) und die tatsächlich hochgeladenen Unterlagen und verbindet beides mit dem heutigen Datum zu einer Wochen-Vorbereitung. Ein allgemeiner KI-Chat kann das nicht, weil er weder an OLAT noch an den Syllabus kommt.

## Operating Context

- OLAT (OpenOLAT, lms.uibk.ac.at) mit SSO und Authenticator-App; neue Unterlagen holt ein Programm am Windows-PC (`holen.py`, eingerichtet über eine Datei aus der App, ohne Admin-Rechte nach %LOCALAPPDATA%\Lernhelfer), weil der Login 2FA verlangt. Es findet die Kurse selbst unter „Meine Kurse → Aktiv“ und lädt Text über die GitHub-API hoch.
- Einrichten für Technik-Ferne: OpenRouter per Login-Knopf (OAuth PKCE), GitHub über vorausgefüllte Links plus eingefügten Schlüssel, weitere Geräte per QR-Code. Die Anleitung liegt in der App (#/anleitung).
- Die App ist eine statische Seite auf GitHub Pages; Daten liegen in einem privaten GitHub-Repo; Modelle laufen über OpenRouter (GPT-6 Luna, MiMo V2.6 Pro, GPT-6.1 Sol), gewählt pro Erstellung.
- Wöchentlicher Rhythmus: VO und PS je Fach, Abgaben und Onlinetests mit Fristen.

## Capabilities and Constraints

- Nur Fach wählen → Wochen-Vorbereitung erstellen; keine Dateiauswahl durch den User.
- Startseite: fächerübergreifende Woche mit Terminen und Fristen.
- Wochenseite pro Fach: Überblick & Fristen, ausführliche Zusammenfassung der letzten Einheit, Begriffe zum Abfragen (Karteikarten), nächstes PS, nächste VO.
- Archiv: ältere Wochen-Seiten bleiben pro Fach nach Datum erhalten.
- Erstellen dauert Minuten (Reasoning-Modelle); die App muss währenddessen offen bleiben.
- Sicherheit: OpenRouter-Key und GitHub-Token nur im localStorage des Geräts; Content-Security-Policy erlaubt nur OpenRouter, GitHub-API und jsDelivr (mit SRI); keine Folien oder Lernseiten in öffentlichen Repos (urheberrechtlich geschützt).
- Sprache: Deutsch (österreichischer Kontext, z. B. „Jänner“ möglich).

## Evidence on Hand

Echte Fächer und Unterlagen aus OLAT im privaten Repo `xeonsimp/lernhelfer-daten` (faecher/*.json). Keine erfundenen Termine oder Inhalte: alles kommt aus den Unterlagen.

## Product Principles

1. Das Relevante kommt zu mir: die App entscheidet anhand von Syllabus und Datum, nicht der User per Dateiliste.
2. Fristen zuerst: was fällig ist, ist nie versteckt.
3. Ehrlich statt raten: steht etwas nicht in den Unterlagen, sagt die Seite das.
4. Lesen und Abfragen gleich gut: lange Zusammenfassungen müssen angenehm lesbar sein, Begriffe schnell abfragbar.

## Accessibility & Inclusion

Touch-first (iPad), große Ziele; funktioniert in Hell und Dunkel nach Systemeinstellung; WCAG-AA-Kontraste.
