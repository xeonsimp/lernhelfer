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
        for n in ("VO/vo10.pdf", "VO/vo2.txt", "Syl/a.html"):
            (t / "m/F" / n).parent.mkdir(parents=True, exist_ok=True)
            (t / "m/F" / n).write_bytes(b"x")
        d = holen.fach_json("F")["dateien"]
        assert [x["datei"] for x in d] == ["VO/vo2.txt", "VO/vo10.pdf", "Syl/a.html"]
        assert d[1]["text"].startswith("(Text nicht lesbar")  # kaputtes PDF bricht nicht ab
    print("ok")


if __name__ == "__main__":
    test()
