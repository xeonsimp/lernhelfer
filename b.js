// Kolumnentitel und Datumszeile: Kalenderwoche (ISO 8601), ihre Tage und das Semester.
const heute = new Date();
const j = heute.getFullYear();
const m = heute.getMonth();
const semester = m >= 9 ? `Wintersemester ${j}/${String(j + 1).slice(2)}` : m <= 1 ? `Wintersemester ${j - 1}/${String(j).slice(2)}` : `Sommersemester ${j}`;

const d = new Date(Date.UTC(j, m, heute.getDate()));
d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
const kw = Math.ceil(((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
const mo = new Date(d);
mo.setUTCDate(d.getUTCDate() - 3);
const so = new Date(d);
so.setUTCDate(d.getUTCDate() + 3);
const tage = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).formatRange(mo, so);

document.querySelector(".kw").textContent = kw;
document.querySelector(".datum").textContent = `${semester} · ${tage}`;
