import tempfile
import zipfile
from pathlib import Path

import holen


def test():
    assert sorted(["vo10.pdf", "vo2.pdf", "vo1.pdf"], key=holen.natur) == ["vo1.pdf", "vo2.pdf", "vo10.pdf"]
    with tempfile.TemporaryDirectory() as t:
        t = Path(t)
        with zipfile.ZipFile(t / "s.docx", "w") as z:
            z.writestr("word/document.xml", "<w:p><w:t>Hallo</w:t></w:p><w:p><w:t>Welt &amp; Co</w:t></w:p>")
        assert holen.text(t / "s.docx").split() == ["Hallo", "Welt", "&", "Co"]
        (t / "s.html").write_text("<script>x()</script><p>Termin &amp; Thema</p>", "utf-8")
        assert holen.text(t / "s.html").split() == ["Termin", "&", "Thema"]

        holen.MATERIAL = t / "m"
        holen.KURSE = {"F": [{"name": "Syl", "art": "syllabus"}, {"name": "VO", "art": "folien"}]}
        for n in ("VO/vo10.pdf", "VO/vo2.txt", "Syl/a.html", "Tests/Thema 2.txt"):
            (t / "m/F" / n).parent.mkdir(parents=True, exist_ok=True)
            (t / "m/F" / n).write_bytes(b"x")
        (t / "m/F/Tests/Thema 2.txt").write_text("f(x)<3", "utf-8")
        d = holen.fach_json("F")["dateien"]
        assert [x["datei"] for x in d] == ["VO/vo2.txt", "VO/vo10.pdf", "Syl/a.html", "Tests/Thema 2.txt"]
        assert d[1]["text"].startswith("(Text nicht lesbar")  # kaputtes PDF bricht nicht ab
        assert d[3]["art"] == "test" and d[3]["text"] == "f(x)<3"  # Testtext bleibt unverändert

    # Testschutz mit echten OLAT-Anfragen (Selbsttest Mathematik, 14.10.2026)
    frei = {"start": "/auth/7:1:1109209465:2:1/", "selectItem": "o_fi1109214309"}
    form = "https://lms.uibk.ac.at/auth/7:1:1109214304:1:1:ofo_:fid/"
    erlaubt = holen.erlaubt
    assert erlaubt("GET", "https://lms.uibk.ac.at/auth/RepositoryEntry/1", None, {})
    assert erlaubt("POST", "https://lms.uibk.ac.at/auth/7:1:1109209465:2:1/", "cid=start&_csrf=x", frei)
    assert not erlaubt("POST", "https://lms.uibk.ac.at/auth/7:1:1109209465:2:1/", "cid=start&_csrf=x", {})  # bewertet: nie starten
    assert not erlaubt("POST", "https://lms.uibk.ac.at/auth/8:1:999:2:1/", "cid=start&_csrf=x", frei)  # fremder Start
    assert erlaubt("POST", form, "_csrf=x&dispatchuri=o_fi1109214309&dispatchevent=2&cid=selectItem&item=a:63:1", frei)
    for gefahr in ("dispatchuri=o_fi1109151020&dispatchevent=2",  # Antwort speichern
                   "dispatchuri=o_fi1109151024&dispatchevent=2",  # Test beenden
                   "dispatchuri=o_fi1109151026&dispatchevent=2",  # Test abbrechen
                   "dispatchuri=o_fi1109151027&dispatchevent=2",  # Test unterbrechen
                   "dispatchuri=o_fi1109214309&cid=nextItem",  # Nächste Frage
                   "dispatchuri=o_fi1109214309&cid=mark&item=a",  # Markierung
                   "dispatchuri=o_fi1109151020&cid=selectItem",  # Speichern-Knopf mit fremdem cid
                   "dispatchuri=o_fi1109214309&cid=selectItem&qtiworks_response_1=47",  # Navigation mit Antwort
                   "_csrf=x&oow=1109141558", ""):  # Autosave, leerer POST
        assert not erlaubt("POST", form, gefahr, frei), gefahr
    mp = lambda uri: (f'--b\r\nContent-Disposition: form-data; name="dispatchuri"\r\n\r\n{uri}\r\n'
                      '--b\r\nContent-Disposition: form-data; name="cid"\r\n\r\nselectItem\r\n--b--')
    assert erlaubt("POST", form, mp("o_fi1109214309"), frei) and not erlaubt("POST", form, mp("o_fi1109151020"), frei)
    print("ok")


if __name__ == "__main__":
    test()
