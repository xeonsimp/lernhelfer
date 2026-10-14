---
name: Lernhelfer
description: Wöchentliche Fach-Ausgaben einer lachsrosa Wirtschaftszeitung; die App ist der Kiosk.
colors:
  papier: "#fbe3d3"
  papier-tief: "#e8c2aa"
  tinte: "#1b1511"
  tinte-2: "#5b4337"
  bordeaux: "#8e1838"
  auf-bordeaux: "#fff1e8"
  papier-dunkel: "#1d1512"
  papier-tief-dunkel: "#2b201a"
  tinte-dunkel: "#f6d9c5"
  tinte-2-dunkel: "#c9a794"
typography:
  nameplate:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "calc(100cqw / 7.26)"
    fontWeight: 900
    lineHeight: 0.8
    letterSpacing: "-0.015em"
    fontVariation: "\"wdth\" 100"
  display:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "clamp(3rem, 11vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.85
    fontVariation: "\"wdth\" 62"
  headline:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "clamp(2.25rem, 4.5vw, 3.25rem)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "-0.01em"
    fontVariation: "\"wdth\" 65"
  title:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 750
    lineHeight: 1.18
  body:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 850
    lineHeight: 1.1
    letterSpacing: "0.04em"
    fontVariation: "\"wdth\" 75"
  datumszeile:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "0.06em"
    fontFeature: "\"tnum\""
    fontVariation: "\"wdth\" 90"
  tabelle:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 450
    lineHeight: 1.35
    fontFeature: "\"tnum\""
    fontVariation: "\"wdth\" 92"
  meta:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 550
    lineHeight: 1.3
    fontFeature: "\"tnum\""
    fontVariation: "\"wdth\" 90"
  knopf:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.01em"
    fontVariation: "\"wdth\" 85"
rounded:
  none: "0px"
spacing:
  rand: "max(16px, min(4vw, 48px))"
  eng: "8px"
  linie: "14px"
  absatz: "18px"
  spalte: "40px"
  raster: "48px"
components:
  knopf:
    backgroundColor: "transparent"
    textColor: "{colors.tinte}"
    typography: "{typography.knopf}"
    rounded: "{rounded.none}"
    padding: "10px 18px"
    height: "44px"
  knopf-hover:
    backgroundColor: "{colors.papier-tief}"
  knopf-voll:
    backgroundColor: "{colors.tinte}"
    textColor: "{colors.papier}"
    typography: "{typography.knopf}"
    rounded: "{rounded.none}"
    padding: "10px 18px"
    height: "44px"
  knopf-voll-hover:
    backgroundColor: "{colors.tinte-2}"
  eingabe:
    backgroundColor: "{colors.papier}"
    textColor: "{colors.tinte}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
    height: "46px"
  ticker-eintrag:
    backgroundColor: "{colors.tinte}"
    textColor: "{colors.papier}"
    padding: "11px 22px"
  ticker-eintrag-naechste:
    backgroundColor: "{colors.bordeaux}"
    textColor: "{colors.auf-bordeaux}"
  termin-naechste:
    backgroundColor: "{colors.bordeaux}"
    textColor: "{colors.auf-bordeaux}"
    typography: "{typography.tabelle}"
    padding: "9px 10px"
  abschnitt-blick:
    backgroundColor: "{colors.papier-tief}"
    textColor: "{colors.tinte}"
    padding: "14px 18px 18px"
  karteikarte:
    backgroundColor: "{colors.papier}"
    textColor: "{colors.tinte}"
    rounded: "{rounded.none}"
    padding: "24px 28px"
---

# Design System: Lernhelfer

## Overview

**Creative North Star: "Der Wirtschaftsteil"**

Lernhelfer ist eine lachsrosa Finanzzeitung, die pro Fach jede Woche eine eigene Ausgabe druckt. Die App ist der Kiosk: oben ein Zeitungskopf über die volle Satzbreite, darunter die Datumszeile zwischen zwei Druckerlinien, ein laufender Fristen-Ticker wie ein Börsenband, dann das Titelblatt mit Ressort-Spalten links und dem Terminkalender als Kurstabelle rechts. Alles ist Papier, Druckfarbe und Linie. Es gibt keine Karten-Dashboards, keine Icons als Bedeutungsträger und keine Rundungen.

Die Dichte ist die einer Zeitungsseite: schwere, schmal laufende Archivo für alles, was ruft (Kopf, Ressortnamen, Tabellen, Knöpfe), Source Serif 4 für alles, was gelesen wird (Schlagzeilen, Anriss, Zusammenfassung). Hierarchie entsteht über Breite und Gewicht der Grotesk und über die Stärke der Linien, nicht über Farbe. Farbe ist knapp: Papier, Tinte, eine zweite Tinte für Nebeninformation und genau ein Signal, Bordeaux, für die nächste offene Frist.

Dunkel ist dieselbe Zeitung im Negativ: tiefes Druckerschwarz-Braun als Papier, lachsfarbene Schrift als Tinte. Die Signalfarbe bleibt Bordeaux.

**Key Characteristics:**
- Lachsrosa Zeitungspapier als Grund, fast schwarze Druckfarbe, ein einziges Signal-Bordeaux.
- Archivo mit Breiten-Achse (wdth 62 bis 100) für Kopf, Ressorts, Tabellen; Source Serif 4 für Lesetext.
- Druckerlinien statt Haarlinien: 3px über jedem Abschnitt, 1.5px als Trenner.
- Rechte Winkel überall; Tiefe nur über den getönten Papierton.
- Tabellenziffern in allen Datums-, Zeit- und Zählangaben.

## Colors

Zwei Papiertöne, zwei Tinten, ein Signal; im Dunkelmodus tauschen Papier und Tinte die Rollen, Bordeaux bleibt.

### Primary
- **Druckerschwärze** (tinte): Text, alle Linien, gefüllte Knöpfe, das Ticker-Band, Fokusring, Textauswahl. Die eigentliche Markenfarbe ist die Druckfarbe.

### Secondary
- **Signal-Bordeaux** (bordeaux) mit **Bordeaux-Papier** (auf-bordeaux) als Schrift darauf: ausschließlich die nächste offene Frist, im Ticker-Eintrag, in der Terminzeile und in deren Meldung. Kontrast 8.1:1.

### Neutral
- **Lachspapier** (papier): Seitengrund, Eingabefelder, Vorderseite der Karteikarte, Schrift auf Druckerschwärze.
- **Tiefes Lachspapier** (papier-tief): getönte Kästen („Auf einen Blick“), Rückseite der Karteikarte, Hover-Fläche des Rahmenknopfs.
- **Sepia-Tinte** (tinte-2): Nebeninformation (Anriss, Meta-Zeilen, Orte, Statuszeile, Listenmarker, abgehakte Fristen). 7.4:1 auf Lachspapier, 5.5:1 auf tiefem Lachspapier.
- **Dunkelmodus**: papier-dunkel, papier-tief-dunkel, tinte-dunkel, tinte-2-dunkel ersetzen die vier Neutralen eins zu eins über `prefers-color-scheme: dark` (Sepia-Tinte dunkel 8.1:1 auf dem Grund).

### Named Rules
**The Eine-Frist Rule.** Bordeaux markiert nur die eine nächste offene Frist (Abgabe oder Test), gleichzeitig im Ticker und in der Terminzeile. Keine Hervorhebung, kein Link, kein Knopf, kein Fehler wird bordeaux. Ist die Frist abgehakt, wandert das Signal zur nächsten.

**The Druckfarbe Rule.** Fehler werden nicht rot, sondern mit dem fetten Präfix „Fehler:“ in voller Tinte gesetzt. Zustand spricht über Wort und Gewicht, nicht über weitere Farben.

## Typography

**Display Font:** Archivo (variabel, wdth 62–125, wght 100–900), Fallback Arial Narrow, sans-serif
**Body Font:** Source Serif 4 (variabel, wght 200–900), Fallback Georgia, serif

Beide Schriften liegen selbst gehostet in `fonts/` (OFL 1.1, siehe `fonts/LIZENZ.txt`).

**Character:** Eine schwere Grotesk, die je nach Rolle enger oder weiter läuft, gegen eine ruhige Buchserif. Die Grotesk ist die Setzerei der Zeitung, die Serif die Redaktion.

### Hierarchy
- **Nameplate** (900, `calc(100cqw / 7.26)`, wdth 100, Versalien): „LERNHELFER“ füllt per Container-Query genau die Satzbreite. In der Ausgabe-Ansicht schrumpft er auf eine kleine Kopfzeile (clamp 2.25–3.25rem, am Handy 1.75rem).
- **Display** (900, clamp 3–6rem, wdth 62, Versalien): Fachname als Titel der Ausgabe.
- **Headline** (900, clamp 2.25–3.25rem, wdth 65, Versalien): Ressortname auf dem Titelblatt. Der Aufmacher steigt auf clamp 2.75–4.25rem, die drei Spalten darunter fallen auf clamp 1.75–2.25rem.
- **Title** (Source Serif 4, 750, 1.375rem, `text-wrap: balance`): Schlagzeilen. Aufmacher und Ausgabe-Kopf skalieren hoch (bis 2.75rem, 800, max 24–26ch).
- **Body** (Source Serif 4, 400, 1.0625rem/1.6): Zusammenfassung in einer Spalte von max 68ch; Kästen rechts 1rem; Anriss 1rem/1.5 in Sepia-Tinte, auf 3 Zeilen (Aufmacher 4) gekürzt.
- **Label** (850, 1.125rem, wdth 75, Versalien, 0.04em): Abschnittsköpfe wie „Termine der nächsten zwei Wochen“, „Auf einen Blick“, „Lexikon“.
- **Datumszeile** (650, 0.8125rem, wdth 90, Versalien, 0.06em, Tabellenziffern): Datum, Kalenderwoche, Universität; in der Ausgabe Datum und Modell.
- **Tabelle / Meta / Knopf** (Archivo 450–700, 0.8125–0.9375rem, wdth 85–92): Terminzeilen, Ausgabe-Nummer, Bedienelemente. Ressort-Codes in Terminzeilen und Ticker (z. B. „BWL VO 04“) in 800–850, wdth 75–78, Versalien.

### Named Rules
**The Breitenachse Rule.** Hierarchie in der Grotesk läuft über die Breite: je größer, desto schmaler (Nameplate 100, Display 62, Headline 65, Label 75, Knopf 85, Fließtabelle 92). Keine zweite Display-Schrift, keine Kursiv-Display-Serif, keine Mono-Etiketten.

**The Tabellenziffern Rule.** Jede Zahl in Zeit, Datum, Zählung und Frist steht in `font-variant-numeric: tabular-nums`.

**The Initiale Rule.** Der erste Absatz der Zusammenfassung beginnt mit einer dreizeiligen Initiale in Archivo 900, wdth 62 (3.6em), und einer halbfetten ersten Zeile. Nur dort, nur einmal pro Ausgabe.

## Layout

Eine Satzspalte mit max 1320px, seitlicher Rand `max(16px, min(4vw, 48px))`. Der Ticker läuft randabfallend über die volle Fensterbreite (negativer Rand).

- **Titelblatt:** Raster 1.7fr zu min 300px / 1fr mit 40px Spaltenabstand; links die Ressorts, rechts die Termine. Ressorts in einem 6er-Raster: ohne Aufmacher 2 × 2, mit Aufmacher (das Fach mit der nächsten offenen Frist) eine Geschichte über die volle Breite und drei Spalten darunter. Spalten werden durch eine 1.5px-Senkrechte getrennt, nie durch Abstand allein.
- **Ausgabe:** Kopf, dann Raster aus Artikel (fluid) und Randspalte (280–360px) mit 48px Abstand; zwischen beiden eine 1.5px-Spaltenlinie. Die Randspalte stapelt „Auf einen Blick“, „Nächstes Proseminar“, „Nächste Vorlesung“. Darunter Lexikon (gleiches Zweispaltenmaß) und Archiv.
- **Rhythmus:** 8px zwischen Bedienelementen, 14px von einer Druckerlinie zum Inhalt, 18px zwischen Blöcken, 40px vor großen Abschnitten (Lexikon, Archiv).
- **Unter 1080px:** alles einspaltig; „Auf einen Blick“ rückt vor den Artikel, Termine unter die Ressorts.
- **Unter 640px:** Ressorts untereinander ohne Senkrechte; Terminzeile zweispaltig, Frist unter den Text; in der Ausgabe fällt die Datumszeile des Zeitungskopfs weg und der Kopf schrumpft auf 1.75rem, damit „Auf einen Blick“ im ersten Bildschirm steht.

### Named Rules
**The Linie-über-Abschnitt Rule.** Jeder Abschnitt beginnt mit einer 3px-Druckerlinie und 14px Luft darunter. Trenner innerhalb (Tagesköpfe, Spaltensenkrechte, Rahmen) sind 1.5px. Terminzeilen trennt eine 1px-Linie in 25 % Tinte.

## Elevation & Depth

Flach wie Papier. Tiefe entsteht nur über den zweiten Papierton (tiefes Lachspapier) und über Linienstärke; „Auf einen Blick“ trägt dafür eine 6px-Kopflinie auf getöntem Grund. Einzige Ausnahme ist die Karteikarte im Lexikon: ein physisches Objekt, das sich in 3D umdreht und deshalb einen weichen Schatten trägt.

### Shadow Vocabulary
- **Karteikarte** (`box-shadow: 0 10px 24px -14px color-mix(in srgb, var(--tinte) 55%, transparent)`): nur auf Vorder- und Rückseite der Karteikarte.

### Named Rules
**The Papier-ist-flach Rule.** Ressorts, Kästen, Knöpfe und Felder haben keinen Schatten. Ein Schatten bedeutet „Gegenstand, den man in die Hand nimmt“, und das ist nur die Karteikarte.

## Shapes

Rechte Winkel ohne Ausnahme (`border-radius: 0` auch auf Select, Eingabe, Checkbox). Formen entstehen aus Linien: 3px Tinte für Abschnitte und Kartenrahmen, 1.5px für Knöpfe, Felder, Kästchen und Senkrechte. Einzige Glyphen sind ein Zurück-Winkel im Titelblatt-Link, ein Pfeil im Select und ein gedrehter Winkel als Aufklapp-Zeichen, alle als Linienzeichnung in currentColor.

## Components

### Buttons
Gesetzt wie ein Druckvermerk: Rahmen aus Tinte, kein Radius.
- **Shape:** rechtwinklig (0px), 1.5px Rahmen in Tinte, min 44px hoch.
- **Voll (Primär):** Druckerschwärze mit Papier-Schrift; eine pro Ansicht („Alle Ressorts neu drucken“, „Erste Ausgabe drucken“, „Gewusst“, „Speichern“).
- **Rahmen (Sekundär):** transparent; Hover füllt mit tiefem Lachspapier.
- **Hover voll:** Fläche und Rahmen wechseln auf Sepia-Tinte. **Disabled:** 45 % Deckkraft, kein Hover.
- **Fokus:** global 3px Tinte, 3px Abstand.

### Inputs / Fields
- **Style:** Lachspapier-Grund, 1.5px Tinte, 0px Radius, min 46px; Archivo 450, 1rem. Labels darüber in Archivo 700, wdth 88.
- **Select:** gleicher Rahmen, eigener Linienpfeil in Sepia-Tinte, min 44px.
- **Fokus:** 3px Tinte, im Feld ohne Abstand.

### Stimmzettel-Kästchen (Fristen abhaken)
22px Quadrat, 1.5px Rahmen, kein Radius. Abgehakt = ausgefüllt mit Tinte und 4px Papierrand innen, wie ein angekreuztes Wahlfeld. In der Bordeaux-Zeile invertiert (Rahmen und Füllung in Bordeaux-Papier). Erledigte Fristen werden in Sepia-Tinte durchgestrichen.

### Fristen-Ticker (Signatur)
Ein randabfallendes Band in Druckerschwärze mit Papier-Schrift, nur mit offenen Fristen: Code in Versalien 850/wdth 75, Titel, Datum, „Frist in n Tagen“. Einträge durch 1.5px-Senkrechte in 30 % Papier getrennt; die nächste Frist trägt Bordeaux. Das Band ist für eine nahtlose Schleife mindestens auf acht Einträge pro Hälfte aufgefüllt und läuft linear (8.5s pro Eintrag). Jeder Eintrag ist ein Knopf und öffnet die Meldung zum Termin. Hover (nur bei echten Zeigegeräten) oder Tastaturfokus hält das Band an; auf dem Touchscreen läuft es immer weiter. Bei reduzierter Bewegung steht es und lässt sich seitlich scrollen. Nur auf dem Titelblatt.

### Meldung (Termin-Details)
Modaler `<dialog>` auf Papier mit 3px-Rahmen rundum. Dachzeile „FACH · CODE · FRIST“ in Archivo-Versalien (Bordeaux, wenn es die nächste Frist ist), Titel in Source Serif 800, darunter eine Faktentabelle zwischen 1.5px-Linien (Wann mit Countdown, Wo, Art), dann der Info-Text aus der Ausgabe und eine Knopfreihe: Erledigt-Kästchen (nur Fristen), „Zur Fach-Ausgabe“, „Schließen“. Öffnet aus dem Ticker und aus jeder Terminzeile; Klick auf den Hintergrund oder Esc schließt.

### Formeln
LaTeX aus den Ausgaben wird mit KaTeX als MathML gesetzt; der Browser nimmt seine eigene Mathe-Schrift. Abgesetzte Formeln 1.15em mit eigenem waagrechten Scrollbereich, damit lange Gleichungen am Handy nicht die Spalte sprengen.

### Druckkosten
Wie der Preis im Zeitungskopf: die Datumszeile endet mit „Druckkosten Monat x $ · Guthaben y $“ (OpenRouter `/key` und `/credits`), der Kopf jeder Ausgabe mit „Preis x $“.

### Ressort-Spalte und Aufmacher
Keine Karte: eine Spalte unter einer 3px-Linie mit Ressortname (Headline), Schlagzeile (Serif), Anriss, Meta-Zeile („Nr. n · Datum · n Begriffe“) und einem Rahmenknopf am Spaltenfuß. Die ganze Spalte ist klickbar; Hover unterstreicht den Ressortnamen 3px. Während des Drucks ersetzt „Geht in Druck …“ den Knopf, darunter eine 4px-Walze, die sich von links füllt und ausblendet (1.6s, `cubic-bezier(0.16, 1, 0.3, 1)`; bei reduzierter Bewegung statisch).

### Terminkalender (Kurstabelle)
Tagesköpfe in Archivo 750 mit 1.5px-Unterlinie und Countdown („· heute“, „· in 3 Tagen“). Zeilen dreispaltig: Zeit (3.4rem), Code plus Termin plus Ort, rechts das Frist-Kästchen. Die nächste offene Frist ist eine randabfallende Bordeaux-Zeile.

### Karteikarte (Lexikon)
3px-Rahmen, min 15rem hoch, Begriff zentriert in Archivo 850/wdth 72, Rückseite in tiefem Lachspapier mit Definition in Serif. Dreht sich in 0.55s um die Y-Achse (bei reduzierter Bewegung sofort). Darunter zwei gleich breite Knöpfe „Nochmal“ (Rahmen) und „Gewusst“ (voll); die Liste aller Begriffe als Aufklapper mit gedrehtem Linienwinkel.

### Navigation
Eine schlichte Werkzeugleiste über dem Zeitungskopf: Archivo 500, 0.9375rem, ohne Unterstreichung, Hover unterstreicht. Archiv-Ausgaben als Datumsreihe; die aktuelle mit 3px-Unterstreichung und 850.

## Do's and Don'ts

### Do:
- **Do** jeden Abschnitt mit einer 3px-Tintenlinie öffnen und 14px darunter beginnen.
- **Do** Bordeaux nur für die eine nächste offene Frist verwenden (Eine-Frist Rule).
- **Do** Hierarchie in Archivo über Breite und Gewicht bauen und Lesetext in Source Serif 4 bei max 68ch setzen.
- **Do** alle Zahlen in Tabellenziffern setzen.
- **Do** jede neue Farbe als Paar für Hell und Dunkel auf `:root` anlegen; Kontrast mindestens 4.5:1 (WCAG AA).
- **Do** Bewegung bei `prefers-reduced-motion: reduce` abschalten (Ticker, Walze, Kartenwende).

### Don't:
- **Don't** Ressorts als gleich große Karten mit Icons anlegen; sie sind Zeitungsspalten mit Senkrechten (die Karteikarte im Lexikon ist das einzige Kartenobjekt).
- **Don't** Radien, Verläufe oder Schatten auf Papierflächen setzen.
- **Don't** Haarlinien unter 1px oder graue Trennlinien statt Tinte verwenden.
- **Don't** Fehler, Erfolg oder Links farbig markieren; Zustand über Wort und Gewicht.
- **Don't** eine zweite Display-Schrift, Kursiv-Display-Serifen oder Mono-Etiketten einführen.
- **Don't** über Ressortnamen oder Schlagzeilen Dachzeilen setzen.
