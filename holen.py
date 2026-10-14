"""Holt neue Unterlagen aus OLAT und lädt ihren Text ins private Daten-Repo (Ordner daten/).

Start: holen.bat  (oder: python holen.py [Fach ...])
Ist die OLAT-Sitzung abgelaufen, öffnet sich Edge: dort selbst einloggen (SSO + Authenticator).
"""
import html
import json
import re
import subprocess
import sys
import zipfile
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote, urljoin

BASIS = Path(__file__).parent
MATERIAL, DATEN = BASIS / "material", BASIS / "daten"
KURSE = json.loads((BASIS / "kurse.json").read_text("utf-8"))
SITZUNG = BASIS / ".olat-sitzung.json"
OLAT = "https://lms.uibk.ac.at"
ARTEN = ["folien", "ps", "syllabus"]


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


def sync(ctx, page, fach):
    neu = []
    for q in KURSE[fach]:
        ziel = MATERIAL / fach / q["name"]
        ziel.mkdir(parents=True, exist_ok=True)
        url = f"{OLAT}/auth/RepositoryEntry/{q['url']}"
        page.goto(url)
        page.wait_for_load_state("networkidle")
        main = page.locator("#o_main_center_content_inner")
        karten = main.locator(".o_folder_card:not(:has(.o_filetype_folder))")
        if main.locator(".o_folder_card").count():  # Ordner
            # ponytail: Unterordner werden übersprungen (bei Bedarf eigener Eintrag in kurse.json),
            # vorhandene Dateien nicht neu geladen – geänderte Datei mit gleichem Namen: lokal löschen.
            namen = [n.strip() for n in karten.locator(".o_folder_card_title").all_inner_texts()]
            for name in [n for n in namen if not (ziel / n).exists()]:
                page.goto(url)  # OLAT lädt die Seite nach jedem Download neu
                page.wait_for_load_state("networkidle")
                karten.filter(has=page.get_by_text(name, exact=True)).locator("a:has(.o_icon_actions)").click()
                with page.expect_download() as dl:
                    page.get_by_role("link", name="Herunterladen", exact=True).last.click()
                dl.value.save_as(ziel / name)
                neu.append(f"{fach}: {q['name']}/{name}")
        elif main.get_by_text("Herunterladen").count():  # einzelne Datei
            with page.expect_download() as dl:
                main.get_by_text("Herunterladen").first.click()
            name = dl.value.suggested_filename
            if not (ziel / name).exists():
                neu.append(f"{fach}: {q['name']}/{name}")
            dl.value.save_as(ziel / name)
        elif main.locator("iframe[src*='/m/']").count():  # eingebettete HTML-Seite
            src = main.locator("iframe[src*='/m/']").first.get_attribute("src")
            name = unquote(src.rsplit("/", 1)[-1])
            if not (ziel / name).exists():
                neu.append(f"{fach}: {q['name']}/{name}")
            (ziel / name).write_bytes(ctx.request.get(urljoin(OLAT, src)).body())
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
        browser.close()
    (DATEN / "faecher").mkdir(parents=True, exist_ok=True)
    for f in faecher:
        (DATEN / "faecher" / f"{f}.json").write_text(json.dumps(fach_json(f), ensure_ascii=False), "utf-8")
    git("add", "-A")
    if git("status", "--porcelain"):
        git("commit", "--quiet", "-m", f"OLAT-Abruf {datetime.now():%d.%m.%Y %H:%M}")
        git("push", "--quiet")
    print("\n".join(neu) or "Nichts Neues in OLAT.", "\nFertig – auf dem iPad die App neu laden.", sep="\n")
