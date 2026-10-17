"""Voice-over fürs lange Reel: jeder Satz aus src/reel.tsx (stimme) gesprochen, mit ffmpeg veredelt und nach public/vo/vo-<id>.mp3 gelegt;
Länge, Text und Stimme kommen nach public/vo/vo.json (src/ton.tsx liest sie).
Stimme: ElevenLabs Eleven v4 Turbo über OpenRouter (Stimme „liam“, Key in OPENROUTER_API_KEY, alle Sätze zusammen kosten ein paar Cent),
mit --edge kostenlos per edge-tts (de-DE-KillianNeural).
Passt ein Satz nicht in sein Fenster (bis kurz vor den nächsten Satz), wird er schneller: ElevenLabs per ffmpeg atempo 1,06 bzw. 1,12
(tonhöhengleich), edge-tts mit +12 % bzw. +16 % statt +8 %; reicht das nicht, nennt das Skript den Satz: dann den Text in src/reel.tsx kürzen.
Abkürzungen (PS, VWL, PC …) werden nicht vorgelesen, sondern ausgeschrieben; das Skript bricht ab, wenn eine im Text steht.
Unveränderte Sätze werden nicht neu erzeugt (--neu erzwingt es).
Aufruf aus werbung/video:  pip install imageio-ffmpeg (für --edge auch edge-tts)  und dann  python scripts/stimme.py"""
import asyncio, json, os, re, subprocess, sys, tempfile, time, urllib.error, urllib.request
from pathlib import Path
import imageio_ffmpeg

EDGE = "--edge" in sys.argv
if EDGE:
    STIMME, TEMPI = "edge-tts:de-DE-KillianNeural", ["+8%", "+12%", "+16%"]
else:
    MODELL, SPRECHER = "elevenlabs/eleven-v4-turbo", "liam"  # jung, locker; Stimmen: openrouter.ai/elevenlabs/eleven-v4-turbo
    STIMME, TEMPI = f"{MODELL}:{SPRECHER}", ["1.0", "1.06", "1.12"]
FPS = 60
# Silben am Anfang und Ende frei von Stille (30 ms davor, 80 ms danach bleiben), Rumpeln unter 80 Hz weg, sanfter Kompressor 3:1 ab −20 dB,
# Präsenz +3 dB bei 3,5 kHz; danach auf −16 LUFS gebracht und bei −1,5 dBTP begrenzt, damit alle Sätze gleich laut sind
STILLE = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03"
FILTER = f"{STILLE},areverse,{STILLE.replace('0.03', '0.08')},areverse,highpass=f=80,acompressor=threshold=0.1:ratio=3:attack=10:release=120:makeup=1.5,equalizer=f=3500:t=q:w=1.0:g=3"
ZIEL_LUFS = -16
ABKUERZUNG = re.compile(r"\b[A-ZÄÖÜ]{2,}\b")  # zwei und mehr Großbuchstaben am Stück: würden buchstabiert

FF = imageio_ffmpeg.get_ffmpeg_exe()
ORDNER = Path(__file__).resolve().parent.parent
VO = ORDNER / "public" / "vo"
JSON = VO / "vo.json"


def ff(*args):
    r = subprocess.run([FF, "-hide_banner", "-nostdin", *args], capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode:
        sys.exit(r.stderr[-2000:])
    return r.stderr


def sekunden(datei):
    t = re.findall(r"time=(\d+):(\d+):([\d.]+)", ff("-i", str(datei), "-f", "null", "-"))[-1]
    return int(t[0]) * 3600 + int(t[1]) * 60 + float(t[2])


_roh = {}
def openrouter(text):
    """Einmal pro Text bei OpenRouter sprechen lassen (das Tempo macht danach ffmpeg); kurz überlastet heißt: warten und neu versuchen"""
    if text in _roh:
        return _roh[text]
    key = os.environ.get("OPENROUTER_API_KEY") or sys.exit("OPENROUTER_API_KEY fehlt (Key von openrouter.ai/settings/keys als Umgebungsvariable)")
    body = {"model": MODELL, "input": text, "voice": SPRECHER, "response_format": "mp3", "provider": {"options": {"elevenlabs": {"language_code": "de"}}}}
    req = urllib.request.Request("https://openrouter.ai/api/v1/audio/speech", data=json.dumps(body).encode(), headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    for versuch in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                _roh[text] = r.read()
                return _roh[text]
        except urllib.error.HTTPError as e:
            if e.code not in (429, 502, 503, 524, 529) or versuch == 3:
                sys.exit(f"OpenRouter {e.code}: {e.read().decode(errors='replace')[:500]}")
            time.sleep(2 ** (versuch + 1))


async def sprich(text, tempo, ziel):
    with tempfile.TemporaryDirectory() as tmp:
        roh, wav = Path(tmp) / "roh.mp3", Path(tmp) / "bearbeitet.wav"
        if EDGE:
            import edge_tts
            await edge_tts.Communicate(text, STIMME.split(":")[1], rate=tempo, proxy=os.environ.get("HTTPS_PROXY")).save(str(roh))
        else:
            roh.write_bytes(openrouter(text))
        schneller = "" if EDGE or tempo == "1.0" else f"atempo={tempo},"
        ff("-y", "-i", str(roh), "-af", schneller + FILTER, "-ac", "1", "-ar", "48000", str(wav))
        lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", ff("-i", str(wav), "-af", "ebur128", "-f", "null", "-"))[-1])
        ff("-y", "-i", str(wav), "-af", f"volume={ZIEL_LUFS - lufs:.2f}dB,alimiter=limit=0.84:level=false", "-c:a", "libmp3lame", "-q:a", "2", str(ziel))
    return sekunden(ziel)


async def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    neu = "--neu" in sys.argv
    saetze = json.loads(subprocess.run(["node", "scripts/saetze.mjs"], cwd=ORDNER, capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    abk = [f"{s['id']}: {', '.join(ABKUERZUNG.findall(s['text']))} ({s['text']})" for s in saetze if ABKUERZUNG.search(s["text"])]
    if abk:
        sys.exit("Abkürzungen bitte in src/reel.tsx ausschreiben (PS → Proseminar, PC → Computer …), Namen klein schreiben (Olat):\n" + "\n".join(abk))
    VO.mkdir(parents=True, exist_ok=True)
    alt = json.loads(JSON.read_text(encoding="utf-8")) if JSON.exists() else {}
    fertig, zu_lang = {}, []
    for s in saetze:
        datei, fenster = VO / f"vo-{s['id']}.mp3", (s["bis"] - s["start"]) / FPS
        a = alt.get(s["id"])
        if not neu and a and a["text"] == s["text"] and a.get("stimme") == STIMME and datei.exists() and a["sek"] <= fenster:
            fertig[s["id"]] = a
            print(f"{s['id']:>4}  {a['sek']:.2f} s von {fenster:.2f} s  {a['tempo']}  (unverändert)")
            continue
        for tempo in TEMPI:
            sek = await sprich(s["text"], tempo, datei)
            if sek <= fenster:
                break
        fertig[s["id"]] = {"text": s["text"], "sek": round(sek, 3), "tempo": tempo, "stimme": STIMME}
        print(f"{s['id']:>4}  {sek:.2f} s von {fenster:.2f} s  {tempo}  {s['text']}")
        if sek > fenster:
            zu_lang.append(f"{s['id']}: {sek - fenster:.2f} s zu lang ({s['text']})")
        JSON.write_text(json.dumps(fertig | {k: v for k, v in alt.items() if k not in fertig}, ensure_ascii=False, indent=1), encoding="utf-8")
    # Nur Sätze behalten, die es noch gibt
    for f in VO.glob("vo-*.mp3"):
        if f.stem[3:] not in fertig:
            f.unlink()
    JSON.write_text(json.dumps(fertig, ensure_ascii=False, indent=1), encoding="utf-8")
    gesamt = sum(a["sek"] for a in fertig.values())
    print(f"{len(fertig)} Sätze, zusammen {gesamt:.1f} s Sprache")
    if zu_lang:
        sys.exit("Zu lang, bitte in src/reel.tsx kürzen:\n" + "\n".join(zu_lang))


asyncio.run(main())
