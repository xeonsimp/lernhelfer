"""Startet den Lernhelfer-Server mit einer frischen Test-Datenbank (demo/daten), legt ein Demo-Konto mit Ultra an,
lädt die Beispieldaten aus demo/inhalt hoch und fotografiert die App (Handy 390×844, Desktop 1440×900, hell und dunkel).
Ergebnis: public/shots/*.png und public/shots/shots.json (Bildgrößen und Lage wichtiger Elemente in CSS-Pixeln).
Aufruf aus werbung/video:  python scripts/aufnehmen.py"""
import atexit, base64, json, os, re, shutil, subprocess, sys, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

VIDEO = Path(__file__).resolve().parent.parent
REPO = VIDEO.parent.parent
DEMO, INHALT, SHOTS = VIDEO / "demo" / "daten", VIDEO / "demo" / "inhalt", VIDEO / "public" / "shots"
PORT = 8795
U = f"http://127.0.0.1:{PORT}/"
LOG = VIDEO / "demo" / "server.log"
UHR = "2026-10-19T08:40:00"  # Montagmorgen, passend zu den Beispieldaten
# Testzugänge nur für diesen lokalen Prüfstand
DEMO_MAIL, DEMO_PW = "demo@example.com", "demo-passwort-2026"
CHEF_MAIL, CHEF_PW, ECKE = "chef@example.com", "chef-passwort-2026", "Ecke-Demo-2026"
VERSTECKEN = "#nav-admin, .ecke-link, .empfehlung { display: none !important; } html.ganz .tabs { display: none !important; }"

shutil.rmtree(DEMO, ignore_errors=True); DEMO.mkdir(parents=True)
SHOTS.mkdir(parents=True, exist_ok=True)
server = subprocess.Popen(["node", "--no-warnings", "server/server.mjs"], cwd=REPO, stdout=open(LOG, "w", encoding="utf-8"), stderr=subprocess.STDOUT,
                          env={**os.environ, "LH_DATEN": str(DEMO), "LH_PORT": str(PORT), "LH_URL": U.rstrip("/"), "LH_OR_URL": "http://127.0.0.1:9",
                               "LH_OR_KEY": "demo", "LH_ADMIN": CHEF_MAIL, "LH_ECKE": ECKE, "LH_EMPFAENGER": "Beispiel", "LH_IBAN": "AT00 0000 0000 0000 0000",
                               "LH_BIC": "BEISPIEL", "LH_PAYPAL": "zahlung@example.com"})
atexit.register(server.kill)
for _ in range(50):
    try: urllib.request.urlopen(U, timeout=1); break
    except Exception: time.sleep(0.2)


def link(email, art):
    for _ in range(50):
        t = re.findall(rf"\[Mail an {re.escape(email)}\][^\[]*?#{art}=([\w-]+)", LOG.read_text("utf-8"))
        if t: return t[-1]
        time.sleep(0.1)
    raise SystemExit(f"keine Mail {art} an {email}")


def hochladen(token, pfad, daten):
    req = urllib.request.Request(f"{U}api/gh/repos/lernhelfer/konto/contents/{pfad}", method="PUT",
                                 data=json.dumps({"content": base64.b64encode(daten).decode()}).encode(), headers={"Authorization": "Bearer " + token})
    urllib.request.urlopen(req).read()


def registrieren(page, mail, pw):
    page.goto(U + "#/einstellungen"); page.wait_for_timeout(800)
    f = page.locator("form", has_text="Konto erstellen")
    f.locator("input[name=email]").fill(mail); f.locator("input[name=passwort]").fill(pw); f.locator("input[name=agb]").check()
    f.get_by_role("button", name="Kostenlos registrieren").click(); page.wait_for_timeout(1800)


INFO = {}


def box(page, sel, name, ziel):
    """Lage eines Elements auf der ganzen Seite (CSS-Pixel), für Overlays im Video."""
    loc = page.locator(sel).first
    if not loc.count():
        print("  fehlt:", name, sel); return
    b = loc.evaluate("e => { const r = e.getBoundingClientRect(); return [r.x + scrollX, r.y + scrollY, r.width, r.height]; }")
    ziel[name] = [round(x, 1) for x in b]


def foto(page, name, boxen=(), voll=True):
    page.wait_for_timeout(300)
    ziel = {}
    for n, s in boxen: box(page, s, n, ziel)
    page.evaluate("document.documentElement.classList.add('ganz')")
    page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=voll, animations="disabled")
    page.evaluate("document.documentElement.classList.remove('ganz')")
    groesse = page.evaluate("[document.documentElement.scrollWidth, document.documentElement.scrollHeight]") if voll else list(page.viewport_size.values())
    INFO[name] = {"w": groesse[0], "h": groesse[1], "boxen": ziel}
    print(" ", name, groesse, list(ziel))


with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    # Konten: Demo mit Daten, Chef schaltet Ultra frei
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page(); page.on("dialog", lambda d: d.accept())
    registrieren(page, DEMO_MAIL, DEMO_PW)
    chef_ctx = b.new_context(viewport={"width": 1440, "height": 900}); chef = chef_ctx.new_page(); chef.on("dialog", lambda d: d.accept())
    registrieren(chef, CHEF_MAIL, CHEF_PW)
    chef.goto(U + "#bestaetigen=" + link(CHEF_MAIL, "bestaetigen")); chef.wait_for_timeout(1200); chef.reload(); chef.wait_for_timeout(1200)
    chef.evaluate(f"api('ecke', {{ passwort: '{ECKE}' }})")
    konto = chef.evaluate(f"api('admin').then(d => d.konten.find(k => k.email === '{DEMO_MAIL}').id)")
    chef.evaluate(f"api('admin/tarif', {{ konto: {konto}, tarif: 'ultra', tage: 30 }})")
    # Kalender, Noten und Vortrag gibt es erst ab Pro: deshalb nach dem Freischalten hochladen
    token = page.evaluate("api('pc', {})")["token"]
    for f in sorted(INHALT.rglob("*")):
        if f.is_file(): hochladen(token, f.relative_to(INHALT).as_posix(), f.read_bytes())
    zustand = ctx.storage_state()
    chef_ctx.close(); ctx.close()

    for geraet, thema in [("m", "hell"), ("m", "dunkel"), ("d", "hell"), ("d", "dunkel")]:
        print(geraet, thema)
        handy = geraet == "m"
        c = b.new_context(viewport={"width": 390, "height": 844} if handy else {"width": 1440, "height": 900}, device_scale_factor=3 if handy else 2,
                          is_mobile=handy, has_touch=handy, storage_state=zustand, timezone_id="Europe/Vienna", locale="de-AT", bypass_csp=True)
        c.add_init_script("""(() => { try { %s } catch {}
          const s = document.createElement('style'); s.textContent = %s;
          const dran = () => (document.head || document.documentElement).appendChild(s);
          document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', dran) : dran(); })();"""
                          % ("localStorage.setItem('thema', 'dunkel');" if thema == "dunkel" else "localStorage.removeItem('thema');", json.dumps(VERSTECKEN)))
        pg = c.new_page(); pg.on("dialog", lambda d: d.accept())
        fehler = []; pg.on("pageerror", lambda e: fehler.append(str(e)))
        pg.clock.set_fixed_time(UHR)
        k = f"{geraet}_{thema}"

        pg.goto(U + "#/"); pg.wait_for_timeout(3000)
        if handy:
            pg.locator(".tabs").screenshot(path=str(SHOTS / f"{k}_tabs.png"), animations="disabled")
            INFO[f"{k}_tabs"] = {"w": 390, "h": round(pg.locator(".tabs").bounding_box()["height"], 1), "boxen": {}}
        foto(pg, f"{k}_heute", [("frist1", "#fristen .frist"), ("haken1", "#fristen .frist .haken"), ("fristen", "#fristen"),
                                ("faecher", "#ressorts"), ("mathe", "#ressorts .fach"), ("woche", ".woche-feld"), ("assistent", "#assistent")])
        pg.locator("#fristen .frist .haken input").first.click(); pg.wait_for_timeout(600)  # erledigte Frist rutscht aus der Liste
        foto(pg, f"{k}_heute_ab", [("frist1", "#fristen .frist")])
        pg.evaluate("Object.keys(localStorage).filter(x => x.startsWith('frist:')).forEach(x => localStorage.removeItem(x))")

        pg.goto(U + "#/Mathematik"); pg.wait_for_timeout(2500)
        foto(pg, f"{k}_ausgabe", [("kopf", "#ausgabe .ausgabe-kopf"), ("blick", "#ausgabe .blick"), ("zusammenfassung", "#ausgabe h2:has-text('Zusammenfassung')"),
                                  ("ps", "#ausgabe h2:has-text('Nächstes Proseminar')"), ("uebungen", "#teil-uebungen"), ("aufgabe1", "#teil-uebungen .aufgabe"),
                                  ("lexikon", "#teil-lexikon"), ("vo", "#ausgabe h2:has-text('Nächste Vorlesung')")])
        a1 = pg.locator("#teil-uebungen .aufgabe").first
        if a1.count():
            a1.locator("summary").first.click(); pg.wait_for_timeout(500)
            foto(pg, f"{k}_ausgabe_auf", [("aufgabe1", "#teil-uebungen .aufgabe")])

        pg.goto(U + "#/karten"); pg.wait_for_timeout(2000)
        foto(pg, f"{k}_karten", [("karte", ".karte"), ("zahlen", "#karten .kacheln, .karten-zahlen")])
        pg.locator(".karte").first.click(); pg.wait_for_timeout(900)
        foto(pg, f"{k}_karten_h", [("karte", ".karte")])

        pg.goto(U + "#/noten"); pg.wait_for_timeout(2000)
        foto(pg, f"{k}_noten", [("diagramm", "#noten svg"), ("lv1", "#noten .lv-karte"), ("pruefung", "#noten h2:has-text('Prüfungen')")])

        pg.goto(U + "#/pruefung"); pg.wait_for_timeout(1500)
        foto(pg, f"{k}_pruefung", [("probe", "#pruefung .schritt"), ("schwaechen", "#pruefung .schritt:nth-of-type(2)")])

        pg.goto(U + "#/vortrag"); pg.wait_for_timeout(1500)
        e = pg.locator("#vortrag a, #vortrag button", has_text="café").first
        if e.count(): e.click(); pg.wait_for_timeout(2000)
        foto(pg, f"{k}_vortrag", [("gesamt", ".vt-gesamt"), ("ger", ".vt-ger-skalen"), ("ger1", ".vt-ger-skalen > li"), ("befund", ".vt-befund"),
                                  ("transkript", ".vt-transkript"), ("zahlen", ".vt-zahl"), ("tipps", ".vt-tipps")])
        print("  Seitenfehler:", fehler or "keine")
        c.close()
    b.close()
(SHOTS / "shots.json").write_text(json.dumps(INFO, indent=1), encoding="utf-8")
print("fertig:", len(INFO), "Bilder")
