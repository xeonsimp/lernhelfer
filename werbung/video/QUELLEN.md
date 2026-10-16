# Quellen und Lizenzen

## Ton

Alle Töne sind selbst synthetisiert, mit ffmpeg 7.1. Die Binärdatei stammt aus dem Python-Paket `imageio-ffmpeg`. Keine fremden Aufnahmen, keine Downloads, keine Lizenzpflichten.

| Datei | Zweck | Befehl (lavfi) |
|---|---|---|
| `public/sfx/scratch.wav` | Stift-Kratzer | `anoisesrc=d=0.45:c=white:r=44100:a=0.4,bandpass=f=2800:w=1600,tremolo=f=18:d=0.7,afade=t=in:st=0:d=0.04,afade=t=out:st=0.35:d=0.1` |
| `public/sfx/pop.wav` | Karten-Pop | `aevalsrc='0.6*sin(2*PI*(160+240*t/0.08)*t)*exp(-35*t)':d=0.08:s=44100` |
| `public/sfx/click.wav` | Knopfdruck | `aevalsrc='0.7*sin(2*PI*1200*t)*exp(-120*t)+0.3*(random(0)*2-1)*exp(-150*t)':d=0.03:s=44100` |
| `public/sfx/ding.wav` | Termin abgehakt | `aevalsrc='0.45*sin(2*PI*880*t)*exp(-6*t)+0.35*sin(2*PI*1318.5*t)*exp(-9*t)+0.2*sin(2*PI*1760*t)*exp(-14*t)':d=0.6:s=44100` |
| `public/sfx/swoosh.wav` | Szenenwechsel | `anoisesrc=d=0.28:c=pink:r=44100:a=0.5,highpass=f=250,lowpass=f=1800,afade=t=in:st=0:d=0.1,afade=t=out:st=0.1:d=0.18` |
| `public/sfx/tick.wav` | Zähler | `aevalsrc='0.5*sin(2*PI*2400*t)*exp(-140*t)':d=0.025:s=44100` |
| `public/sfx/bgm.wav` | Musik, 120 BPM | `aevalsrc='0.12*(sin(2*PI*261.63*t)+sin(2*PI*329.63*t)+sin(2*PI*392.00*t)+sin(2*PI*493.88*t))*exp(-5*mod(t,0.5))+0.15*sin(2*PI*65.41*t)*exp(-12*mod(t,0.5))':d=55:s=44100,lowpass=f=2200,afade=t=in:st=0:d=1,afade=t=out:st=53:d=2` |
| `public/sfx/musik-reel.wav` | Musik fürs lange Reel | kein ffmpeg-Befehl: `node scripts/musik.mjs` komponiert und synthetisiert einen Lo-fi-Track (90 BPM, C-Dur, 159 s; E-Piano, Bass, Pad, Melodie, Schlagzeug mit Swing, Hall), Aufbau mit Intro, Break und Outro mit Schlussakkord statt einer Schleife |

Ein CC0-Musikstück wurde nicht verwendet. Der kurze Spot nutzt den synthetischen Beat `bgm.wav` (Cmaj7-Akkord und Bass-Puls alle 0,5 s), das lange Reel den Lo-fi-Track `musik-reel.wav`, damit über 2:38 min keine kurze Schleife läuft.
Mischung (`src/ton.tsx`): Unter jedem Effekt wird die Musik um 6 dB abgesenkt (Faktor 0,5) und blendet am Ende aus. Im kurzen Spot gibt es kein Voice-over.

## Stimme (nur im langen Reel)

- Stimme: ElevenLabs **Eleven v4 Turbo** über die Text-to-Speech-API von [OpenRouter](https://openrouter.ai/elevenlabs/eleven-v4-turbo) (`elevenlabs/eleven-v4-turbo`), Sprecher `liam`, Sprache Deutsch. Bezahlt pro Zeichen, alle 35 Sätze zusammen kosten ein paar Cent. Der Key kommt aus der Umgebungsvariable `OPENROUTER_API_KEY` und steht nirgends im Repo.
- Ausweichlösung ohne Kosten: `python scripts/stimme.py --edge` nutzt [edge-tts](https://github.com/rany2/edge-tts) (Python, GPL-3.0, kein Konto) mit `de-DE-KillianNeural` und `+8 %` Tempo. edge-tts ist kein offizielles Microsoft-Produkt, eine ausdrückliche Lizenz für Werbung gibt es dafür nicht.
- Tempo: Passt ein Satz nicht in sein Fenster, beschleunigt `scripts/stimme.py` ihn tonhöhengleich mit ffmpeg `atempo` auf 1,06 oder 1,12 (bei edge-tts `+12 %` oder `+16 %`). Welches Tempo und welche Stimme jeder Satz bekam, steht in `public/vo/vo.json`.
- Texte: selbst geschrieben, in `src/reel.tsx` (`stimme`). Keine Abkürzungen: PS heißt Proseminar, PC heißt Computer, VWL heißt Volkswirtschaft; das Skript bricht ab, wenn zwei Großbuchstaben am Stück im Text stehen (deshalb „Olat“ statt „OLAT“). Uhrzeiten, Preise und die Adresse sind ausgeschrieben („vier Euro neunzig“, „lernhelfer Punkt x y z“). „Base“ spricht die Stimme falsch, daher im Ton „Einstieg“ und „kostenlos starten“; im Bild bleibt „Base“.
- Kontrolle: Jede Aufnahme wurde mit einer lokalen Spracherkennung (faster-whisper, Modell medium) zurück in Text übersetzt und mit dem Soll-Text verglichen.
- Bearbeitung mit ffmpeg (aus `imageio-ffmpeg`): Stille am Anfang und Ende entfernt (30 ms davor und 80 ms danach bleiben), Hochpass 80 Hz, sanfter Kompressor 3:1 ab −20 dB, Präsenz +3 dB bei 3,5 kHz, dann jeder Satz auf −16 LUFS gebracht und bei −1,5 dBTP begrenzt. Ergebnis: `public/vo/vo-<id>.mp3`.
- Mischung: Die Stimme läuft mit voller Lautstärke. Die Musik liegt als Bett durchgehend etwa 12 dB darunter (Faktor 0,17 auf `musik-reel.wav` mit −12,6 LUFS, also etwa −28 LUFS), die Effekte sind 2 dB leiser als im Spot und bleiben Akzente unter der Sprache.
- Nutzungsrechte: ElevenLabs erlaubt bei bezahlter Nutzung die kommerzielle Verwendung der erzeugten Audios. Ob das über OpenRouter genauso gilt, vor einer bezahlten Kampagne in den Bedingungen von OpenRouter und ElevenLabs nachlesen.
Nach dem Rendern wird alles mit ffmpeg `loudnorm` auf etwa −14 LUFS normalisiert.

## Schrift

Archivo (Omnibus-Type), SIL Open Font License 1.1, aus `fonts/Archivo.woff2` im Repo. Siehe `fonts/LIZENZ.txt`.

## Bild

- Die App-Aufnahmen hat `scripts/aufnehmen.py` mit Playwright vom lokal gestarteten Lernhelfer-Server (`server/server.mjs`) gemacht, mit einer frischen Test-Datenbank in `demo/daten`.
- Die Inhalte sind erfundene Beispieldaten aus `scripts/demo_daten.py` (`demo/inhalt`): keine echten Unterlagen, keine echten Namen, keine echten Noten. Im Video sind sie mit „Beispieldaten“ beschriftet.
- Ausgeblendet per CSS: der Link „Admin-Ecke“ und der Eigenwerbe-Kasten auf „Heute“.
- Langes Reel (`scripts/aufnehmen_lang.py`, Bilder in `public/shots/lang/`): Statt OpenRouter antwortet eine lokale KI-Attrappe mit vorgeschriebenen Texten (Fragen und Antworten stehen im Skript, passend zu den Beispieldaten). Der Podcast-Ton ist Stille von 9:52 min, damit der Player die Länge einer echten Folge zeigt. Probeklausur, Lösungsweg an einer Übungsaufgabe, Schwächen-Training und Lernskript sind vorgeschriebene Beispiele im Speicherformat der App. Die doppelten Anführungszeichen bei Zitaten in der Vortragsanalyse (App-Fehler) sind für die Aufnahmen per CSS auf einfache reduziert.
- Dateisymbole, Geräterahmen, Kopfhörer, Sprechblasen und der Vortrags-Ausschnitt sind gezeichnet (roughjs, @remotion/rough-notation, @remotion/paths). Es gibt keine Logos und keine Personen.
- Der Schriftzug LERNHELFER ist die Wortmarke aus `skizze.css`.

## Aussagen im Spot

Alle Aussagen stammen aus `werbung/prompt.md` und der Anleitung in `index.html`. Preise stehen in `TARIFE` in `server/server.mjs` (Pro 490 Cent, Ultra 990 Cent im Monat). Die Zahl 37 ist eine Beispielszene, keine Statistik. Die Zuordnung je Szene steht in `STORYBOARD.md`.
