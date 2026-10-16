"""Voice-over fürs lange Reel: jeder Satz aus src/reel.tsx (stimme) mit edge-tts (de-DE-KillianNeural, kostenlos) gesprochen,
mit ffmpeg veredelt und nach public/vo/vo-<id>.mp3 gelegt; Länge und Text kommen nach public/vo/vo.json (src/ton.tsx liest sie).
Passt ein Satz nicht in sein Fenster (bis kurz vor den nächsten Satz), wird er schneller gesprochen (+8 %, +12 %, +16 %);
reicht das nicht, nennt das Skript den Satz und um wie viel er zu lang ist: dann den Text in src/reel.tsx kürzen.
Unveränderte Sätze werden nicht neu erzeugt (--neu erzwingt es).
Aufruf aus werbung/video:  pip install edge-tts imageio-ffmpeg  und dann  python scripts/stimme.py"""
import asyncio, json, os, re, subprocess, sys, tempfile
from pathlib import Path
import edge_tts
import imageio_ffmpeg

STIMME = "de-DE-KillianNeural"
TEMPI = ["+8%", "+12%", "+16%"]
FPS = 60
# Silben am Anfang und Ende frei von Stille (30 ms davor, 80 ms danach bleiben), Rumpeln unter 80 Hz weg, sanfter Kompressor 3:1 ab −20 dB,
# Präsenz +3 dB bei 3,5 kHz; danach auf −16 LUFS gebracht und bei −1,5 dBTP begrenzt, damit alle Sätze gleich laut sind
STILLE = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03"
FILTER = f"{STILLE},areverse,{STILLE.replace('0.03', '0.08')},areverse,highpass=f=80,acompressor=threshold=0.1:ratio=3:attack=10:release=120:makeup=1.5,equalizer=f=3500:t=q:w=1.0:g=3"
ZIEL_LUFS = -16

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


async def sprich(text, tempo, ziel):
    with tempfile.TemporaryDirectory() as tmp:
        roh, wav = Path(tmp) / "roh.mp3", Path(tmp) / "bearbeitet.wav"
        await edge_tts.Communicate(text, STIMME, rate=tempo, proxy=os.environ.get("HTTPS_PROXY")).save(str(roh))
        ff("-y", "-i", str(roh), "-af", FILTER, "-ac", "1", "-ar", "48000", str(wav))
        lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", ff("-i", str(wav), "-af", "ebur128", "-f", "null", "-"))[-1])
        ff("-y", "-i", str(wav), "-af", f"volume={ZIEL_LUFS - lufs:.2f}dB,alimiter=limit=0.84:level=false", "-c:a", "libmp3lame", "-q:a", "2", str(ziel))
    return sekunden(ziel)


async def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    neu = "--neu" in sys.argv
    saetze = json.loads(subprocess.run(["node", "scripts/saetze.mjs"], cwd=ORDNER, capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    VO.mkdir(parents=True, exist_ok=True)
    alt = json.loads(JSON.read_text(encoding="utf-8")) if JSON.exists() else {}
    fertig, zu_lang = {}, []
    for s in saetze:
        datei, fenster = VO / f"vo-{s['id']}.mp3", (s["bis"] - s["start"]) / FPS
        a = alt.get(s["id"])
        if not neu and a and a["text"] == s["text"] and datei.exists() and a["sek"] <= fenster:
            fertig[s["id"]] = a
            print(f"{s['id']:>4}  {a['sek']:.2f} s von {fenster:.2f} s  {a['tempo']}  (unverändert)")
            continue
        for tempo in TEMPI:
            sek = await sprich(s["text"], tempo, datei)
            if sek <= fenster:
                break
        fertig[s["id"]] = {"text": s["text"], "sek": round(sek, 3), "tempo": tempo}
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
