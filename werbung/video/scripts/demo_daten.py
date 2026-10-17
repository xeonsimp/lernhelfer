"""Erfundene Beispieldaten für die Werbe-Aufnahmen: vier Fächer, Ausgaben, Stundenplan, Noten, ein Vortrag.
Keine echten Unterlagen, Namen oder Noten. Schreibt nach demo/inhalt/ (gleicher Aufbau wie das Daten-Repo)."""
import json
from pathlib import Path

ZIEL = Path(__file__).resolve().parent.parent / "demo" / "inhalt"
TAG = "2026-10-19"  # Montag; die Aufnahmen laufen mit dieser Uhrzeit


def schreib(pfad, inhalt):
    p = ZIEL / pfad
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes((inhalt if isinstance(inhalt, str) else json.dumps(inhalt, ensure_ascii=False, indent=1)).encode("utf-8"))  # Zeilenenden unverändert (.ics braucht CRLF)


def ausgabe(fach, kopf, teile, daten, tag=TAG, fassung="Ultra-Fassung · "):
    text = f"*GPT-6 Luna · {fassung}{tag[8:]}.{tag[5:7]}.{tag[:4]} · Kosten 0.031 $*\n\n" + "\n\n".join(f"## {k}\n{v.strip()}" for k, v in teile)
    schreib(f"lernseiten/{fach}/{tag}.md", text + "\n\n```json\n" + json.dumps({"schlagzeile": kopf, **daten}, ensure_ascii=False) + "\n```\n")


STAMM = """### Termine und Orte
Laut Syllabus wöchentlich, Räume siehe Stundenplan.
### Leistungsbeurteilung
Laut Syllabus; Notenschlüssel ab 50 % Genügend.
### Regeln
Anwesenheitspflicht im PS, Abgaben über OLAT. KI-Nutzung laut Syllabus.
### Material und Kontakt
Folien und Übungsblätter in OLAT."""

ausgabe("Mathematik", "Ableitungen zeigen, wie schnell sich etwas ändert", [
    ("Auf einen Blick", """- Zuletzt dran: **VO 4 „Differentialrechnung I“** am 14. Oktober, die Ableitung als Steigung der Tangente.
- Heute um 16:00: **PS 3** mit Aufgaben zu den Ableitungsregeln.
- **Onlinetest 3** läuft bis **Montag, 26. Oktober, 08:00 Uhr** (5 Fragen, 5 Punkte).
- Mittwoch, 12:15: **VO 5 „Differentialrechnung II“** mit Grenzkosten und Elastizität."""),
    ("Zusammenfassung der letzten Einheit", r"""### Von der Sekante zur Tangente
Die Ableitung \(f'(x_0)\) misst, wie stark sich \(f\) an der Stelle \(x_0\) ändert. Man nähert sie über die Steigung der Sekante an und lässt den Abstand \(h\) gegen null gehen:
\[f'(x_0) = \lim_{h \to 0} \frac{f(x_0+h) - f(x_0)}{h}\]
### Die wichtigsten Regeln
Potenzregel \((x^n)' = n x^{n-1}\), Faktorregel, Summenregel sowie Produkt- und Kettenregel. Mit ihnen lässt sich fast jede Funktion aus den Folien ableiten, ohne den Grenzwert zu rechnen.
### Beispiel aus den Folien
Für die Kostenfunktion \(K(x) = 0{,}5x^2 + 4x + 100\) gilt \(K'(x) = x + 4\). Bei 20 Stück steigen die Kosten also um rund 24 GE je zusätzlichem Stück."""),
    ("Formeln Schritt für Schritt", r"""### Potenzregel
\[(x^n)' = n \cdot x^{n-1}\]
Andere Schreibweise: \(\frac{d}{dx}\,x^n = n\,x^{n-1}\). Zahlenbeispiel: \((x^3)' = 3x^2\), an der Stelle \(x = 2\) also \(12\).
### Kettenregel
\[\big(f(g(x))\big)' = f'(g(x)) \cdot g'(x)\]
In Worten: äußere Ableitung mal innere Ableitung. Zahlenbeispiel: \(\big((2x+1)^3\big)' = 3(2x+1)^2 \cdot 2 = 6(2x+1)^2\).
### Grenzkosten
\[K'(x) = \frac{dK}{dx}\]
Aus \(K(x) = 0{,}5x^2 + 4x + 100\) folgt \(K'(x) = x + 4\). Nach \(x\) umgestellt: \(x = K'(x) - 4\). Bei Grenzkosten von 34 GE also \(x = 30\)."""),
    ("Nächstes Proseminar", """**PS 3, heute 16:00:** Ableitungsregeln. Vorbereiten: Blatt 3, Aufgaben 1 bis 4.
**Onlinetest 3** (Differentialrechnung) ist offen bis Montag, 26. Oktober, 08:00 Uhr. Darin: Ableitungen von Potenz- und Exponentialfunktionen und eine Anwendung mit Grenzkosten."""),
    ("Übungsaufgaben", r"""### Übung · Potenzregel
Leite \(f(x) = 3x^4 - 2x^2 + 7\) ab.
#### Lösung
Jeden Summanden einzeln ableiten: \(12x^3 - 4x\). Die Konstante fällt weg.
**\(f'(x) = 12x^3 - 4x\)**

### Übung · Grenzkosten
Gegeben ist \(K(x) = 0{,}5x^2 + 4x + 100\). Wie hoch sind die Grenzkosten bei \(x = 30\)?
#### Lösung
\(K'(x) = x + 4\), also \(K'(30) = 34\).
**34 GE pro Stück**

### Übung · Produktregel
Leite \(g(x) = x^2 e^{x}\) ab.
#### Lösung
\((uv)' = u'v + uv'\) mit \(u = x^2\), \(v = e^x\): \(2x e^x + x^2 e^x\).
**\(g'(x) = e^x (x^2 + 2x)\)**"""),
    ("Nächste Vorlesung", """**VO 5, Mittwoch 12:15:** Differentialrechnung II. Grenzkosten, Grenzerlös und Elastizität. Vorher die Ableitungsregeln wiederholen."""),
    ("Stammdaten", STAMM),
], {"quellen": ["VO 4 Differentialrechnung I.pdf", "PS Blatt 3.pdf", "Syllabus Mathematik.pdf"],
    "termine": [
        {"datum": "2026-10-19", "zeit": "16:00", "art": "PS", "code": "PS 3", "titel": "Ableitungsregeln", "ort": None, "info": "Blatt 3, Aufgaben 1 bis 4 vorbereiten."},
        {"datum": "2026-10-21", "zeit": "12:15", "art": "VO", "code": "VO 5", "titel": "Differentialrechnung II", "ort": None, "info": "Grenzkosten, Grenzerlös und Elastizität."},
        {"datum": "2026-10-26", "zeit": "08:00", "art": "Test", "code": "OT 3", "titel": "Onlinetest 3: Differentialrechnung", "ort": None, "info": "Offen seit 19. Oktober, 5 Fragen, 5 Punkte."}],
    "begriffe": [{"begriff": b, "definition": d} for b, d in [
        ("Ableitung", "Die momentane Änderungsrate einer Funktion an einer Stelle, geometrisch die Steigung der Tangente."),
        ("Differenzenquotient", "Steigung der Sekante zwischen zwei Punkten einer Funktion."),
        ("Tangente", "Gerade, die den Graphen in einem Punkt berührt und dort dieselbe Steigung hat."),
        ("Potenzregel", "Die Ableitung von xⁿ ist n·xⁿ⁻¹."),
        ("Produktregel", "(u·v)' = u'·v + u·v'."),
        ("Kettenregel", "Äußere Ableitung mal innere Ableitung."),
        ("Grenzkosten", "Zusätzliche Kosten für ein weiteres Stück, die Ableitung der Kostenfunktion."),
        ("Grenzerlös", "Zusätzlicher Erlös für ein weiteres verkauftes Stück, die Ableitung der Erlösfunktion."),
        ("Lineare Funktion", "Funktion der Form f(x) = a·x + b mit konstanter Steigung a."),
        ("Stetigkeit", "Eine Funktion ist stetig, wenn ihr Graph ohne Sprung gezeichnet werden kann."),
        ("Monotonie", "Eine Funktion ist steigend, wenn ihre Ableitung positiv ist, fallend, wenn sie negativ ist."),
        ("Extremstelle", "Stelle, an der f'(x) = 0 ist und die Ableitung das Vorzeichen wechselt.")]],
    "pruefungen": [{"datum": "2027-02-03", "zeit": "09:00", "titel": "VO-Prüfung"}]})

ausgabe("VWL", "Wie stark reagiert die Nachfrage auf den Preis?", [
    ("Auf einen Blick", """- Zuletzt dran: **VO 3 „Angebot und Nachfrage“**, Marktgleichgewicht und Verschiebungen.
- Dienstag, 08:00: **VO 4 „Elastizitäten“**.
- **Übungsblatt 2** abgeben bis **Donnerstag, 22. Oktober, 23:59 Uhr**.
- Freitag, 10:00: **PS 3** bespricht Blatt 2."""),
    ("Zusammenfassung der letzten Einheit", r"""### Marktgleichgewicht
Im Gleichgewicht ist die angebotene Menge gleich der nachgefragten: \(S(p) = D(p)\). Daraus folgen Gleichgewichtspreis und -menge.
### Verschiebungen
Steigt das Einkommen, verschiebt sich die Nachfrage nach normalen Gütern nach rechts; Preis und Menge steigen."""),
    ("Nächstes Proseminar", "**PS 3, Freitag 10:00:** Besprechung von Übungsblatt 2 (Elastizitäten)."),
    ("Übungsaufgaben", r"""### Übung · Gleichgewicht
\(D(p) = 100 - 2p\), \(S(p) = 3p - 20\). Wie hoch ist der Gleichgewichtspreis?
#### Lösung
\(100 - 2p = 3p - 20\), also \(5p = 120\).
**p = 24**"""),
    ("Nächste Vorlesung", "**VO 4, Dienstag 08:00:** Elastizitäten."),
    ("Stammdaten", STAMM),
], {"quellen": ["VO 3 Angebot und Nachfrage.pdf", "Übungsblatt 2.pdf"],
    "termine": [
        {"datum": "2026-10-20", "zeit": "08:00", "art": "VO", "code": "VO 4", "titel": "Elastizitäten", "ort": None, "info": "Preiselastizität der Nachfrage."},
        {"datum": "2026-10-22", "zeit": "23:59", "art": "Abgabe", "code": "Blatt 2", "titel": "Übungsblatt 2: Elastizitäten", "ort": None, "info": "Abgabe als PDF in OLAT."},
        {"datum": "2026-10-23", "zeit": "10:00", "art": "PS", "code": "PS 3", "titel": "Besprechung Blatt 2", "ort": None, "info": "Blatt 2 mitbringen."}],
    "begriffe": [{"begriff": b, "definition": d} for b, d in [
        ("Marktgleichgewicht", "Preis, bei dem angebotene und nachgefragte Menge gleich sind."),
        ("Preiselastizität", "Prozentuale Mengenänderung geteilt durch prozentuale Preisänderung."),
        ("Normales Gut", "Gut, dessen Nachfrage mit dem Einkommen steigt."),
        ("Inferiores Gut", "Gut, dessen Nachfrage mit steigendem Einkommen sinkt."),
        ("Konsumentenrente", "Differenz zwischen Zahlungsbereitschaft und gezahltem Preis."),
        ("Produzentenrente", "Differenz zwischen erzieltem Preis und Mindestpreis der Anbieter."),
        ("Substitut", "Gut, das ein anderes ersetzen kann."),
        ("Komplement", "Gut, das zusammen mit einem anderen genutzt wird.")]],
    "pruefungen": [{"datum": "2026-11-18", "zeit": "10:00", "titel": "Zwischentest"}]})

ausgabe("BWL", "Ab wann sich ein Produkt rechnet", [
    ("Auf einen Blick", """- Zuletzt dran: **VO 3 „Kosten und Leistungen“**, fixe und variable Kosten.
- Donnerstag, 14:00: **VO 4 „Break-even-Analyse“**.
- **Fallstudie 1** abgeben bis **Dienstag, 27. Oktober, 12:00 Uhr**."""),
    ("Zusammenfassung der letzten Einheit", r"""### Fixe und variable Kosten
Fixkosten fallen unabhängig von der Menge an, variable Kosten steigen mit ihr: \(K(x) = K_f + k_v x\)."""),
    ("Nächstes Proseminar", "Kein PS in dieser Woche."),
    ("Übungsaufgaben", r"""### Übung · Break-even
Fixkosten 12 000 €, Preis 50 €, variable Stückkosten 20 €. Ab welcher Menge entsteht Gewinn?
#### Lösung
\(12\,000 / (50 - 20) = 400\).
**ab 400 Stück**"""),
    ("Nächste Vorlesung", "**VO 4, Donnerstag 14:00:** Break-even-Analyse."),
    ("Stammdaten", STAMM),
], {"quellen": ["VO 3 Kosten und Leistungen.pdf"],
    "termine": [
        {"datum": "2026-10-22", "zeit": "14:00", "art": "VO", "code": "VO 4", "titel": "Break-even-Analyse", "ort": None, "info": "Deckungsbeitrag und Gewinnschwelle."},
        {"datum": "2026-10-27", "zeit": "12:00", "art": "Abgabe", "code": "FS 1", "titel": "Fallstudie 1: Kostenstruktur", "ort": None, "info": "Abgabe in Zweiergruppen über OLAT."}],
    "begriffe": [{"begriff": b, "definition": d} for b, d in [
        ("Fixkosten", "Kosten, die unabhängig von der produzierten Menge anfallen."),
        ("Variable Kosten", "Kosten, die mit der Menge steigen."),
        ("Deckungsbeitrag", "Preis minus variable Stückkosten."),
        ("Break-even-Punkt", "Menge, bei der Erlöse und Kosten gleich sind."),
        ("Stückkosten", "Gesamtkosten geteilt durch die Menge."),
        ("Leistung", "Bewerteter Output einer Periode.")]],
    "pruefungen": [{"datum": "2027-02-10", "zeit": "14:00", "titel": "VO-Prüfung"}]})

ausgabe("Englisch", "Pitching an idea in three minutes", [
    ("Auf einen Blick", """- Zuletzt dran: **Unit 3 „Presentations“**, signposting language.
- Dienstag, 12:00: **PS Unit 4** „Meetings“.
- **Presentation outline** abgeben bis **Mittwoch, 21. Oktober, 18:00 Uhr**."""),
    ("Zusammenfassung der letzten Einheit", """### Signposting
Phrases like *first of all*, *moving on to* and *to sum up* guide the audience through a talk."""),
    ("Nächstes Proseminar", "**PS Unit 4, Dienstag 12:00:** Meetings. Outline bis Mittwoch abgeben."),
    ("Übungsaufgaben", """### Übung · Signposting
Ergänze: „___ to the second point, our costs.“
#### Lösung
**Moving on**"""),
    ("Nächste Vorlesung", "Keine Vorlesung, nur PS."),
    ("Stammdaten", STAMM),
], {"quellen": ["Unit 3 Presentations.pdf"],
    "termine": [
        {"datum": "2026-10-20", "zeit": "12:00", "art": "PS", "code": "Unit 4", "titel": "Meetings", "ort": None, "info": "Rollenspiel vorbereiten."},
        {"datum": "2026-10-21", "zeit": "18:00", "art": "Abgabe", "code": "Outline", "titel": "Presentation outline", "ort": None, "info": "Eine Seite, Upload in OLAT."}],
    "begriffe": [{"begriff": b, "definition": d} for b, d in [
        ("Signposting", "Wendungen, die durch einen Vortrag führen, etwa „moving on to“."),
        ("Pitch", "Kurze Präsentation, die von einer Idee überzeugen soll."),
        ("Call to action", "Aufforderung am Ende eines Vortrags."),
        ("Hedging", "Vorsichtige Formulierung, etwa „it seems that“.")]],
    "pruefungen": []})

# Unterlagen (nur Titel und ein Satz, damit die Fächer existieren)
for fach, dateien in {"Mathematik": ["VO 4 Differentialrechnung I.pdf", "PS Blatt 3.pdf", "Syllabus Mathematik.pdf"], "VWL": ["VO 3 Angebot und Nachfrage.pdf", "Übungsblatt 2.pdf"],
                      "BWL": ["VO 3 Kosten und Leistungen.pdf"], "Englisch": ["Unit 3 Presentations.pdf"]}.items():
    schreib(f"faecher/{fach}.json", {"dateien": [{"datei": d, "art": "syllabus" if "Syllabus" in d else "ps" if "PS" in d or "Blatt" in d else "folien", "text": "Beispieltext."} for d in dateien]})

# Stundenplan wie aus LFU:online, mit erfundenen LV-Nummern
def ics(nr, titel, erster, beginn, ende):
    ev = (f"BEGIN:VEVENT\r\nUID:26W_{nr}_demo@example.com\r\nSUMMARY:{titel} (LV {nr}-0 26W)\r\nDTSTART:{erster}T{beginn}00\r\nDTEND:{erster}T{ende}00\r\n"
          f"RRULE:FREQ=WEEKLY;UNTIL=20270131\r\nLOCATION:HS {nr[-1]}\r\nEND:VEVENT\r\n")
    schreib(f"kalender/26W_{nr}.ics", "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Demo//DE\r\n" + ev + "END:VCALENDAR\r\n")


ics("499101", "VO Mathematik", "20261007", "1215", "1345")
ics("499102", "PS Mathematik", "20261005", "1600", "1730")
ics("499203", "VO Grundlagen der Volkswirtschaft", "20261006", "0800", "0930")
ics("499204", "PS Grundlagen der Volkswirtschaft", "20261009", "1000", "1130")
ics("499305", "VO Einführung in die Betriebswirtschaft", "20261008", "1400", "1530")
ics("499406", "PS English for Business Communication", "20261006", "1200", "1330")

schreib("abgleich.json", {"zeit": "2026-10-19T07:30", "ok": True, "text": "3 neue Dateien in Mathematik und VWL."})

# Noten: erfundene Punkte
schreib("noten.json", {"lv": {"Mathematik PS": {"ects": 4, "gesamt": 40, "schluessel": None, "note": None},
                              "VWL PS": {"ects": 4, "gesamt": 40, "schluessel": None, "note": None},
                              "Englisch PS": {"ects": 3, "gesamt": 30, "schluessel": None, "note": None}},
                       "eintraege": [
    {"id": "m1", "lv": "Mathematik PS", "titel": "Onlinetest 1", "datum": "2026-10-05", "punkte": 3, "max": 5, "schnitt": 3.2},
    {"id": "m2", "lv": "Mathematik PS", "titel": "Onlinetest 2", "datum": "2026-10-12", "punkte": 4, "max": 5, "schnitt": 3.4},
    {"id": "m3", "lv": "Mathematik PS", "titel": "Hausübung 1", "datum": "2026-10-15", "punkte": 9, "max": 10, "schnitt": 7.1},
    {"id": "v1", "lv": "VWL PS", "titel": "Übungsblatt 1", "datum": "2026-10-09", "punkte": 7, "max": 10, "schnitt": 6.8},
    {"id": "v2", "lv": "VWL PS", "titel": "Onlinetest 1", "datum": "2026-10-16", "punkte": 4.5, "max": 5, "schnitt": 3.9},
    {"id": "e1", "lv": "Englisch PS", "titel": "Word Power Journal 1", "datum": "2026-10-13", "punkte": 8, "max": 10, "schnitt": 7.5}],
                       "pruefungen": [{"id": "p1", "fach": "VWL", "titel": "Zwischentest", "datum": "2026-11-18", "zeit": "10:00", "quelle": "ausgabe"},
                                      {"id": "p2", "fach": "Mathematik", "titel": "VO-Prüfung", "datum": "2027-02-03", "zeit": "09:00", "quelle": "ausgabe"},
                                      {"id": "p3", "fach": "BWL", "titel": "VO-Prüfung", "datum": "2027-02-10", "zeit": "14:00", "quelle": "ausgabe"}], "proben": []})

# Vortrag: erfundene Probe-Präsentation fürs Englisch-PS, als Datei (kein Video, keine Person)
zeilen = [
    (0, "Good morning everyone. Today I want to pitch an idea for a student café on campus."),
    (6, "Uh, first of all, let me show you why we need it."),
    (12, "Right now there is only one place to get coffee, and at ten o'clock the line is, um, very long."),
    (21, "We asked forty students, and most of them said they would buy there every day."),
    (29, "Moving on to the costs. The rent is low because the university has a free room."),
    (37, "So, uh, our break-even is at about eighty cups a day."),
    (45, "Uh, the menu would be simple: coffee, tea and sandwiches."),
    (52, "To sum up, a small café would save time and, um, make campus a nicer place."),
    (60, "Thank you. I'm happy to take your questions."),
]
schreib("vortraege/2026-10-16-demo.json", {
    "id": "2026-10-16-demo", "titel": "Pitch: a student café on campus", "datum": "2026-10-16", "quelle": {"art": "datei", "name": "pitch-probe.m4a"},
    "kontext": "Englisch-PS, Pitch, drei Minuten", "dauer": 64, "zeilen": [{"t": t, "s": s} for t, s in zeilen],
    "analyse": {"sprache": "Englisch", "thema": "Studentisches Café", "note": 2, "punkte": 80,
                "urteil": "Ein klar gebauter Pitch mit sicherem Signposting. Die Füllwörter kommen an Übergängen und vor der wichtigsten Zahl; dort lohnt eine kurze Pause statt „uh“.",
                "kriterien": [{"name": "Aufbau", "punkte": 9, "kommentar": "Einstieg, Problem, Kosten und Schluss sind klar getrennt; „moving on to“ (0:29) führt sauber weiter."},
                              {"name": "Sprache", "punkte": 8, "kommentar": "Treffende Wortwahl, einfache und korrekte Sätze."},
                              {"name": "Vortragsweise", "punkte": 7, "kommentar": "Fünf äh-Laute, vor allem an Übergängen (0:06, 0:45) und vor der Break-even-Zahl (0:37)."}],
                "staerken": ["Klarer Einstieg mit der Idee im ersten Satz (0:00)", "Saubere Übergänge mit „first of all“ und „to sum up“"],
                "tipps": [{"titel": "Pause statt „uh“", "warum": "Vor Zahlen kommt jedes Mal ein Füllwort (0:37).", "uebung": "Den Kostenteil dreimal laut lesen und vor jeder Zahl bewusst eine Sekunde schweigen."}],
                "fuellwoerter": [{"wort": "so", "anzahl": 1}],
                "befunde": [{"zeit": "0:37", "art": "fuellwort", "zitat": "So, uh, our break-even is at about eighty cups a day.", "problem": "Füllwort direkt vor der wichtigsten Zahl schwächt sie.", "besser": "Our break-even is at about eighty cups a day."},
                            {"zeit": "0:21", "art": "wortwahl", "zitat": "most of them said they would buy there", "problem": "„buy there“ bleibt vage.", "besser": "most of them said they would buy their coffee there"}],
                "ger": {"gesamt": "B2", "skalen": [
                    {"name": "Spektrum", "niveau": "B2", "begruendung": "Passender Wortschatz für einen Pitch, etwa „break-even“ (0:37).", "naechste": "Für C1: mehr Varianten statt einfacher Verben wie „get“ (0:12)."},
                    {"name": "Korrektheit", "niveau": "C1", "begruendung": "Keine auffälligen Grammatikfehler im ganzen Transkript.", "naechste": "Für C2: auch komplexe Sätze durchgehend sicher."},
                    {"name": "Flüssigkeit", "niveau": "B2", "begruendung": "Gleichmäßiges Tempo, aber äh-Laute an Übergängen (0:06, 0:45) und vor Zahlen (0:37).", "naechste": "Für C1: Zahlen ohne Suchpausen nennen."},
                    {"name": "Kohärenz", "niveau": "C1", "begruendung": "Signposting mit „first of all“, „moving on to“, „to sum up“.", "naechste": "Für C2: Übergänge noch variabler."},
                    {"name": "Vor Publikum sprechen", "niveau": "B2", "begruendung": "Klare Ansprache und Einladung zu Fragen (1:00).", "naechste": "Für C1: das Publikum direkter einbinden."}]}},
    "kosten": 0.02, "bilder": 0, "bewertet": "2026-10-16T18:20:00.000Z"})
# ---------- Zusätzlich für das lange Reel ----------
# Reflexion zum Vortrag
REFLEXION = {"fazit": "Deine Einschätzung trifft fast überall. Die äh-Laute hast du richtig bemerkt, sie kommen aber vor allem an Übergängen.",
             "punkte": [{"feld": "gut", "aussage": "Der Einstieg war klar.", "urteil": "stimmt", "begruendung": "Die Idee steht im ersten Satz (0:00), das Publikum weiß sofort, worum es geht."},
                        {"feld": "schlecht", "aussage": "Bei den Kosten war ich zu schnell.", "urteil": "teilweise", "begruendung": "Das Tempo bleibt gleichmäßig; auffällig ist eher das „uh“ direkt vor der Break-even-Zahl (0:37)."},
                        {"feld": "besser", "aussage": "Nächstes Mal weniger äh sagen.", "urteil": "stimmt", "begruendung": "Fünf äh-Laute in gut einer Minute, an Übergängen (0:06, 0:45) und vor Zahlen (0:37)."}],
             "uebersehen": ["Am Schluss fehlt ein klarer Call to Action vor „Thank you“ (1:00)."]}
v = json.loads((ZIEL / "vortraege/2026-10-16-demo.json").read_text("utf-8"))
v["analyse"]["reflexion"] = REFLEXION
schreib("vortraege/2026-10-16-demo.json", v)

# Frühere Ausgabe in Mathematik (Archiv)
ausgabe("Mathematik", "Funktionen beschreiben Zusammenhänge", [
    ("Auf einen Blick", "- Zuletzt dran: **VO 3 „Funktionen“** am 7. Oktober.\n- **Onlinetest 2** läuft bis Montag, 19. Oktober, 08:00 Uhr."),
    ("Zusammenfassung der letzten Einheit", r"### Lineare Funktionen" + "\n" + r"Eine lineare Funktion \(f(x) = a x + b\) hat überall dieselbe Steigung \(a\)."),
    ("Nächstes Proseminar", "**PS 2:** Funktionen und ihre Graphen."),
    ("Nächste Vorlesung", "**VO 4:** Differentialrechnung I."),
    ("Stammdaten", STAMM),
], {"quellen": ["VO 3 Funktionen.pdf"], "termine": [], "begriffe": [{"begriff": "Steigung", "definition": "Änderung von f(x) je Einheit von x."}], "pruefungen": []},
    tag="2026-10-12", fassung="")

# Onlinetests wie vom PC gelesen (erfunden); laufende Tests ohne Fragen
OLAT2 = """Frage 1
Max. 1 Punkt
Bestimmen Sie die Steigung der Geraden f(x)= 4x - 7. [4.0]

Frage 2
Max. 1 Punkt
Wo schneidet f(x)= 2x + 6 die x-Achse? x = [-3.0]"""
schreib("onlinetests.json", [
    {"fach": "Mathematik", "titel": "Onlinetest 3: Differentialrechnung", "art": "test", "von": "2026-10-19T08:00", "bis": "2026-10-26T08:00", "punkte": 5, "startseite": "5 Fragen, 1 Versuch.", "fragen": None},
    {"fach": "VWL", "titel": "Onlinetest 2: Elastizitäten", "art": "test", "von": "2026-10-23T12:00", "bis": "2026-10-30T12:00", "punkte": 5, "startseite": "", "fragen": None},
    {"fach": "Mathematik", "titel": "Selbsttest Ableitungen", "art": "selbsttest", "startseite": "Zum Üben, beliebig oft.", "fragen": None},
    {"fach": "Englisch", "titel": "Vocabulary quiz Unit 3", "art": "test", "uebung": True, "startseite": "Practice only.", "fragen": None},
    {"fach": "Mathematik", "titel": "Onlinetest 2: Funktionen", "art": "test", "von": "2026-10-12T08:00", "bis": "2026-10-19T08:00", "punkte": 5, "ergebnis": "4 von 5 Punkten",
     "startseite": "5 Fragen, 1 Versuch. Runden Sie auf eine Nachkommastelle.", "fragen": OLAT2},
    {"fach": "VWL", "titel": "Onlinetest 1: Angebot und Nachfrage", "art": "test", "von": "2026-10-09T12:00", "bis": "2026-10-16T12:00", "punkte": 5, "ergebnis": "4,5 von 5 Punkten", "startseite": "5 Fragen.", "fragen": None},
])

# Prüfungstraining: Schwächen-Training und Lernskript, so wie die App sie speichert
schreib("training/Mathematik.md", r"""*Stand 19.10.2026*

## Woran es hakt
- **Kettenregel:** In der Probeklausur zweimal die innere Ableitung vergessen.
- **Grenzkosten:** In der Probeklausur \(K(x)\) statt \(K'(x)\) eingesetzt.
- **Exponentialfunktion:** \((e^{2x})'\) als \(e^{2x}\) statt \(2e^{2x}\) abgeleitet.

## Übungsaufgaben
### Training · Kettenregel
Leite \(h(x) = (4x - 1)^3\) ab.
#### Lösung
Außen \(u^3\), innen \(u = 4x - 1\): \(3(4x-1)^2 \cdot 4\).
**\(h'(x) = 12(4x-1)^2\)**

### Training · Grenzkosten
\(K(x) = x^2 + 10x + 50\). Wie hoch sind die Grenzkosten bei \(x = 5\)?
#### Lösung
\(K'(x) = 2x + 10\), also \(K'(5) = 20\).
**20 GE pro Stück**""")
schreib("lernskripte/Mathematik.md", r"""*Stand 19.10.2026*

## Funktionen
Lineare Funktionen \(f(x) = a x + b\) mit Steigung \(a\) und Achsenabschnitt \(b\).

## Differentialrechnung
Die Ableitung ist die Steigung der Tangente. Regeln: Potenz-, Faktor-, Summen-, Produkt- und Kettenregel.

## Formelsammlung
- \((x^n)' = n x^{n-1}\)
- \((u v)' = u'v + u v'\)
- \(\big(f(g(x))\big)' = f'(g(x)) \cdot g'(x)\)

## Begriffe
Ableitung, Tangente, Grenzkosten, Grenzerlös, Extremstelle.

## Prüfungs-Checkliste
- Alle Ableitungsregeln ohne Formelblatt
- Grenzkosten aus einer Kostenfunktion
- Extremstellen bestimmen""")

print("Beispieldaten in", ZIEL)
