# Lernhelfer-Reel „Alles drin“: Storyboard

Langfassung als Reel-Post: 9:16, 1080 × 1920, 60 fps, 2:38 min (9460 Frames); dieselben Szenen auch als 16:9, 1920 × 1080 (Text links, App rechts). Zügiges Grundtempo: `TEMPO` in `src/reel.tsx` steht überall auf 1 (die ruhigere Fassung mit 4:24 min war zu langsam). Erzählt aus der Sicht eines gestressten Erstsemesters, umgangssprachlich, in der Ich-Form; die App antwortet sachlich. Texte bleiben zwischen y = 250 und y = 1570.

Voice-over: Der Erstsemester spricht seine Gedanken, 35 kurze Sätze, gesprochen von ElevenLabs Eleven v4 Turbo (Sprecher „liam“, über OpenRouter), ohne Abkürzungen (Proseminar statt PS). Die Sätze stehen bei den Szenen in `src/reel.tsx` (`stimme`), jeder hängt an einem Zeitpunkt der Szene (meist dem Erscheinen des Gedankens) und muss enden, bevor der nächste beginnt. Sie wiederholen das Bild nicht Wort für Wort: Details wie Preise im Kleingedruckten, Rabatte oder Dateiformate stehen nur im Bild. Das Video bleibt auch ohne Ton verständlich.
Gleiches Design wie der kurze Spot (Punktraster, gezeichnete Rahmen, gelber Marker), aber alle Szenen hell, damit die weißen App-Karten immer auf Papier liegen. Musik: eigener Lo-fi-Track (`scripts/musik.mjs`), unter Effekten 6 dB leiser. Alle App-Bilder sind echte Aufnahmen der lokalen App mit erfundenen Beispieldaten und klein mit „Beispieldaten“ beschriftet.
Die KI-Antworten in den Chats kommen von einer lokalen Attrappe statt von OpenRouter: Die Texte sind vorgeschrieben und halten sich an das, was in den Beispiel-Unterlagen steht.

| # | Szene | Gedanke im Bild (Ich-Form) | Was die App zeigt |
|---|---|---|---|
| 1 | Hook | „Sonntag, 23:14.“ „Morgen PS in Mathe.“ „Und ich hab keinen Plan, was diese Woche dran war.“ | Dateien stapeln sich |
| 2 | Abgleich | „Okay. Lernhelfer.“ „Einmal am PC oder Mac einrichten. Ab dann holt er Folien, PS-Blätter und Onlinetests selbst aus OLAT.“ „Nur iPad? Dann lädst du die Dateien selbst hoch.“ | Gezeichneter Laptop → Handy, „zuletzt abgeglichen“, Seite Unterlagen; klein: „Dein OLAT-Passwort sieht er nie.“ |
| 3 | Heute | „Montag, 8:40. Was ist eigentlich fällig?“ | Heute mit Fristen der nächsten zwei Wochen, eine wird abgehakt, die Woche |
| 4 | Wochenausgabe | „Mathe antippen. Da ist die ganze Woche.“ „Ultra-Fassung: mehr als doppelt so ausführlich.“ | Auf einen Blick, Zusammenfassung, Formeln Schritt für Schritt, nächstes PS, Lexikon |
| 5 | Rückfrage zur Ausgabe | „Und wenn ich’s trotzdem nicht check?“ „Fragen, wie du redest. Antwort nur aus deinen Unterlagen.“ „Was nicht drinsteht, erfindet er nicht.“ | Chat: lange, verzweifelte Frage zur Kettenregel, Antwort mit Beispiel; zweite Frage „kommt das in der Prüfung??“, ehrliche Antwort |
| 6 | Übungen | „Erst selbst rechnen. Dann aufdecken.“ | Übungsaufgabe, Lösung aufgedeckt |
| 7 | Karteikarten | „Begriffe abfragen. Was sitzt, kommt seltener.“ | Karte dreht sich, Wiederholung nach 1, 3, 7, 14, 30 Tagen, Export für Anki und Quizlet |
| 8 | Frag den Lernhelfer | „Wo ist eigentlich mein VWL-PS?“ „Kennt Stundenplan, Fristen und alle Ausgaben.“ | Chat auf Heute: Frage in Umgangssprache, Antwort mit Tag, Uhrzeit, Raum und Abgabe davor |
| 9 | Kalender | „Mein ganzer Stundenplan. Mit Thema jeder Einheit.“ „Fristen ins iPad, mit Erinnerung.“ | Wochenansicht, „Neue Fristen übernehmen“; Erinnerung 1 Tag und 2 Std. vorher |
| 10 | Onlinetests | „Welcher Test ist offen? Bis wann?“ „Ohne PC: Test per Foto.“ „Vorbei und nicht kapiert?“ | Überblick, Formular „Test per Foto“, Lösungsweg an einer gleichartigen Aufgabe mit anderen Zahlen (nur abgelaufener Test) |
| 11 | Noten und Prüfung | „Wie steh ich eigentlich?“ „30 Tage bis zum Zwischentest.“ | Notentracker mit Prognose, Countdown, Lernplan mit zwei Tagen Puffer |
| 12 | Probeklausur | „Generalprobe.“ | Probeklausur mit Zeitlimit, danach Punkte, Note, Lösungswege |
| 13 | Training, Lernskript | „Üben, wo’s hakt.“ „Der ganze Stoff als Lernskript. Auch als PDF.“ | Schwächen-Training, Lernskript, PDF-Knopf |
| 14 | Podcast | „Keine Lust zu lesen? Hör’s dir im Bus an.“ | „Zum Anhören“: Lena fragt, Max erklärt, rund 10 Minuten |
| 15 | Vortrag | „Freitag Präsentation in Englisch. Panik.“ „Feedback mit Zeitstempel und GER-Niveau.“ „Und ein Coach für Rückfragen.“ | Transkript mit jedem „uh“, Reflexion im Abgleich, GER, Befund mit Zeitstempel, Coach-Chat; klein: „Das Video bleibt auf deinem Gerät.“ |
| 16 | Kleinkram | „Und sonst so?“ | Frühere Ausgaben, „Alle Fächer neu erstellen“, eigener Stil für die KI, Modellwahl, hell und dunkel, Unterlagen bleiben privat |
| 17 | Tarife | „Und was kostet das?“ | Base 0 €, Pro 4,90 €, Ultra 9,90 €, Ultra+ API 14,90 € im Monat, kein Abo; Freunde sparen bis zu 30 % |
| 18 | Schluss | „Sonntag, 23:31. Ich check’s.“ | Call to Action wie im kurzen Spot |

## Quellen und Grenzen

- Funktionen: `werbung/prompt.md` (Liste 1–33) und die Anleitung in `index.html`. Preise und Rabatte aus `TARIFE` in `server/server.mjs` (Pro 490, Ultra 990, Ultra+ API 1490 Cent; Rabatt 20 % bzw. 30 %).
- Alle Inhalte (Fächer, Termine, Punkte, Chat-Fragen und -Antworten, Vortrag) sind erfunden: `scripts/demo_daten.py`, `scripts/aufnehmen_lang.py`.
- Bewusst nicht drin: voller Löser, Hausaufgaben-Entwurf, Admin-Ecke, Word Power (laut Anleitung privat mit eigenem Passwort), Lösungen laufender Onlinetests, Logos, echte Personen.

## Rendern

Aus `werbung/video` (Node 22, Python 3 mit `pip install imageio-ffmpeg`, für die Stimme ein OpenRouter-Key in `OPENROUTER_API_KEY`):

1. `node scripts/musik.mjs` erzeugt die Musik `public/sfx/musik-reel.wav` (nicht im Repo).
2. `python scripts/stimme.py` spricht alle neuen oder geänderten Sätze (kostenlos mit `--edge` und `pip install edge-tts`), bearbeitet sie und prüft, ob jeder in sein Fenster passt. Ist einer zu lang, nennt das Skript ihn: dann den Text kürzen und erneut aufrufen.
3. `npx remotion render src/index.ts Lernhelfer-Reel out/roh-reel-9x16.mp4` und `npx remotion render src/index.ts Lernhelfer-Reel-16x9 out/roh-reel-16x9.mp4`.
4. `python scripts/normalisieren.py out/roh-reel-9x16.mp4 out/lernhelfer-reel-9x16.mp4`, ebenso für 16:9 (−14 LUFS).

Fehlt eine Aufnahme, gehört sie zu einem älteren Text oder ist sie zu lang, bricht das Rendern mit einem Hinweis ab, statt ein Video mit falscher Stimme zu liefern.
