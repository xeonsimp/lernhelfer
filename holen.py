"""Holt neue Unterlagen aus OLAT und lädt ihren Text ins private Daten-Repo (über die GitHub-API, ohne git).

Einrichten: in der App „PC einrichten“ (lädt Python, dieses Skript und die Aufgabenplanung nach %LOCALAPPDATA%\\Lernhelfer).
Start von Hand: python holen.py [Fach ...]; --auto = Lauf aus der Aufgabenplanung (alle 30 Minuten), --kurse = nur Kurse suchen.
Ist die OLAT-Sitzung abgelaufen, öffnet sich Chrome: dort selbst einloggen (SSO + Authenticator).

Tests: Laufende Onlinetests werden einmal angesehen und danach mit „Test unterbrechen“ + „Ok“ verlassen,
Selbsttests genauso. Nach Ablauf stehen Fragen und Lösung auf der Startseite. Ein Wächter im Browser lässt
nur Lesen und genau den jeweils nächsten erlaubten Schritt durch – nie Speichern, Beenden oder Abbrechen, siehe erlaubt().
"""
import base64
import hashlib
import html
import json
import logging
import os
import re
import sys
import zipfile
from datetime import datetime, timedelta
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import parse_qs, quote, unquote, urljoin, urlparse
from urllib.request import Request, urlopen

BASIS = Path(__file__).parent
MATERIAL = BASIS / "material"
KURSDATEI = BASIS / "kurse.json"  # fehlt sie, sucht der erste Abgleich die Kurse selbst (kurse_finden)
KURSE = json.loads(KURSDATEI.read_text("utf-8")) if KURSDATEI.exists() else None
ZUGANG = BASIS / "zugang.json"  # {"repo": "name/lernhelfer-daten", "token": "github_pat_…"}, schreibt das Einrichten
STAND = BASIS / ".stand.json"  # letzter Abgleich, hochgeladene Dateiversionen, wann das Login-Fenster zuletzt kam
APP = "https://xeonsimp.github.io/lernhelfer/"
API = os.environ.get("LH_API", "https://api.github.com")  # der Prüfstand setzt hier eine Attrappe ein
SITZUNG = BASIS / ".olat-sitzung.json"
PROFIL = BASIS / ".olat-chrome"  # eigenes Chrome-Profil nur fürs OLAT-Login
KANAL = "chrome" if any(Path(p, r"Google\Chrome\Application\chrome.exe").exists() for p in
                        (r"C:\Program Files", r"C:\Program Files (x86)", Path.home() / r"AppData\Local")) else "msedge"
OLAT = "https://lms.uibk.ac.at"
ARTEN = ["folien", "ps", "syllabus"]
TESTS = "Tests"  # material/<Fach>/Tests: Startseiten der Onlinetests, Fragen der Selbsttests
# Knöpfe, die im Test vor jedem Klick aus der Seite entfernt werden („Test unterbrechen“ bleibt, ist aber bis zum Schluss gesperrt)
GEFAHR = ".o_sel_assessment_item_submit, .o_sel_end_testpart, .o_sel_cancel_test, .o_sel_next_question"
logging.getLogger("pypdf").setLevel(logging.ERROR)  # harmlose Warnungen bei schief gebauten PDFs


def natur(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]


def text(f):
    endung = f.suffix.lower()
    if endung == ".pdf":
        from pypdf import PdfReader
        return "\n".join(p.extract_text() or "" for p in PdfReader(f).pages)
    if endung in (".docx", ".pptx"):
        z = zipfile.ZipFile(f)
        teile = sorted((n for n in z.namelist() if re.fullmatch(r"word/document\.xml|ppt/slides/slide\d+\.xml", n)), key=natur)
        xml = "\n".join(z.read(n).decode("utf-8") for n in teile)
        return html.unescape(re.sub(r"<[^>]+>", "", re.sub(r"</[aw]:p>", "\n", xml)))
    if endung in (".html", ".htm", ".txt"):
        roh = re.sub(r"(?s)<(script|style)\b.*?</\1>", "", f.read_text("utf-8", errors="ignore"))
        return html.unescape(re.sub(r"<[^>]+>", " ", roh))
    return ""  # Bilder, Videos usw. haben keinen Text


def fach_json(fach):
    """Alle geladenen Dateien eines Fachs samt Text, Folien zuerst."""
    dateien = []
    for q in sorted(KURSE[fach], key=lambda q: ARTEN.index(q["art"])):
        ordner = MATERIAL / fach / q["name"]
        for f in sorted(ordner.iterdir() if ordner.exists() else [], key=lambda f: natur(f.name)):
            try:
                t = text(f)
            except Exception as e:  # kaputte Datei soll den Rest nicht aufhalten
                t = f"(Text nicht lesbar: {e})"
            dateien.append({"datei": f"{q['name']}/{f.name}", "art": q["art"], "text": t})
    for f in sorted((MATERIAL / fach / TESTS).glob("*.txt"), key=lambda f: natur(f.name)):
        dateien.append({"datei": f"{TESTS}/{f.name}", "art": "test", "text": f.read_text("utf-8")})
    return {"dateien": dateien}  # ohne Zeitstempel: unveränderte Fächer werden nicht neu hochgeladen


class Abgelaufen(Exception):
    pass


def olat_login(p, sichtbar=True, fenster_auf=lambda: None):
    """Erst unsichtbar mit gespeicherter Sitzung. Ist die abgelaufen, öffnet sich Chrome mit eigenem Lernhelfer-Profil
    zum Einloggen (SSO + Authenticator); dort gespeicherte Passwörter füllt Chrome beim nächsten Mal selbst aus.
    Wartet höchstens 10 Minuten (Playwright-TimeoutError)."""
    browser = p.chromium.launch(channel=KANAL, headless=True)
    for versuch in (1, 2):
        ctx = browser.new_context(storage_state=SITZUNG if SITZUNG.exists() else None, accept_downloads=True)
        page = ctx.new_page()
        page.goto(OLAT + "/auth/MyCoursesSite/0")
        if page.get_by_text("Eingeloggt als").count():  # OLAT zeigt die Login-Seite unter derselben URL
            return browser, ctx, page
        ctx.close()
        if versuch == 2 or not sichtbar:
            browser.close()
            raise Abgelaufen
        fenster_auf()
        fenster = p.chromium.launch_persistent_context(PROFIL, channel=KANAL, headless=False,
                                                       ignore_default_args=["--enable-automation", "--disable-extensions"])
        seite = fenster.pages[0] if fenster.pages else fenster.new_page()
        seite.goto(OLAT + "/auth/MyCoursesSite/0")
        print(f"Bitte im {KANAL.title()}-Fenster bei OLAT einloggen (10 Minuten Zeit) …", flush=True)
        seite.get_by_text("Eingeloggt als").wait_for(timeout=600_000)
        fenster.storage_state(path=SITZUNG)
        fenster.close()


FACHNAMEN = {"BWL": r"betriebswirt", "VWL": r"volkswirt", "Mathematik": r"mathemati", "Statistik": r"statisti",
             "Englisch": r"englisch|english", "Recht": r"recht", "Rechnungswesen": r"rechnungswesen|buchhalt",
             "Wirtschaftsinformatik": r"wirtschaftsinformatik"}
NICHT_LADEN = re.compile(r"video|aufzeichnung|livestream|einstieg", re.I)  # Dokument-Knoten ohne Text


def semester(jetzt):
    """Semesterkürzel wie in den LFU-Kurstiteln: Oktober 2026 bis Februar 2027 = 2026W, März bis September = S."""
    return f"{jetzt.year}S" if 3 <= jetzt.month <= 8 else f"{jetzt.year - (jetzt.month <= 2)}W"


def kursfach(titel, jetzt):
    """Fach zu einem Kurstitel aus „Meine Kurse“, None = nicht abgleichen (anderes Semester, kein Fach erkennbar)."""
    code = re.match(r"(\d{4}[WS])\d+\s+", titel)
    if code and code.group(1) != semester(jetzt):
        return None
    for fach, muster in FACHNAMEN.items():
        if re.search(muster, titel, re.I):
            return fach
    rest = re.sub(r"^\d{4}[WS]\d+\s+(?:[A-Z]{2}\s+)?", "", titel) if code else ""
    return " ".join(rest.split()[:3]).rstrip(":-–") or None  # ponytail: unbekanntes Fach heißt nach den ersten Wörtern


def kursart(kurs, knoten_titel):
    if re.search(r"syllabus|general information|organisator|faq", knoten_titel, re.I):
        return "syllabus"
    return "ps" if re.match(r"(\d{4}[WS]\d+\s+)?PS\b", kurs) or re.search(r"\bPS\b|proseminar|aufgabe", knoten_titel, re.I) else "folien"


def kurse_finden(page, jetzt=None):
    """Baut kurse.json aus „Meine Kurse → Aktiv“: Ordner (eine Unterordner-Ebene), Dokumente und Seiten oben im Kurs.
    Klausurarchiv, Foren, Abgaben, Videos und Tests (die liest tests()) bleiben draußen."""
    jetzt = jetzt or datetime.now()
    page.goto(OLAT + "/auth/MyCoursesSite/0/My/0")
    page.wait_for_load_state("networkidle")
    kurse = page.evaluate(r"""() => [...new Map([...document.querySelectorAll('#o_main_center_content_inner a[href*="RepositoryEntry/"]')]
      .filter(a => a.innerText.trim() && a.innerText.trim() !== 'Öffnen')
      .map(a => [a.href.match(/RepositoryEntry\/(\d+)/)[1], a.innerText.trim()])).entries()]""")
    neu = {}
    for kurs, titel in kurse:
        fach = kursfach(titel, jetzt)
        if not fach:
            continue
        typ = (re.match(r"\d{4}[WS]\d+\s+([A-Z]{2})\b", titel) or [None, ""])[1]
        alle = knoten(page, kurs)
        wurzel = alle[0]["titel"] if alle else None
        for k in alle:
            if k["eltern"] in ("Klausurarchiv", "Abgaben") or not k["titel"]:
                continue
            url = f"{kurs}/CourseNode/{k['id']}"
            if k["icon"] == "o_bc_icon":
                page.goto(f"{OLAT}/auth/RepositoryEntry/{url}")
                page.wait_for_load_state("networkidle")
                unter = [t.strip() for t in page.locator("#o_main_center_content_inner .o_folder_card:has(.o_filetype_folder) .o_folder_card_title").all_inner_texts()]
                eintraege = [(k["titel"], url)] + [(f"{k['titel']} {u}", f"{url}/path%3D~~{quote(u)}/0") for u in unter]
            elif (k["icon"] is None and not NICHT_LADEN.search(k["titel"])) or (k["icon"] == "o_sp_icon" and k["eltern"] == wurzel):
                eintraege = [(k["titel"], url)]
            else:
                continue
            for name, adresse in eintraege:
                neu.setdefault(fach, []).append({"name": re.sub(r'[\\/:*?"<>|]', "-", f"{typ} {name}".strip()),  # wird Ordnername
                                                 "art": kursart(titel, name), "url": adresse})
    for fach, liste in neu.items():  # gleiche Namen (z. B. zweimal „Syllabus“) bekommen eine Nummer
        gesehen = {}
        for q in liste:
            gesehen[q["name"]] = gesehen.get(q["name"], 0) + 1
            if gesehen[q["name"]] > 1:
                q["name"] += f" {gesehen[q['name']]}"
    return neu


def oeffne(page, url):
    page.goto(url)
    page.wait_for_load_state("networkidle")
    groesse = page.locator("#o_main_center_content_inner .o_table_pagination .dropdown-toggle")
    if groesse.count() and groesse.inner_text().strip() != "250":  # Ordner zeigen sonst nur 20 Dateien
        groesse.click()
        page.locator(".o_table_pagination .dropdown-menu a", has_text="250").click()
        page.locator(".o_table_pagination .dropdown-toggle", has_text="250").wait_for()


def sync(ctx, page, fach):
    neu = []
    for q in KURSE[fach]:
        ziel = MATERIAL / fach / q["name"]
        ziel.mkdir(parents=True, exist_ok=True)
        url = f"{OLAT}/auth/RepositoryEntry/{q['url']}"
        oeffne(page, url)
        main = page.locator("#o_main_center_content_inner")
        herunterladen = main.locator("a:visible", has_text="Herunterladen")
        seite = main.locator("iframe[src*='/m/']:not([src*='viewer.html'])")  # HTML-Seite, kein PDF-Betrachter
        karten = main.locator(".o_folder_card:not(:has(.o_filetype_folder))")
        if main.locator(".o_folder_card").count():  # Ordner
            # ponytail: Unterordner werden übersprungen (bei Bedarf eigener Eintrag in kurse.json),
            # vorhandene Dateien nicht neu geladen – geänderte Datei mit gleichem Namen: lokal löschen.
            namen = [n.strip() for n in karten.locator(".o_folder_card_title").all_inner_texts()]
            for name in [n for n in namen if not (ziel / n).exists()]:
                oeffne(page, url)  # OLAT lädt die Seite nach jedem Download neu
                karten.filter(has=page.get_by_text(name, exact=True)).locator("a:has(.o_icon_actions)").click()
                with page.expect_download() as dl:
                    page.get_by_role("link", name="Herunterladen", exact=True).last.click()
                dl.value.save_as(ziel / name)
                neu.append(f"{fach}: {q['name']}/{name}")
        elif herunterladen.count():  # einzelne Datei
            with page.expect_download() as dl:
                herunterladen.first.click()
            name = dl.value.suggested_filename
            if not (ziel / name).exists():
                neu.append(f"{fach}: {q['name']}/{name}")
            dl.value.save_as(ziel / name)
        elif seite.count():  # eingebettete HTML-Seite
            src = seite.first.get_attribute("src")
            name = unquote(src.rsplit("/", 1)[-1])
            if not (ziel / name).exists():
                neu.append(f"{fach}: {q['name']}/{name}")
            (ziel / name).write_bytes(ctx.request.get(urljoin(OLAT, src)).body())
    return neu


def felder(body):
    """Formularfelder einer OLAT-Anfrage (urlencoded oder multipart)."""
    if "Content-Disposition" in body:
        return dict(re.findall(r'name="([^"]+)"\r\n\r\n([^\r]*)', body))
    return {k: v[0] for k, v in parse_qs(body).items()}


def erlaubt(methode, url, body, frei):
    """Testschutz für jede Anfrage der Test-Sitzung: Lesen (GET) geht durch, sonst nur genau die eine Aktion,
    die gerade in `frei` steht ({cid: Adresse oder Formular-Element}; Formular-Knöpfe ohne cid wie 'Test
    unterbrechen' unter None), und nie mit einer eingetragenen Antwort. 'Antwort speichern', 'Test beenden',
    'Abbrechen', 'Nächste Frage' und das Autosave stehen nie in `frei` – der Browser bricht sie ab, bevor sie OLAT erreichen."""
    if methode == "GET":
        return True
    f = felder(body or "")
    ziel = frei.get(f.get("cid"))
    antwort = any(v for k, v in f.items() if k.startswith("qtiworks_") and not k.startswith("qtiworks_presented_"))
    return ziel is not None and ziel in (f.get("dispatchuri"), unquote(urlparse(url).path)) and not antwort


KNOTEN_JS = r"""() => [...document.querySelectorAll('.o_tree li[data-nodeid]')].map(li => {
  const a = li => li?.querySelector(':scope > div .o_tree_link a');
  return {id: li.dataset.nodeid, titel: a(li)?.innerText.trim(),
          icon: [...(a(li)?.querySelector('i')?.classList || [])].find(c => /^o_\w+_icon$/.test(c)),
          eltern: a(li.parentElement.closest('li[data-nodeid]'))?.innerText.trim()}; })"""
# Eingaben als [Wert] bzw. [x] in den Text, zugeklappte Lösungen aufklappen (nur in der eigenen Seitenkopie)
LESEN_JS = r"""m => {
  m.querySelectorAll('input[type=text], textarea').forEach(i => i.replaceWith(` [${i.value}] `));
  m.querySelectorAll('input:checked').forEach(i => i.replaceWith(' [x] '));
  m.querySelectorAll('.collapse').forEach(c => c.style.display = 'block');
  return m.innerText.replace(/\n\s*\n\s*/g, '\n\n').trim(); }"""
# angezeigte Frage hat kein ausgefülltes Antwortfeld
LEER_JS = r"""() => ![...document.querySelectorAll('.o_assessmentitem_wrapper :is(input, textarea, select)')]
  .some(i => ['radio', 'checkbox'].includes(i.type) ? i.checked : i.type !== 'hidden' && i.value)"""


def knoten(page, kurs):
    """Alle Kursbausteine; Strukturknoten werden per Adresse geöffnet, damit der Baum aufklappt."""
    alle, offen = {}, [""]
    while offen:
        page.goto(f"{OLAT}/auth/RepositoryEntry/{kurs}{offen.pop()}")
        page.wait_for_load_state("networkidle")
        for k in page.evaluate(KNOTEN_JS):
            if k["id"] not in alle:
                alle[k["id"]] = k
                if k["icon"] == "o_st_icon":
                    offen.append(f"/CourseNode/{k['id']}")
    return list(alle.values())


def test_lesen(page, frei, startknopf):
    """Startet bzw. setzt einen Test fort, zeigt jede Frage einmal an und unterbricht ihn danach mit Bestätigung.
    Freigegeben ist immer nur der nächste Schritt: Start → 'Frage X anzeigen' → 'Test unterbrechen' → 'Ok'.
    Speichern-, Beenden-, Abbrechen- und Weiter-Knöpfe werden vor jedem Klick aus der Seite entfernt."""
    knopf = page.locator("a.o_sel_start_qti21assessment")
    assert knopf.count() == 1 and knopf.inner_text().strip() == startknopf, "kein passender Startknopf"
    ereignis = lambda a: re.search(r"o_XHREvent\('([^']+)'.*?'cid','([^']+)'", a.get_attribute("onclick")).groups()
    try:
        pfad, _ = ereignis(knopf)
        frei["start"] = pfad
        knopf.click()
        links = page.locator("a[onclick*=\"'cid','selectItem'\"]")
        links.first.wait_for()
        frei.clear()
        frei["selectItem"] = re.search(r"'(o_fi\d+)'", links.first.get_attribute("onclick")).group(1)
        fragen, leer = [], []

        def zeige(i):
            page.evaluate(f"() => document.querySelectorAll('{GEFAHR}').forEach(e => e.remove())")
            links.nth(i).evaluate("a => a.click()")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(800)

        for i in range(links.count()):
            zeige(i)
            if page.evaluate(LEER_JS):
                leer.append(i)
            frage = page.locator(".o_assessmentitem_wrapper").first  # mit Kopf: Status und Punkte der Frage
            fragen.append(f"Frage {i + 1}\n" + frage.evaluate(LESEN_JS))
        # 'Unterbrechen' schickt die Felder der angezeigten Frage mit – darum auf einer Frage ohne Antwort unterbrechen
        if not leer:
            print("Alle Fragen haben schon Antworten: Test bleibt ohne Unterbrechen offen.", flush=True)
            return "\n\n".join(fragen)
        if leer[-1] != links.count() - 1:
            zeige(leer[-1])
        frei.clear()
        unterbrechen = page.locator("a.o_sel_suspend_test")
        assert unterbrechen.count() == 1 and unterbrechen.inner_text().strip() == "Test unterbrechen"
        frei[None] = unterbrechen.get_attribute("id")
        unterbrechen.evaluate("a => a.click()")
        dialog = page.locator(".modal-dialog", has=page.get_by_text("Wollen Sie wirklich unterbrechen?"))
        dialog.wait_for()
        ok = dialog.locator("a.btn", has_text=re.compile(r"^\s*Ok\s*$"))
        assert dialog.locator("h4").inner_text().strip() == "Test unterbrechen" and ok.count() == 1
        frei.clear()
        pfad, cid = ereignis(ok)
        frei[cid] = pfad
        ok.evaluate("a => a.click()")
        page.locator("a.o_sel_start_qti21assessment").wait_for()  # zurück auf der Startseite = unterbrochen
        return "\n\n".join(fragen)
    finally:
        frei.clear()


def zeitraum(seite):
    """(von, bis) aus „Verfügbarkeit: 15.10.2026, 16:30 bis 19.10.2026, 18:00“, „Bis …“, „Abgelaufen am …“ oder „Ab …“."""
    zeile = (re.search(r"Verfügbarkeit:([^\n]*)", seite) or [None, ""])[1]
    d = [datetime.strptime(f"{t}, {u}", "%d.%m.%Y, %H:%M") for t, u in re.findall(r"(\d\d\.\d\d\.\d{4}), (\d\d:\d\d)", zeile)]
    if len(d) == 1:
        return (d[0], None) if re.match(r"\s*ab\b", zeile, re.I) else (None, d[0])
    return (d[0], d[1]) if len(d) == 2 else (None, None)


def laeuft(page, seite, jetzt=None):
    """Bewerteter Test ist gerade bearbeitbar: Zeitraum hat begonnen, Startknopf da, Versuch übrig, kein Zeitlimit pro Versuch."""
    info = seite.split("Informationen")[-1]
    von, bis = zeitraum(seite)
    jetzt = jetzt or datetime.now()
    return (von is None or von <= jetzt) and (bis is None or jetzt < bis) \
        and page.locator("a.o_sel_start_qti21assessment").count() == 1 and "Dies sind Ihre Testresultate" not in seite \
        and re.search(r"Verbleibend: [1-9]", info) and not re.search(r"zeit|dauer|minute", info, re.I)


def testliste(fach):
    """Alle Tests eines Fachs für den Onlinetest-Überblick der App: Zeitraum, Punkte, Versuche, Fragen.
    Den Stand (läuft, vorbei, erledigt) rechnet die App selbst aus der Uhrzeit."""
    ordner, aus = MATERIAL / fach / TESTS, []
    for f in sorted(ordner.glob("*.txt"), key=lambda f: natur(f.name)):
        if f.stem.endswith(" – Fragen"):
            continue
        t, fragen = f.read_text("utf-8"), ordner / f"{f.stem} – Fragen.txt"
        if t.startswith("Selbsttest „"):  # Selbsttest-Baustein: die Datei enthält schon die Fragen
            aus.append({"fach": fach, "titel": f.stem, "art": "selbsttest", "fragen": t})
            continue
        von, bis = zeitraum(t)
        zahl = lambda muster: (m := re.search(muster, t)) and float(m.group(1).replace(",", "."))
        aus.append({"fach": fach, "titel": f.stem, "art": "test", "startseite": t,
                    "fragen": fragen.read_text("utf-8") if fragen.exists() else None,
                    "von": von and von.isoformat(timespec="minutes"), "bis": bis and bis.isoformat(timespec="minutes"),
                    "punkte": zahl(r"Max\. Punktzahl: ([\d.,]+)"), "verbleibend": zahl(r"Verbleibend: (\d+)"),
                    "ergebnis": "Dies sind Ihre Testresultate" in t,
                    "uebung": bool(re.search(r"nicht relevant für die Leistungsbeurteilung|ohne Notendruck|nur zur Übung", t)
                                   or "Selbsttest" in f.stem)})
    return aus


def tests(browser, fach):
    """Onlinetests und Selbsttests eines Fachs nach material/<Fach>/Tests – in eigener Sitzung mit Testschutz."""
    frei, neu = {}, []

    def waechter(route):
        r = route.request
        body = r.post_data_buffer.decode(errors="ignore") if r.post_data_buffer else ""
        if "mathjax" in r.url.lower() or not erlaubt(r.method, r.url, body, frei):  # ohne MathJax bleibt LaTeX lesbar
            return route.abort()
        route.continue_()

    ctx = browser.new_context(storage_state=SITZUNG)
    ctx.route("**/*", waechter)
    page = ctx.new_page()
    ziel = MATERIAL / fach / TESTS
    ziel.mkdir(parents=True, exist_ok=True)
    for kurs in sorted({q["url"].split("/")[0] for q in KURSE[fach]}):
        for k in knoten(page, kurs):
            # ponytail: Altklausuren (Klausurarchiv) übersprungen – eigener Prüfungsmodus, falls gewünscht
            if k["icon"] not in ("o_iqtest_icon", "o_iqself_icon") or k["eltern"] == "Klausurarchiv":
                continue
            name = re.sub(r'[\\/:*?"<>|]', "-", k["titel"])
            datei, fragen = ziel / f"{name}.txt", ziel / f"{name} – Fragen.txt"
            if k["icon"] == "o_iqself_icon" and datei.exists():  # Selbsttests ändern sich nicht
                continue
            page.goto(f"{OLAT}/auth/RepositoryEntry/{kurs}/CourseNode/{k['id']}")
            page.wait_for_load_state("networkidle")
            try:
                if k["icon"] == "o_iqself_icon":
                    t = f"Selbsttest „{k['titel']}“ (anonyme, unbewertete Übung) – Fragen ohne Lösung\n\n" + test_lesen(page, frei, "Selbsttest starten")
                else:
                    seite = page.locator("#o_main_center_content_inner").evaluate(LESEN_JS)
                    t = f"OLAT-Test „{k['titel']}“ – Startseite (ob er bewertet wird, steht im Text)\n\n" + seite
                    if "Dies sind Ihre Testresultate" in seite:  # abgelaufen: Fragen samt Lösung stehen auf der Startseite
                        fragen.unlink(missing_ok=True)
                    elif not fragen.exists() and laeuft(page, seite):  # einmal ansehen, dann unterbrechen
                        fragen.write_text(f"OLAT-Test „{k['titel']}“ – Fragen, gelesen am {datetime.now():%d.%m.%Y} während der "
                                          f"Bearbeitungszeit, ohne Lösung. Zeitraum und Bewertung: siehe Startseite „{datei.name}“.\n\n"
                                          + test_lesen(page, frei, "Test starten"), "utf-8")
                        neu.append(f"{fach}: {TESTS}/{fragen.name}")
            except Exception as e:  # ein Test soll den Rest nicht aufhalten
                print(f"{fach}: {k['titel']} nicht lesbar ({e})", flush=True)
                continue
            if not datei.exists() or datei.read_text("utf-8") != t:
                neu.append(f"{fach}: {TESTS}/{datei.name}")
                datei.write_text(t, "utf-8")
    ctx.close()
    return neu


def api(methode, pfad, body=None):
    """GitHub-API mit dem Token aus zugang.json (darf nur das eigene Daten-Repo lesen und schreiben)."""
    z = json.loads(ZUGANG.read_text("utf-8"))
    anfrage = Request(f"{API}/repos/{z['repo']}/contents/{quote(pfad)}", method=methode, data=body and json.dumps(body).encode(),
                      headers={"Authorization": "Bearer " + z["token"], "Accept": "application/vnd.github+json", "User-Agent": "Lernhelfer"})
    with urlopen(anfrage, timeout=120) as r:
        return json.loads(r.read())


def hochladen(stand, pfad, daten):
    """Eine Datei ins Daten-Repo; unverändert seit dem letzten Hochladen = nichts tun (Git-Prüfsumme lokal gerechnet)."""
    shas = stand.setdefault("sha", {})
    if shas.get(pfad) == hashlib.sha1(b"blob %d\0" % len(daten) + daten).hexdigest():
        return
    for versuch in (1, 2):
        body = {"message": f"OLAT-Abgleich {datetime.now():%d.%m.%Y %H:%M}: {pfad}", "content": base64.b64encode(daten).decode()}
        if shas.get(pfad):
            body["sha"] = shas[pfad]
        try:
            shas[pfad] = api("PUT", pfad, body)["content"]["sha"]
            return
        except HTTPError as e:  # 409/422: Datei gibt es schon in anderer Fassung (erster Lauf, anderes Gerät) → aktuelle holen
            if e.code not in (409, 422) or versuch == 2:
                raise
            try:
                shas[pfad] = api("GET", pfad)["sha"]
            except HTTPError as e2:
                if e2.code != 404:
                    raise
                shas.pop(pfad, None)


def aktualisieren():
    """Installierte Kopien holen sich neue Fassungen von holen.py selbst (gilt ab dem nächsten Lauf); die Entwicklungskopie nicht."""
    if (BASIS / ".git").exists():
        return
    try:
        neu = urlopen(APP + "holen.py", timeout=30).read()
        compile(neu, "holen.py", "exec")
        if neu != Path(__file__).read_bytes():
            Path(__file__).write_bytes(neu)
            print("holen.py aktualisiert.")
    except Exception as e:
        print("Aktualisierung übersprungen:", e)


if __name__ == "__main__":
    from playwright.sync_api import TimeoutError as Zeitueberschreitung, sync_playwright

    auto = "--auto" in sys.argv  # aus der Aufgabenplanung: ohne Konsole, Ausgaben ins Log
    if auto:
        sys.stdout = sys.stderr = open(BASIS / "holen.log", "a", encoding="utf-8", buffering=1)
        print(f"--- {datetime.now():%d.%m.%Y %H:%M}")
    stand = json.loads(STAND.read_text("utf-8")) if STAND.exists() else {}
    alt = stand.get("abgleich", {})
    jetzt = datetime.now()

    def melde(ok, text, dateien=()):
        stand["abgleich"] = {"zeit": datetime.now().isoformat(timespec="minutes"), "ok": ok, "text": text}
        try:
            for pfad, inhalt in [*dateien, ("abgleich.json", stand["abgleich"])]:
                hochladen(stand, pfad, json.dumps(inhalt, ensure_ascii=False).encode())
        finally:
            STAND.write_text(json.dumps(stand, ensure_ascii=False), "utf-8")

    with sync_playwright() as p:
        # Login-Fenster aus der Aufgabenplanung höchstens alle 8 Stunden (z. B. morgens nach dem Einschalten), sonst nervt es
        def fenster_auf():
            stand["fenster"] = datetime.now().isoformat(timespec="minutes")
            STAND.write_text(json.dumps(stand, ensure_ascii=False), "utf-8")
        try:
            browser, ctx, page = olat_login(p, sichtbar=not auto or jetzt - datetime.fromisoformat(stand.get("fenster", "2000-01-01")) > timedelta(hours=8),
                                            fenster_auf=fenster_auf)
        except (Abgelaufen, Zeitueberschreitung) as e:
            print("OLAT-Anmeldung abgelaufen.", type(e).__name__)
            if alt.get("ok") is not False and ZUGANG.exists():
                melde(False, "OLAT-Anmeldung am PC abgelaufen – am PC „Lernhelfer OLAT“ auf dem Desktop doppelklicken und einloggen.")
            sys.exit(0 if auto else 1)
        ctx.storage_state(path=SITZUNG)  # jeder Aufruf hält die OLAT-Sitzung wach
        if auto and alt.get("ok") and jetzt - datetime.fromisoformat(alt["zeit"]) < timedelta(hours=12):
            print("OLAT-Sitzung aktiv, nur wach gehalten.")
            browser.close()
            sys.exit()  # ponytail: voller Abgleich höchstens alle 12 Stunden, dazwischen nur wach halten
        # Selbst gefundene Kurse jedes Semester neu suchen; eine von Hand gepflegte kurse.json bleibt, wie sie ist
        if KURSE is None or "--kurse" in sys.argv or stand.get("kurse_semester", semester(jetzt)) != semester(jetzt):
            KURSE = kurse_finden(page, jetzt)
            KURSDATEI.write_text(json.dumps(KURSE, ensure_ascii=False, indent=2), "utf-8")
            stand["kurse_semester"] = semester(jetzt)
            print("Gefundene Kurse:", *(f"  {f}: {', '.join(q['name'] for q in l)}" for f, l in KURSE.items()), sep="\n")
            if "--kurse" in sys.argv:
                STAND.write_text(json.dumps(stand, ensure_ascii=False), "utf-8")
                sys.exit()
        if auto:
            aktualisieren()
        faecher = [a for a in sys.argv[1:] if not a.startswith("--")] or list(KURSE)
        neu = [n for f in faecher for n in sync(ctx, page, f)]
        ctx.storage_state(path=SITZUNG)
        neu += [n for f in faecher for n in tests(browser, f)]
        browser.close()
    tests_alle = [t for f in KURSE for t in testliste(f)]
    melde(True, f"{len(neu)} neue Unterlagen" if neu else "Nichts Neues in OLAT",
          [(f"faecher/{f}.json", fach_json(f)) for f in faecher] + [("onlinetests.json", tests_alle)])
    print("\n".join(neu) or "Nichts Neues in OLAT.", "\nFertig – auf dem iPad die App neu laden.", sep="\n")
