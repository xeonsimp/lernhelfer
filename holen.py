"""Holt neue Unterlagen aus OLAT und lädt ihren Text ins private Daten-Repo (Ordner daten/).

Start: holen.bat  (oder: python holen.py [Fach ...])
Ist die OLAT-Sitzung abgelaufen, öffnet sich Edge: dort selbst einloggen (SSO + Authenticator).

Tests: Bewertete Onlinetests werden NIE geöffnet – gelesen wird nur ihre Startseite (Thema, Zeitraum,
nach Ablauf die Fragen samt Lösung). Selbsttests (anonym, unbewertet) werden gestartet und Frage für Frage
angezeigt. Ein Wächter im Browser lässt dabei nur Lesen durch, siehe erlaubt().
"""
import html
import json
import logging
import re
import subprocess
import sys
import zipfile
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, unquote, urljoin, urlparse

BASIS = Path(__file__).parent
MATERIAL, DATEN = BASIS / "material", BASIS / "daten"
KURSE = json.loads((BASIS / "kurse.json").read_text("utf-8"))
SITZUNG = BASIS / ".olat-sitzung.json"
OLAT = "https://lms.uibk.ac.at"
ARTEN = ["folien", "ps", "syllabus"]
TESTS = "Tests"  # material/<Fach>/Tests: Startseiten der Onlinetests, Fragen der Selbsttests
# Knöpfe, die im Selbsttest vor jedem Klick aus der Seite entfernt werden
GEFAHR = ".o_sel_assessment_item_submit, .o_sel_end_testpart, .o_sel_cancel_test, .o_sel_suspend_test, .o_sel_next_question"
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
    return {"stand": datetime.now().strftime("%d.%m.%Y %H:%M"), "dateien": dateien}


def olat_login(p):
    """Erst unsichtbar mit gespeicherter Sitzung; ist die abgelaufen, öffnet sich Edge zum Einloggen."""
    for sichtbar in (False, True):
        browser = p.chromium.launch(channel="msedge", headless=not sichtbar)
        ctx = browser.new_context(storage_state=SITZUNG if SITZUNG.exists() else None, accept_downloads=True)
        page = ctx.new_page()
        page.goto(OLAT + "/auth/MyCoursesSite/0")
        drin = page.get_by_text("Eingeloggt als")  # OLAT zeigt die Login-Seite unter derselben URL
        if sichtbar:
            print("Bitte im Edge-Fenster bei OLAT einloggen (10 Minuten Zeit) …", flush=True)
            drin.wait_for(timeout=600_000)
        if drin.count():
            ctx.storage_state(path=SITZUNG)
            return browser, ctx, page
        browser.close()


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
    """Testschutz für jede Anfrage der Test-Sitzung: Lesen (GET) geht durch, sonst nur genau die Aktionen
    in `frei` ({cid: Adresse oder Formular-Element}) und nie mit einem Antwortfeld. 'Antwort speichern',
    'Test beenden', Abbrechen, Unterbrechen und Autosave stehen nie in `frei` – der Browser bricht sie ab,
    bevor sie OLAT erreichen. Bei bewerteten Onlinetests ist `frei` leer."""
    if methode == "GET":
        return True
    f = felder(body or "")
    ziel = frei.get(f.get("cid"))
    return ziel is not None and ziel in (f.get("dispatchuri"), unquote(urlparse(url).path)) \
        and not any(k.startswith("qtiworks_") for k in f)


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


def selbsttest(page, frei):
    """Startet einen Selbsttest und zeigt jede Frage einmal an. Freigegeben: der Start, danach nur 'Frage X anzeigen'."""
    knopf = page.locator("a.o_sel_start_qti21assessment")
    assert knopf.count() == 1 and knopf.inner_text().strip() == "Selbsttest starten", "kein Selbsttest"
    try:
        frei["start"] = re.search(r"o_XHREvent\('([^']+)'", knopf.get_attribute("onclick")).group(1)
        knopf.click()
        links = page.locator("a[onclick*=\"'cid','selectItem'\"]")
        links.first.wait_for()
        del frei["start"]
        frei["selectItem"] = re.search(r"'(o_fi\d+)'", links.first.get_attribute("onclick")).group(1)
        fragen = []
        for i in range(links.count()):
            page.evaluate(f"() => document.querySelectorAll('{GEFAHR}').forEach(e => e.remove())")
            links.nth(i).evaluate("a => a.click()")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(800)
            fragen.append(f"Frage {i + 1}\n" + page.locator(".o_qti_item_body").first.inner_text().strip())
        return "\n\n".join(fragen)
    finally:
        frei.clear()


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
            datei = ziel / (re.sub(r'[\\/:*?"<>|]', "-", k["titel"]) + ".txt")
            if k["icon"] == "o_iqself_icon" and datei.exists():  # Selbsttests ändern sich nicht
                continue
            page.goto(f"{OLAT}/auth/RepositoryEntry/{kurs}/CourseNode/{k['id']}")
            page.wait_for_load_state("networkidle")
            try:
                if k["icon"] == "o_iqtest_icon":  # bewertet: nur die Startseite lesen, nie starten
                    t = "Bewerteter Onlinetest – OLAT-Startseite\n\n" + page.locator("#o_main_center_content_inner").evaluate(LESEN_JS)
                else:
                    t = f"Selbsttest „{k['titel']}“ (anonyme, unbewertete Übung) – Fragen ohne Lösung\n\n" + selbsttest(page, frei)
            except Exception as e:  # ein Test soll den Rest nicht aufhalten
                print(f"{fach}: {k['titel']} nicht lesbar ({e})", flush=True)
                continue
            if not datei.exists() or datei.read_text("utf-8") != t:
                neu.append(f"{fach}: {TESTS}/{datei.name}")
                datei.write_text(t, "utf-8")
    ctx.close()
    return neu


def git(*args):
    return subprocess.run(["git", "-C", str(DATEN), *args], check=True, capture_output=True, text=True).stdout


if __name__ == "__main__":
    from playwright.sync_api import sync_playwright

    faecher = sys.argv[1:] or list(KURSE)
    git("pull", "--rebase", "--quiet")  # Lernseiten, die das iPad inzwischen gespeichert hat
    with sync_playwright() as p:
        browser, ctx, page = olat_login(p)
        neu = [n for f in faecher for n in sync(ctx, page, f)]
        ctx.storage_state(path=SITZUNG)
        neu += [n for f in faecher for n in tests(browser, f)]
        browser.close()
    (DATEN / "faecher").mkdir(parents=True, exist_ok=True)
    for f in faecher:
        (DATEN / "faecher" / f"{f}.json").write_text(json.dumps(fach_json(f), ensure_ascii=False), "utf-8")
    git("add", "-A")
    if git("status", "--porcelain"):
        git("commit", "--quiet", "-m", f"OLAT-Abruf {datetime.now():%d.%m.%Y %H:%M}")
        git("push", "--quiet")
    print("\n".join(neu) or "Nichts Neues in OLAT.", "\nFertig – auf dem iPad die App neu laden.", sep="\n")
