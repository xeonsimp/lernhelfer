"""Aufnahmen für das lange Reel: wie aufnehmen.py (frische Test-Datenbank, Demo-Konto mit Ultra, Beispieldaten aus demo/inhalt),
dazu eine lokale KI-Attrappe statt OpenRouter. Sie antwortet mit vorgeschriebenen Texten, damit Chat, Coach und Podcast echt in der App zu sehen sind.
Ergebnis: public/shots/lang/*.png und public/shots/lang.json (Bildgrößen und Lage wichtiger Elemente in CSS-Pixeln, Schlüssel „lang/name“).
Aufruf aus werbung/video:  python scripts/aufnehmen_lang.py"""
import atexit, base64, json, os, re, shutil, subprocess, threading, time, urllib.parse, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

VIDEO = Path(__file__).resolve().parent.parent
REPO = VIDEO.parent.parent
DEMO, INHALT, SHOTS = VIDEO / "demo" / "daten-lang", VIDEO / "demo" / "inhalt", VIDEO / "public" / "shots" / "lang"
PORT, KI_PORT = 8797, 8798
U = f"http://127.0.0.1:{PORT}/"
LOG = VIDEO / "demo" / "server-lang.log"
UHR = "2026-10-19T08:40:00"  # Montagmorgen, passend zu den Beispieldaten
# Testzugänge nur für diesen lokalen Prüfstand
DEMO_MAIL, DEMO_PW = "demo@example.com", "demo-passwort-2026"
CHEF_MAIL, CHEF_PW, ECKE = "chef@example.com", "chef-passwort-2026", "Ecke-Demo-2026"
VERSTECKEN = ("#nav-admin, .ecke-link, .empfehlung { display: none !important; } html.ganz .tabs { display: none !important; }"
              # in der App stehen bei Zitaten die Anführungszeichen doppelt (Text und CSS); für die Aufnahmen nur einmal
              " .vt-du::before, .vt-du::after, .vt-zitat::before, .vt-zitat::after { content: none !important; }")

# ---------- Fragen und vorgeschriebene Antworten (erfunden, passend zu demo/inhalt) ----------
F_KETTE = ("ok sorry aber ich versteh die kettenregel einfach null 😭 morgen ist PS und wenn ich vorrechnen muss bin ich komplett geliefert. "
           "kannst du mir das bitte so erklären dass ichs wirklich check? am besten mit beispiel")
A_KETTE = r"""Kein Stress, das kriegst du hin. Die Kettenregel brauchst du, wenn eine Funktion in einer anderen steckt.

**So gehst du vor:**
1. Innere Funktion finden: das, was in der Klammer steckt.
2. Die äußere Funktion ableiten, das Innere bleibt dabei stehen.
3. Mit der Ableitung der inneren Funktion malnehmen.

**Beispiel:** \(f(x) = (3x + 1)^2\). Innen \(u = 3x + 1\) mit \(u' = 3\), außen \(u^2\) mit Ableitung \(2u\):
\[f'(x) = 2(3x + 1) \cdot 3 = 18x + 6\]

Kurz, wie in deinem Lexikon: *äußere Ableitung mal innere Ableitung.* Für morgen: Blatt 3, Aufgaben 1 bis 4. Rechne eine davon genau nach diesem Schema."""
F_PRUEFUNG = "und kommt das safe in der prüfung dran??"
A_PRUEFUNG = """Das steht nicht in deinen Unterlagen. Im Syllabus steht nur der Termin: **VO-Prüfung am Mittwoch, 3. Februar 2027, um 9:00 Uhr.** Welche Aufgaben drankommen, steht dort nicht, das kann ich dir also nicht sagen.

Sicher ist: Die Ableitungsregeln sind Thema von VO 4 und PS 3, und VO 5 baut mit den Grenzkosten darauf auf."""
F_PS = "sorry blöde frage aber wann und wo ist eigentlich mein vwl ps diese woche?? und muss ich davor noch irgendwas abgeben, ich blick grad gar nicht mehr durch"
A_PS = """Gar nicht blöd.

**VWL PS 3:** Freitag, 23. Oktober, 10:00 bis 11:30 Uhr, HS 4. Besprochen wird Übungsblatt 2.

**Davor fällig:** Übungsblatt 2 (Elastizitäten) bis **Donnerstag, 22. Oktober, 23:59 Uhr**, als PDF in OLAT.

**Dein nächster Schritt:** Morgen um 8:00 ist VO 4 zu Elastizitäten. Fang danach mit Blatt 2 an, dann hast du bis Donnerstag Luft."""
F_AEH = "ehrlich, wie krieg ich diese ähs weg?? sobald was neues kommt oder eine zahl werd ich nervös und dann kommt automatisch uh"
A_AEH = """Das zeigt dein Transkript genau so: Deine „uh“ und „um“ kommen an Übergängen (0:06, 0:45) und direkt vor der wichtigsten Zahl (0:37). Der Kopf sucht den nächsten Gedanken, und der Mund füllt die Lücke.

**Übung für die nächste Probe:**
1. Schreib die Übergänge und die Break-even-Zahl groß auf eine Karte.
2. Lies den Pitch dreimal laut und mach vor jedem neuen Punkt bewusst eine Sekunde Pause.
3. Nimm dich danach noch einmal auf und vergleiche die äh-Laute.

Eine kurze Pause wirkt sicher. Ein „uh“ nicht."""
STIL = "Duze mich, erklär alles locker wie ein Kumpel und immer mit einem Beispiel aus dem Alltag."
PODCAST = {"turns": [
    {"sprecher": "a", "text": "Hi, ich bin Lena. Diese Woche geht es in Mathe um Ableitungen. Max, was misst eine Ableitung eigentlich?", "ton": "neugierig"},
    {"sprecher": "b", "text": "Wie schnell sich etwas ändert, etwa die Kosten pro Stück. Bei der Kostenfunktion aus den Folien steigen die Kosten bei zwanzig Stück um rund vierundzwanzig Geldeinheiten je Stück.", "ton": "ruhig erklärend"},
    {"sprecher": "a", "text": "Und was steht als Nächstes an?", "ton": "locker"},
    {"sprecher": "b", "text": "Heute um sechzehn Uhr das Proseminar mit Blatt drei, und bis nächsten Montag läuft Onlinetest drei.", "ton": "ruhig"}]}
TTS_SEKUNDEN = 592  # Stille; der Player zeigt die Länge wie bei einer echten Folge von rund 10 Minuten


def antwort_fuer(b):
    texte = [m.get("content") for m in b.get("messages", []) if isinstance(m.get("content"), str)]
    system, frage = " ".join(texte[:-1]), (texte[-1] if texte else "").lower()
    if "Lern-Podcast" in system: return json.dumps(PODCAST, ensure_ascii=False)
    for stichwort, a in [("kettenregel", A_KETTE), ("safe in der prüfung", A_PRUEFUNG), ("vwl ps", A_PS), ("ähs", A_AEH)]:
        if stichwort in frage: return a
    return None


class Attrappe(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def do_POST(self):
        b = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        if self.path.endswith("/audio/speech"):
            self.send_response(200); self.send_header("Content-Type", "audio/pcm"); self.end_headers()
            self.wfile.write(bytes(TTS_SEKUNDEN * 48000)); return
        text = antwort_fuer(b)
        if text is None:  # unbekannt, etwa „Neu erstellen“: lange nachdenken, damit der Fortschritt zu sehen ist
            self.send_response(200); self.send_header("Content-Type", "text/event-stream"); self.end_headers()
            try:
                for _ in range(120):
                    self.wfile.write(b'data: {"choices":[{"delta":{"reasoning":"..."}}]}\n\n'); self.wfile.flush(); time.sleep(1)
            except OSError: pass
            return
        time.sleep(2.5)  # „Antwort kommt …“ soll kurz zu sehen sein
        if b.get("stream"):
            self.send_response(200); self.send_header("Content-Type", "text/event-stream"); self.end_headers()
            self.wfile.write(f"data: {json.dumps({'choices': [{'delta': {'content': text}, 'finish_reason': 'stop'}], 'usage': {'cost': 0}})}\n\ndata: [DONE]\n\n".encode())
        else:
            roh = json.dumps({"choices": [{"message": {"content": text}}], "usage": {"cost": 0}}).encode()
            self.send_response(200); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(roh))); self.end_headers()
            self.wfile.write(roh)


ki = ThreadingHTTPServer(("127.0.0.1", KI_PORT), Attrappe)
threading.Thread(target=ki.serve_forever, daemon=True).start()

shutil.rmtree(DEMO, ignore_errors=True); DEMO.mkdir(parents=True)
shutil.rmtree(SHOTS, ignore_errors=True); SHOTS.mkdir(parents=True)
server = subprocess.Popen(["node", "--no-warnings", "server/server.mjs"], cwd=REPO, stdout=open(LOG, "w", encoding="utf-8"), stderr=subprocess.STDOUT,
                          env={**os.environ, "LH_DATEN": str(DEMO), "LH_PORT": str(PORT), "LH_URL": U.rstrip("/"), "LH_OR_URL": f"http://127.0.0.1:{KI_PORT}",
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
    """Lage eines Elements auf der ganzen Seite (CSS-Pixel), für Kamerafahrten im Video."""
    loc = page.locator(sel).first
    if not loc.count():
        print("  fehlt:", name, sel); return
    b = loc.evaluate("e => { const r = e.getBoundingClientRect(); return [r.x + scrollX, r.y + scrollY, r.width, r.height]; }")
    ziel[name] = [round(x, 1) for x in b]


def foto(page, name, boxen=(), voll=True):
    page.wait_for_timeout(400)
    ziel = {}
    for n, s in boxen: box(page, s, n, ziel)
    page.evaluate("document.documentElement.classList.add('ganz')")
    page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=voll, animations="disabled")
    page.evaluate("document.documentElement.classList.remove('ganz')")
    groesse = page.evaluate("[document.documentElement.scrollWidth, document.documentElement.scrollHeight]") if voll else list(page.viewport_size.values())
    INFO[f"lang/{name}"] = {"w": groesse[0], "h": groesse[1], "boxen": ziel}
    print(" ", name, groesse, list(ziel))


def element(page, sel, name, teile=(), **extra):
    """Nur ein Element, etwa ein Chat: Bild so groß wie das Element; teile = Lage von Kindern relativ zum Element."""
    loc = page.locator(sel).first
    loc.scroll_into_view_if_needed(); page.wait_for_timeout(400)
    b = loc.bounding_box()
    boxen = {}
    for n, s in teile:
        t = loc.locator(s).last
        if t.count():
            r = t.bounding_box()
            boxen[n] = [round(r["x"] - b["x"], 1), round(r["y"] - b["y"], 1), round(r["width"], 1), round(r["height"], 1)]
    page.evaluate("document.documentElement.classList.add('ganz')")  # ohne Tab-Leiste
    loc.screenshot(path=str(SHOTS / f"{name}.png"), animations="disabled")
    page.evaluate("document.documentElement.classList.remove('ganz')")
    INFO[f"lang/{name}"] = {"w": round(b["width"], 1), "h": round(b["height"], 1), "boxen": boxen, **extra}
    print(" ", name, [round(b["width"]), round(b["height"])], list(boxen))


def fragen(pg, sel, frage, name):
    """Frage tippen, abschicken, warten: drei Bilder (getippt, wartet, Antwort)."""
    feld = pg.locator(f"{sel} textarea").first
    feld.fill(frage)
    # Feld so hoch wie der Text, damit die ganze Frage zu sehen ist; Maße für das Tippen im Video
    stil = feld.evaluate("""e => { e.style.height = 'auto'; e.style.height = (e.scrollHeight + 4) + 'px'; const c = getComputedStyle(e), lh = parseFloat(c.lineHeight) || parseFloat(c.fontSize) * 1.4;
      const oben = parseFloat(c.paddingTop) + parseFloat(c.borderTopWidth), unten = parseFloat(c.paddingBottom) + parseFloat(c.borderBottomWidth);
      return { lh, oben, links: parseFloat(c.paddingLeft) + parseFloat(c.borderLeftWidth), bg: c.backgroundColor, zeilen: Math.round((e.clientHeight - oben - unten + 2) / lh) }; }""")
    element(pg, sel, f"{name}_tippen", [("feld", "textarea")], feld=stil)
    pg.locator(sel).get_by_role("button", name="Frage stellen").click(); pg.wait_for_timeout(500)
    element(pg, sel, f"{name}_wartet", [("frage", ".frage"), ("presse", ".presse")])
    pg.locator(f"{sel} .presse").wait_for(state="detached", timeout=15000); pg.wait_for_timeout(800)
    element(pg, sel, f"{name}_antwort", [("frage", ".frage"), ("antwort", ".antwort"), ("form", "form")])


with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page(); page.on("dialog", lambda d: d.accept())
    registrieren(page, DEMO_MAIL, DEMO_PW)
    chef_ctx = b.new_context(viewport={"width": 1440, "height": 900}); chef = chef_ctx.new_page(); chef.on("dialog", lambda d: d.accept())
    registrieren(chef, CHEF_MAIL, CHEF_PW)
    chef.goto(U + "#bestaetigen=" + link(CHEF_MAIL, "bestaetigen")); chef.wait_for_timeout(1200); chef.reload(); chef.wait_for_timeout(1200)
    chef.evaluate(f"api('ecke', {{ passwort: '{ECKE}' }})")
    konto = chef.evaluate(f"api('admin').then(d => d.konten.find(k => k.email === '{DEMO_MAIL}').id)")
    chef.evaluate(f"api('admin/tarif', {{ konto: {konto}, tarif: 'ultra', tage: 30 }})")
    token = page.evaluate("api('pc', {})")["token"]
    for f in sorted(INHALT.rglob("*")):
        if f.is_file(): hochladen(token, f.relative_to(INHALT).as_posix(), f.read_bytes())
    zustand = ctx.storage_state()
    chef_ctx.close(); ctx.close()

    def kontext(handy):
        c = b.new_context(viewport={"width": 390, "height": 844} if handy else {"width": 1440, "height": 900}, device_scale_factor=3 if handy else 2,
                          is_mobile=handy, has_touch=handy, storage_state=zustand, timezone_id="Europe/Vienna", locale="de-AT", bypass_csp=True)
        c.add_init_script("""(() => { try { localStorage.removeItem('thema'); } catch {}
          const s = document.createElement('style'); s.textContent = %s;
          const dran = () => (document.head || document.documentElement).appendChild(s);
          document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', dran) : dran(); })();""" % json.dumps(VERSTECKEN))
        pg = c.new_page(); pg.on("dialog", lambda d: d.accept())
        pg.on("pageerror", lambda e: print("  Seitenfehler:", e))
        pg.clock.set_fixed_time(UHR)
        return c, pg

    # ---------- Desktop: Kalender ----------
    c, pg = kontext(False)
    pg.goto(U + "#/kalender"); pg.wait_for_timeout(3000)
    foto(pg, "d_kalender", [("woche", ".kal-panels, .woche"), ("fristen", "button:has-text('Neue Fristen übernehmen'), a:has-text('Neue Fristen übernehmen')"),
                            ("ics", "label:has-text('ICS-Datei hinzufügen')")], voll=False)
    element(pg, ".woche", "kal_woche")
    element(pg, ".kal-panel:has-text('iPad')", "kal_ipad", [("knopf", "button")])
    c.close()

    # ---------- Handy ----------
    c, pg = kontext(True)
    pg.goto(U + "#/"); pg.wait_for_timeout(3000)
    foto(pg, "heute", [("fristen", "#fristen"), ("haken1", "#fristen .frist .haken"), ("woche", ".woche-feld"), ("faecher", "#ressorts"), ("mathe", "#ressorts .fach"),
                       ("assistent", "#assistent"), ("abgleich", ":text('abgeglichen')"), ("alle", "#alle")])
    pg.locator("#fristen .frist .haken input").first.click(); pg.wait_for_timeout(600)
    foto(pg, "heute_ab", [("fristen", "#fristen")])
    pg.evaluate("Object.keys(localStorage).filter(x => x.startsWith('frist:')).forEach(x => localStorage.removeItem(x))")
    fragen(pg, "#assistent", F_PS, "assistent")

    pg.goto(U + "#/Mathematik"); pg.wait_for_timeout(2500)
    teile = [("kopf", "#ausgabe .ausgabe-kopf"), ("aktionen", "#ausgabe .kopf-aktionen"), ("leiste", "#ausgabe nav.abschnitte"), ("blick", "#ausgabe .blick"),
             ("zusammenfassung", "#ausgabe h2:has-text('Zusammenfassung')"), ("formeln", "#teil-formeln"), ("ps", "#ausgabe h2:has-text('Nächstes Proseminar')"),
             ("uebungen", "#teil-uebungen"), ("aufgabe1", "#teil-uebungen .aufgabe"), ("lexikon", "#teil-lexikon"), ("fragen", "#teil-fragen"), ("archiv", "#teil-archiv")]
    foto(pg, "ausgabe", teile)
    pg.locator("#teil-uebungen .aufgabe").first.locator("summary").first.click(); pg.wait_for_timeout(500)
    foto(pg, "ausgabe_auf", [("aufgabe1", "#teil-uebungen .aufgabe")])
    element(pg, "#teil-formeln", "formeln")
    element(pg, "#teil-archiv", "archiv")
    fragen(pg, "#teil-fragen", F_KETTE, "chat")
    fragen(pg, "#teil-fragen", F_PRUEFUNG, "chat2")
    # Anhören: Gespräch und Ton kommen von der Attrappe
    pg.evaluate("scrollTo(0, 0)")
    pg.locator("#ausgabe .kopf-aktionen").get_by_role("button", name="Anhören").click()
    pg.locator("section.hoeren audio").wait_for(timeout=30000); pg.wait_for_timeout(1500)
    element(pg, "section.hoeren", "hoeren")
    element(pg, "#ausgabe .kopf-aktionen", "aktionen")

    pg.goto(U + "#/karten"); pg.wait_for_timeout(2000)
    foto(pg, "karten", [("karte", ".karte"), ("export", "button:has-text('Für Quizlet kopieren')")])
    element(pg, ".knopfreihe:has(button:has-text('Für Quizlet kopieren'))", "karten_export")

    pg.goto(U + "#/onlinetests"); pg.wait_for_timeout(2500)
    foto(pg, "tests", [("offen", ".testgruppe"), ("foto", "button:has-text('Test per Foto')"), ("fertig", ".testgruppe:has-text('Erledigt')")])
    element(pg, ".testgruppe", "tests_offen")
    element(pg, ".testgruppe:has-text('Erledigt')", "tests_fertig")
    pg.get_by_role("button", name="Test per Foto hinzufügen").click(); pg.wait_for_timeout(500)
    element(pg, "#tf-form", "tests_foto")
    # Lösungsweg an einer Übungsaufgabe (abgelaufener Test); die Server-Prompts gibt es im Prüfstand nicht, die Lösung steht schon im Gerät
    tid = "Mathematik|Onlinetest 2: Funktionen"
    pg.evaluate("""([k, v]) => { localStorage.setItem(k, v); LOESER_PROMPT = 'demo'; }""", [f"loeser:{tid}#1", json.dumps({"zeit": "2026-10-19T08:30:00.000Z", "preis": 0, "text": r"""### Frage 1 · Steigung einer Geraden
**Übungsaufgabe mit anderen Zahlen:** Bestimme die Steigung von \(g(x) = 2{,}5x + 3\).

Bei einer linearen Funktion \(g(x) = a x + b\) ist die Steigung der Faktor vor dem \(x\).

**Ergebnis der Übungsaufgabe: 2,5**
#### Rechenweg
1. Form erkennen: \(g(x) = a x + b\) mit \(a = 2{,}5\) und \(b = 3\).
2. Die Steigung ist \(a\), also \(2{,}5\).
3. Probe: \(g(1) - g(0) = 5{,}5 - 3 = 2{,}5\).

Die Originalaufgabe rechnest du jetzt genauso selbst."""})])
    pg.goto(U + "#/onlinetests/" + urllib.parse.quote(tid)); pg.wait_for_timeout(2000)
    pg.locator(".loeser-teil details.loesung summary").first.click(); pg.wait_for_timeout(500)
    foto(pg, "test_loesung", [("frage", "#frage-karte .aufgabentext"), ("loesung", ".loeser-teil"), ("weg", ".loeser-teil .aufgabe")])

    pg.goto(U + "#/noten"); pg.wait_for_timeout(2500)
    foto(pg, "noten", [("diagramm", "#noten svg"), ("lv1", "#noten .lv-karte"), ("pruefungen", "#noten h2:has-text('Prüfungen')")])
    karte = pg.locator("#noten article.lv-karte:has(summary:has-text('Lernplan'))").first
    karte.locator("summary:has-text('Lernplan')").click(); pg.wait_for_timeout(500)
    element(pg, "#noten article.lv-karte:has(summary:has-text('Lernplan'))", "pruefung_plan")
    element(pg, "#noten .lv-karte", "noten_lv")

    # Probeklausur: laufend und korrigiert (erfundene Aufgaben)
    jetzt = pg.evaluate("Date.now()")
    auf = [{"typ": "auswahl", "frage": r"Was ist die Ableitung von \(f(x) = x^3\)?", "optionen": [r"\(3x^2\)", r"\(x^2\)", r"\(3x\)", r"\(\frac{x^4}{4}\)"], "richtig": 0, "punkte": 1, "abzug": 0.25,
            "erklaerung": r"Potenzregel: \(3x^{3-1} = 3x^2\)."},
           {"typ": "zahl", "frage": r"\(K(x) = 0{,}5x^2 + 4x + 100\). Grenzkosten bei \(x = 10\)?", "richtig": 14, "punkte": 1, "erklaerung": r"\(K'(x) = x + 4\), also \(K'(10) = 14\)."},
           {"typ": "auswahl", "frage": r"Ableitung von \((2x+1)^3\)?", "optionen": [r"\(3(2x+1)^2\)", r"\(6(2x+1)^2\)", r"\(6x^2\)", r"\((2x+1)^2\)"], "richtig": 1, "punkte": 1, "abzug": 0.25,
            "erklaerung": r"Kettenregel: \(3(2x+1)^2 \cdot 2\)."}]
    auf += [{"typ": "auswahl", "frage": f"Aufgabe {i}: Wann ist eine Funktion steigend?", "optionen": [r"wenn \(f'(x) > 0\)", r"wenn \(f'(x) < 0\)"], "richtig": 0, "punkte": 1, "abzug": 0.25,
             "erklaerung": "Positive Ableitung heißt steigend."} for i in range(4, 11)]
    pk = {"fach": "Mathematik", "titel": "Probeklausur Mathematik", "bewertung": "10 Aufgaben, je 1 Punkt, falsche Auswahl −0,25", "aufgaben": auf,
          "antworten": [0, "14", None, 0], "bis": jetzt + (47 * 60 + 12) * 1000}
    pg.evaluate("v => localStorage.setItem('pk', v)", json.dumps(pk)); pg.goto(U + "#/"); pg.reload(); pg.wait_for_timeout(2500)
    pg.goto(U + "#/pruefung/Mathematik"); pg.wait_for_timeout(3000)
    foto(pg, "pk_laeuft", [("pk", "section.schritt:has(#pk-k)"), ("uhr", "#pk-uhr"), ("aufgaben", ".pk-aufgaben")])
    pk["antworten"] = [0, "14", 0, 0, 0, 1, 0, 0, None, 0]
    pk["ergebnis"] = {"je": [1, 1, -0.25, 1, 1, -0.25, 1, 1, 0, 1], "max": 10, "punkte": 6.5}
    pg.evaluate("v => localStorage.setItem('pk', v)", json.dumps(pk)); pg.reload(); pg.wait_for_timeout(3000)
    pg.locator(".pk-aufgaben details.loesung summary").nth(2).click(); pg.wait_for_timeout(400)
    foto(pg, "pk_ergebnis", [("pk", "section.schritt:has(#pk-k)"), ("kacheln", "section.schritt:has(#pk-k) .kacheln"), ("falsch", ".pk-aufgaben li.pk-falsch"),
                             ("training", "#pt-training"), ("skript", "section.schritt:has(#ls-k)")])
    element(pg, "section.schritt:has(#pk-k) .kacheln", "pk_kacheln")
    element(pg, "#pt-training", "training")
    pg.locator("details.skript summary").click(); pg.wait_for_timeout(500)
    element(pg, "section.schritt:has(#ls-k)", "skript")

    pg.goto(U + "#/vortrag/2026-10-16-demo"); pg.wait_for_timeout(2500)
    foto(pg, "vortrag", [("gesamt", ".vt-gesamt"), ("reflexion", "section.block:has(h2:has-text('Reflexion'))"), ("ger", "section.block:has(.vt-ger-skalen)"),
                         ("zahlen", ".vt-zahlen"), ("befund", ".vt-befund"), ("transkript", ".vt-transkript"), ("coach", "section.block:has(h2:has-text('Coach'))")])
    element(pg, "section.block:has(h2:has-text('Reflexion'))", "vt_reflexion")
    element(pg, ".vt-zahlen", "vt_zahlen")
    element(pg, ".vt-befund", "vt_befund")
    fragen(pg, "section.block:has(h2:has-text('Coach'))", F_AEH, "coach")

    pg.goto(U + "#/unterlagen/Mathematik"); pg.wait_for_timeout(2500)
    foto(pg, "unterlagen", [("form", "#unterlagen form"), ("liste", "#unterlagen ul, #unterlagen ol")])
    element(pg, "#unterlagen form", "unterlagen_form")

    pg.goto(U + "#/einstellungen"); pg.wait_for_timeout(2500)
    pg.locator("#stil").fill(STIL)
    foto(pg, "konto", [("stil", "#stil-teil"), ("modell", "label:has(#modell)"), ("design", "label:has(#design)"), ("freunde", "section[aria-labelledby=k-freunde]"), ("pc", "section[aria-labelledby=k-pc]")])
    for sel, name in [("#stil-teil", "stil"), ("section[aria-labelledby=k-freunde]", "freunde"), ("section[aria-labelledby=k-pc]", "pc"), ("label:has(#modell)", "modell"), ("label:has(#design)", "design")]:
        element(pg, sel, name)

    pg.goto(U + "#/upgrade"); pg.wait_for_timeout(2500)
    foto(pg, "tarife", [("tarife", ".tarife"), ("test", "#u-test"), ("freunde", "#u-freunde")])
    element(pg, ".tarife", "tarife_karten")

    c.close()
    b.close()
ki.shutdown()
(VIDEO / "public" / "shots" / "lang.json").write_text(json.dumps(INFO, indent=1), encoding="utf-8")
print("fertig:", len(INFO), "Bilder")
