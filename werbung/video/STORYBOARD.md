# Lernhelfer-Spot: Storyboard

Hauptfassung 9:16, 1080 × 1920, 60 fps, rund 50,9 s (3056 Frames). Zweitfassung 16:9, 1920 × 1080, mit denselben Szenen: Text links, Gerät rechts.
Kein Voice-over. Alles ist ohne Ton verständlich. Text und Gerät bleiben bei 9:16 zwischen y = 250 und y = 1570, oben 250 px und unten 350 px sind frei.
Die Szenen wechseln zwischen hell (Papier #fbfbf9, Tinte #121212) und dunkel (Tafel #151515, Kreide #e9e6df).
Übergänge dauern 12 Frames. Jede Texttafel bleibt lange genug stehen, um sie in Ruhe zu lesen. App-Aufnahmen sind unten klein mit „Beispieldaten“ beschriftet.

| # | Zeit | Grund | Bild | Text im Bild | Ton |
|---|---|---|---|---|---|
| 1 Hook | 0,0–4,5 s | dunkel | Gezeichnete Dateisymbole (PDF, PPTX, DOCX, ZIP) regnen herunter und stapeln sich schief. Ein Zähler läuft bis 37 mit. | „Sonntagabend.“ / „4 Fächer.“ / „**37 Dateien** in OLAT.“ (Marker) | Stift-Kratzer je Zeile, Tick beim Zählen |
| 2 Wende | 4,3–8,5 s | hell | Ein Rahmen zeichnet sich, der Stapel wird hineingesaugt. Der Schriftzug LERNHELFER zeichnet sich Strich für Strich. | „Jede Woche **das Wichtigste** aus OLAT.“ (Marker) | Swoosh, Kratzer beim Schriftzug |
| 3 Kern | 8,3–17,1 s | dunkel | Ein Handy fliegt ein und zeigt „Heute“ mit Fristen. Die erste Frist wird abgehakt. Dann wird Mathematik angetippt, die Wochenausgabe gleitet herein, und die Kamera fährt über „Auf einen Blick“, Zusammenfassung, nächstes PS und Lexikon. | „Dein PC holt **alles** aus OLAT.“ → „Du bekommst **die Woche** pro Fach.“ | Pop, Ding beim Haken, Klick beim Antippen, Swoosh |
| 4 Lernen | 16,9–23,9 s | hell | Drei Karten fliegen nacheinander ein: Eine Übungsaufgabe wird aufgedeckt, eine Karteikarte dreht sich um, die Kurve im Notentracker zeichnet sich und 79 % zählen hoch. | „Üben.“ „Abfragen.“ „Wissen, **wo du stehst**.“ | Pop je Karte, Klick, Swoosh beim Umdrehen, Ticks |
| 5 Vortrag | 23,7–33,2 s | dunkel | Eine gezeichnete Aufnahme läuft, das Transkript schreibt mit, jedes „uh/um“ wird gelb markiert und als äh-Laut gezählt. Ein Befund mit Zeitstempel 0:37 springt auf, dann das GER-Abzeichen B2 → C1. | „Vortrag hochladen.“ → „Feedback mit **Zeitstempel** und **GER-Niveau**.“ | Tick je äh-Laut, Pop beim Befund, Ding beim Abzeichen |
| 6 Podcast | 33,0–38,5 s | hell | Ein Kopfhörer zeichnet sich, eine Wellenform läuft, zwei Sprechblasen: Lena fragt, Max erklärt. | „Keine Lust zu lesen? Hör deine Ausgabe **im Bus**.“ | Pop je Sprechblase, Kratzer |
| 7 Prüfung | 38,3–44,1 s | dunkel | Ein Countdown zählt auf „30 Tage bis zum Zwischentest“ herunter. Ein Probeklausur-Blatt mit 60 Minuten Zeitlimit fliegt ein, das Schwächen-Training markiert „Kettenregel“. | „Probeklausur und Training genau da, **wo es hakt**.“ | Ticks, Pop, Kratzer beim Markieren |
| 8 CTA | 43,9–50,9 s | hell | Schriftzug klein oben. Der Knopf „lernhelfer.xyz“ wird gedrückt (scale 0,97, Marker-Füllung). | „Base ist **kostenlos**.“ / „24 Stunden Ultra gratis testen.“ / klein: „Pro 4,90 € · Ultra 9,90 € im Monat · kein Abo“ / „Für OLAT an der Uni Innsbruck · iPad, PC und Mac · Unterlagen bleiben privat“ / ganz klein: „Unabhängiges, privates Projekt. Kein Angebot der Universität Innsbruck.“ | Pop, Klick beim Drücken, Ding |

Musik: synthetischer 120-BPM-Beat (`public/sfx/bgm.wav`). Unter jedem Effekt wird er um 6 dB abgesenkt, am Ende blendet er aus.

## Quellen der Aussagen

- Funktionen, Tarife und das „Ranking“: `werbung/prompt.md`, Anleitung in `index.html` (#a-was, #a-konto, #a-lernen, #a-vortrag), Preise aus `TARIFE` in `server/server.mjs`.
- „Lena fragt, Max erklärt“, „Keine Lust zu lesen“, „im Bus“: Anleitung, Abschnitt Lernen und Prüfungen.
- „24 Stunden Ultra gratis“, „Base ist kostenlos“, „kein Abo“: Anleitung, Abschnitt Konto und Tarife.
- „Unterlagen bleiben privat“: Anleitung, Abschnitte Grenzen und Datenschutz.
- Die Zahl 37 und alle Inhalte in den App-Aufnahmen sind erfundene Beispieldaten (`demo/inhalt`, `scripts/demo_daten.py`).

Bewusst nicht im Spot: Lösungen für Onlinetests, voller Löser, Hausaufgaben-Entwurf, Admin-Ecke, Logos der Universität oder von OLAT, echte Personen.
