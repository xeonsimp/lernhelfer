// Lernhelfer-Server: Konten, Tarife, Zahlungen, Freunde-Bonus, Speicher und KI über einen gemeinsamen Schlüssel.
// Der Speicher spricht dieselbe Sprache wie die GitHub-Contents-API, darum bleiben App (gh()) und PC-Abgleich (holen.py) fast gleich.
// Keine Pakete, nur Node 24 (http, sqlite, crypto). Start: node server/server.mjs, Einstellungen über Umgebungsvariablen (README.md).
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const E = process.env;
const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATEN = E.LH_DATEN || join(APP, 'server', 'daten');
const BASIS = (E.LH_URL || 'http://localhost:8080').replace(/\/$/, '');
const HERKUNFT = new URL(BASIS).origin, SICHER = BASIS.startsWith('https:');
const OR = E.LH_OR_URL || 'https://openrouter.ai/api/v1';  // der Prüfstand setzt hier eine Attrappe ein
const ADMIN = (E.LH_ADMIN || '').trim().toLowerCase();
const TAG = 864e5, MONAT = 30 * TAG;
if (SICHER && !E.LH_GEHEIM) throw new Error('LH_GEHEIM fehlt (lange Zufallszeichenkette, verschlüsselt gespeicherte API-Schlüssel).');

// Preise in Cent pro Monat. budget: KI-Kosten in $ pro Monat, die der Server für ein Konto höchstens trägt.
// rabatt: % auf einen Monat für geworbene Freunde und ihre Werber; bei Ultra+ nur auf den Ultra-Teil, das API-Guthaben kostet echtes Geld.
const TARIFE = {
  base: { name: 'Base', preis: 0, rang: 0, budget: 1 },
  pro: { name: 'Pro', preis: 490, rang: 1, budget: 3, rabatt: 20 },
  ultra: { name: 'Ultra', preis: 990, rang: 2, budget: 6, rabatt: 30 },
  ultraplus: { name: 'Ultra+ API', preis: 1490, rang: 2, budget: 6, rabatt: 30, rabattAuf: 990, apiUsd: 11 },
};
const TEST = { stunden: 24, budget: 0.5 };  // einmal 24 Stunden Ultra, höchstens 0,50 $ KI
const MONATE = [1, 3, 6];
// Funktion → Mindestrang; die App schickt bei jeder KI-Anfrage mit, wofür sie ist
const FUNKTIONEN = { ausgabe: 0, kalender: 1, 'wp-transkript': 1, vortrag: 1, chat: 2, loeser: 2, 'wp-text': 2 };
const NAMEN = { ausgabe: 'Die Wochenausgabe', kalender: 'Der Kalender', 'wp-transkript': 'Das Word-Power-Transkript', vortrag: 'Die Vortragsanalyse',
  chat: 'Der KI-Chat', loeser: 'Der Löser', 'wp-text': 'Der Hausaufgaben-Entwurf' };
const PFADE = { 'kalender/': 'kalender', 'vortraege/': 'vortrag' };  // Schreiben in diese Ordner nur mit Tarif
// ponytail: Funktion und Modell prüft der Server, den Prompt nicht; Missbrauch deckelt das Monatsbudget. Strenger: Prompts serverseitig bauen.
const MODELLE = new Set(['openai/gpt-6-luna', 'xiaomi/mimo-v2.6-pro', 'openai/gpt-6.1-sol', 'google/gemini-3.8-flash', 'google/gemini-4-argon']);
const FELDER = ['model', 'messages', 'reasoning', 'provider', 'response_format', 'stream', 'temperature', 'max_tokens'];
const SPEICHER = 200e6;  // Bytes pro Konto

mkdirSync(DATEN, { recursive: true });
const db = new DatabaseSync(join(DATEN, 'lernhelfer.db'));
db.exec(`pragma journal_mode = wal; pragma foreign_keys = on;
create table if not exists konten (id integer primary key, email text unique not null, pw text not null, erstellt integer not null,
  bestaetigt integer not null default 0, tarif text, bis integer not null default 0, test_bis integer not null default 0, erinnert integer not null default 0,
  code text unique not null, geworben_von integer references konten(id) on delete set null, or_key text, or_hash text, or_an integer not null default 0);
create table if not exists marken (hash text primary key, konto integer not null references konten(id) on delete cascade, art text not null, bis integer not null);
create table if not exists dateien (konto integer not null references konten(id) on delete cascade, pfad text not null, inhalt blob not null, sha text not null,
  primary key (konto, pfad));
create table if not exists verbrauch (konto integer not null references konten(id) on delete cascade, monat text not null, usd real not null default 0,
  primary key (konto, monat));
create table if not exists bestellungen (id integer primary key, konto integer references konten(id) on delete set null, email text not null, tarif text not null,
  monate integer not null, betrag integer not null, rabatt integer not null, gutschein integer, zweck text unique not null, status text not null,
  erstellt integer not null, gemeldet integer, bezahlt integer);
create table if not exists gutscheine (id integer primary key, konto integer not null references konten(id) on delete cascade, von integer, erstellt integer not null,
  eingeloest integer);`);

/* ---------- Kleinigkeiten ---------- */
class Fehler extends Error { constructor(code, text) { super(text); this.code = code; } }
const nein = (code, text) => { throw new Fehler(code, text); };
const jetzt = () => Date.now();
const monat = () => new Date().toISOString().slice(0, 7);
const sha256 = s => createHash('sha256').update(s).digest('hex');
const zufall = () => randomBytes(32).toString('base64url');
const ZEICHEN = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';  // ohne 0/O und 1/I/L, damit man Codes abtippen kann
const code = n => Array.from({ length: n }, () => ZEICHEN[randomInt(ZEICHEN.length)]).join('');
const eur = cent => (cent / 100).toLocaleString('de-AT', { style: 'currency', currency: 'EUR' });
const pwHash = pw => { const salz = randomBytes(16); return salz.toString('hex') + ':' + scryptSync(pw, salz, 64).toString('hex'); };
const ATTRAPPE = pwHash(zufall());  // gleiche Rechenzeit, ob es das Konto gibt oder nicht
const pwOk = (pw, gespeichert) => { const [s, h] = gespeichert.split(':'); return timingSafeEqual(scryptSync(pw, Buffer.from(s, 'hex'), 64), Buffer.from(h, 'hex')); };
const blobSha = b => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');  // wie Git, holen.py rechnet lokal dasselbe
const GEHEIM = createHash('sha256').update(E.LH_GEHEIM || 'nur-zum-testen').digest();
const verschluesseln = s => {
  const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', GEHEIM, iv), d = Buffer.concat([c.update(s, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), d].map(x => x.toString('base64')).join('.');
};
const entschluesseln = s => {
  const [iv, tag, d] = s.split('.').map(x => Buffer.from(x, 'base64')), c = createDecipheriv('aes-256-gcm', GEHEIM, iv);
  c.setAuthTag(tag);
  return Buffer.concat([c.update(d), c.final()]).toString('utf8');
};
const json = (res, status, daten) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(daten)); };
function lies(req, max) {
  return new Promise((ok, fehl) => {
    const teile = []; let n = 0;
    req.on('data', t => { n += t.length; if (n > max) { fehl(new Fehler(413, 'Die Anfrage ist zu groß.')); req.destroy(); } else teile.push(t); });
    req.on('end', () => ok(Buffer.concat(teile))); req.on('error', fehl);
  });
}
const liesJson = async (req, max = 1e6) => { try { return JSON.parse((await lies(req, max)).toString() || '{}'); } catch (e) { throw e instanceof Fehler ? e : new Fehler(400, 'Kein gültiges JSON.'); } };
const ip = req => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;  // Caddy setzt den Kopf selbst
const VERSUCHE = new Map();
// Gegen Passwort-Raten und Mail-Fluten: höchstens max Versuche in 15 Minuten, je IP, Route und (wo es passt) Adresse.
// Großzügig, weil im Uni-WLAN viele hinter derselben IP sitzen.
function bremse(req, max, wer = '') {
  const t = jetzt(), schluessel = `${ip(req)}|${req.url}|${wer}`, l = (VERSUCHE.get(schluessel) || []).filter(x => t - x < 15 * 60e3);
  if (l.length >= max) nein(429, 'Zu viele Versuche. Bitte in 15 Minuten nochmal.');
  l.push(t); VERSUCHE.set(schluessel, l);
}

async function mail(an, betreff, text) {  // über Brevo (EU); ohne Schlüssel landet die Mail im Log, zum Testen
  if (!E.LH_BREVO) return console.log(`[Mail an ${an}] ${betreff}\n${text}\n`);
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': E.LH_BREVO, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: { email: E.LH_ABSENDER, name: 'Lernhelfer' }, to: [{ email: an }], subject: betreff, textContent: text }) });
    if (!r.ok) console.error('Mail ging nicht raus:', r.status, await r.text());
  } catch (e) { console.error('Mail ging nicht raus:', e.message); }
}
const gruss = '\n\nViele Grüße\nLernhelfer';

/* ---------- Konten ---------- */
const kontoMit = id => db.prepare('select * from konten where id = ?').get(id);
const sitzung = req => /(?:^|;\s*)lh=([\w-]+)/.exec(req.headers.cookie || '')?.[1];
function konto(req) {
  const c = sitzung(req), b = /^Bearer ([\w-]+)$/.exec(req.headers.authorization || '')?.[1];
  if (!c && !b) return null;
  const m = db.prepare('select konto from marken where hash = ? and art = ? and bis > ?').get(sha256(c || b), c ? 'sitzung' : 'sync', jetzt());
  const k = m && kontoMit(m.konto);
  return k && Object.assign(k, { nurPc: !c });  // der PC-Schlüssel darf nur den Speicher
}
function muss(k, pc = false) {
  if (!k) nein(401, 'Bitte anmelden.');
  if (k.nurPc && !pc) nein(401, 'Der PC-Schlüssel gilt nur für den Abgleich.');
  return k;
}
const istAdmin = k => !!ADMIN && k.email === ADMIN && !!k.bestaetigt;
function marke(konto, art, dauer) {
  const t = zufall();
  db.prepare('insert into marken values (?, ?, ?, ?)').run(sha256(t), konto, art, jetzt() + dauer);
  return t;
}
function einloesen(t, art) {
  const h = sha256(String(t || '')), m = db.prepare('select konto from marken where hash = ? and art = ? and bis > ?').get(h, art, jetzt());
  if (!m) nein(400, 'Der Link ist abgelaufen oder wurde schon benutzt.');
  db.prepare('delete from marken where hash = ?').run(h);
  return m.konto;
}
function anmelden(res, id) {
  res.setHeader('Set-Cookie', `lh=${marke(id, 'sitzung', 60 * TAG)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 86400}${SICHER ? '; Secure' : ''}`);
}
const abmelden = res => res.setHeader('Set-Cookie', `lh=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${SICHER ? '; Secure' : ''}`);
const bestaetigungSenden = (id, email) => mail(email, 'Lernhelfer: E-Mail bestätigen',
  `Hallo,\n\nbitte bestätige deine E-Mail-Adresse für den Lernhelfer:\n${BASIS}/#bestaetigen=${marke(id, 'bestaetigen', 3 * TAG)}\n\nDer Link gilt drei Tage. Hast du dich nicht angemeldet, ignoriere diese Mail einfach.` + gruss);
const passwortPruefen = pw => { if (pw.length < 10 || pw.length > 200) nein(400, 'Das Passwort braucht mindestens 10 Zeichen.'); return pw; };

// Was gilt gerade: bezahlter Tarif, sonst der 24-Stunden-Test (zählt als Ultra), sonst Base
function stufe(k) {
  if (k.tarif && k.bis > jetzt()) return { tarif: k.tarif, bis: k.bis, test: false };
  if (k.test_bis > jetzt()) return { tarif: 'ultra', bis: k.test_bis, test: true };
  return { tarif: 'base', bis: null, test: false };
}
function darf(k, f) {
  const s = stufe(k), rang = FUNKTIONEN[f];
  if (TARIFE[s.tarif].rang < rang) nein(402, `${NAMEN[f]} gehört zu ${rang === 1 ? 'Pro' : 'Ultra'}.`);
  return s;
}
const verbraucht = (id, test) => db.prepare('select usd from verbrauch where konto = ? and monat = ?').get(id, test ? 'test' : monat())?.usd || 0;
const buchenSql = db.prepare('insert into verbrauch (konto, monat, usd) values (?, ?, ?) on conflict (konto, monat) do update set usd = usd + excluded.usd');
const buchen = (id, usd, test) => { if (!(usd > 0)) return; buchenSql.run(id, monat(), usd); if (test) buchenSql.run(id, 'test', usd); };
const bezahlt = id => !!db.prepare("select 1 from bestellungen where konto = ? and status = 'bezahlt'").get(id);

function ich(k) {
  k = kontoMit(k.id);
  const s = stufe(k), budget = s.test ? TEST.budget : TARIFE[s.tarif].budget;
  return {
    email: k.email, bestaetigt: !!k.bestaetigt, admin: istAdmin(k),
    tarif: s.tarif, bis: s.bis, test: s.test, testFrei: !k.test_bis && !bezahlt(k.id) && s.tarif === 'base',
    genutzt: Math.min(100, Math.round(100 * verbraucht(k.id, s.test) / budget)),
    code: k.code, freunde: db.prepare('select count(*) n from konten where geworben_von = ?').get(k.id).n,
    gutscheine: db.prepare('select count(*) n from gutscheine where konto = ? and eingeloest is null').get(k.id).n,
    erstrabatt: !!k.geworben_von && !bezahlt(k.id),
    bestellung: db.prepare("select id, tarif, monate, betrag, rabatt, zweck, status from bestellungen where konto = ? and status in ('offen', 'gemeldet') order by id desc").get(k.id) || null,
    api: s.tarif === 'ultraplus' && k.or_key && k.or_an ? entschluesseln(k.or_key) : null,
    pc: !!db.prepare("select 1 from marken where konto = ? and art = 'sync'").get(k.id),
  };
}

/* ---------- Zahlungen und Freunde-Bonus ---------- */
// Geworbene bekommen den Rabatt auf ihre erste Zahlung; Werbende einen Gutschein, sobald die geworbene Person zum ersten Mal zahlt.
// Ein Rabatt pro Bestellung, auf einen Monat; weitere Gutscheine bleiben für die nächste.
function rabattFuer(k, T) {
  const betrag = Math.round((T.rabattAuf ?? T.preis) * T.rabatt / 100);
  if (k.geworben_von && !bezahlt(k.id)) return { rabatt: betrag, gutschein: null };
  const g = db.prepare('select id from gutscheine where konto = ? and eingeloest is null order by id').get(k.id);
  return g ? { rabatt: betrag, gutschein: g.id } : { rabatt: 0, gutschein: null };
}
async function orSchluessel(pfad, method, body) {
  const r = await fetch(`${OR}/keys${pfad}`, { method, headers: { Authorization: 'Bearer ' + E.LH_OR_VERWALTUNG, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  if (!r.ok) throw new Error(`OpenRouter-Schlüssel ${method} ${r.status}: ${await r.text()}`);
  return r.json();
}
async function apiAbgleich(k) {  // Ultra+: eigener OpenRouter-Schlüssel mit Monatslimit, an solange der Tarif läuft
  k = kontoMit(k.id);
  const soll = k.tarif === 'ultraplus' && k.bis > jetzt();
  if (!E.LH_OR_VERWALTUNG) return;
  if (soll && !k.or_hash) {
    const j = await orSchluessel('', 'POST', { name: `Lernhelfer Konto ${k.id}`, limit: TARIFE.ultraplus.apiUsd, limit_reset: 'monthly' });
    db.prepare('update konten set or_key = ?, or_hash = ?, or_an = 1 where id = ?').run(verschluesseln(j.key), j.data.hash, k.id);
  } else if (k.or_hash && soll !== !!k.or_an) {
    await orSchluessel('/' + k.or_hash, 'PATCH', { disabled: !soll });
    db.prepare('update konten set or_an = ? where id = ?').run(soll ? 1 : 0, k.id);
  }
}
async function freischalten(id) {
  const b = db.prepare("select * from bestellungen where id = ? and status in ('offen', 'gemeldet')").get(id);
  if (!b) nein(404, 'Diese Bestellung ist nicht mehr offen.');
  const k = b.konto && kontoMit(b.konto);
  if (!k) nein(404, 'Das Konto gibt es nicht mehr.');
  const t = jetzt(), T = TARIFE[b.tarif], erste = !bezahlt(k.id);
  // Läuft noch ein anderer Tarif, werden seine Resttage nach Wert umgerechnet (Pro → Ultra: weniger Tage, Ultra → Pro: mehr)
  const ab = k.tarif && k.bis > t ? (k.tarif === b.tarif ? k.bis : t + (k.bis - t) * TARIFE[k.tarif].preis / T.preis) : t;
  db.prepare('update konten set tarif = ?, bis = ?, test_bis = min(test_bis, ?) where id = ?').run(b.tarif, Math.round(ab + b.monate * MONAT), t, k.id);  // ein laufender Test endet
  db.prepare("update bestellungen set status = 'bezahlt', bezahlt = ? where id = ?").run(t, id);
  if (b.gutschein) db.prepare('update gutscheine set eingeloest = ? where id = ?').run(t, b.gutschein);
  if (erste && k.geworben_von) {
    db.prepare('insert into gutscheine (konto, von, erstellt) values (?, ?, ?)').run(k.geworben_von, k.id, t);
    const w = kontoMit(k.geworben_von);
    await mail(w.email, 'Lernhelfer: Dein Freundes-Bonus ist da', `Hallo,\n\njemand, den du eingeladen hast, ist jetzt mit einem Tarif dabei. Danke!\n\nDeine nächste Zahlung ist dafür einen Monat lang günstiger: 20 % bei Pro, 30 % bei Ultra. Der Rabatt wird beim nächsten Bestellen automatisch abgezogen.\n${BASIS}/#/upgrade` + gruss);
  }
  let warnung = null;
  try { await apiAbgleich(k); } catch (e) { warnung = e.message; console.error(e.message); }  // der stündliche Abgleich versucht es wieder
  const neu = kontoMit(k.id);
  await mail(k.email, `Lernhelfer: ${T.name} ist freigeschaltet`, `Hallo,\n\ndanke für deine Zahlung! ${T.name} ist ab sofort freigeschaltet, bis ${new Date(neu.bis).toLocaleDateString('de-AT')}. Es verlängert sich nichts automatisch; ein paar Tage vor Ablauf erinnern wir dich.\n${BASIS}` + gruss);
  return { ok: true, warnung };
}

/* ---------- Speicher: wie die GitHub-Contents-API (GET Datei/Ordner, PUT mit sha, DELETE mit sha) ---------- */
async function speicher(req, res, k, pfad) {
  pfad = decodeURIComponent(pfad).replace(/^\/+|\/+$/g, '');
  if (pfad.length > 300 || /(^|\/)\.\.?(\/|$)|[\0\\]/.test(pfad)) nein(400, 'Ungültiger Pfad.');
  const datei = pfad && db.prepare('select inhalt, sha from dateien where konto = ? and pfad = ?').get(k.id, pfad);
  const name = pfad.split('/').pop();
  if (req.method === 'GET') {
    if (datei) {
      if (/raw/.test(req.headers.accept || '')) { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(Buffer.from(datei.inhalt)); }
      return json(res, 200, { type: 'file', name, path: pfad, sha: datei.sha, size: datei.inhalt.length, encoding: 'base64', content: Buffer.from(datei.inhalt).toString('base64') });
    }
    const vor = pfad ? pfad + '/' : '', kinder = new Map();
    for (const d of db.prepare('select pfad, sha, length(inhalt) size from dateien where konto = ? and substr(pfad, 1, ?) = ?').all(k.id, vor.length, vor)) {
      const [n, ...tiefer] = d.pfad.slice(vor.length).split('/');
      if (!kinder.has(n)) kinder.set(n, tiefer.length ? { type: 'dir', name: n, path: vor + n, sha: '' } : { type: 'file', name: n, path: d.pfad, sha: d.sha, size: d.size });
    }
    if (!kinder.size) nein(404, 'Not Found');
    return json(res, 200, [...kinder.values()]);
  }
  if (!['PUT', 'DELETE'].includes(req.method) || !pfad) nein(405, 'Geht so nicht.');
  const b = await liesJson(req, 40e6);
  if ((b.sha || null) !== (datei?.sha || null)) nein(datei && !b.sha ? 422 : 409, 'Die Datei hat sich inzwischen geändert.');
  if (req.method === 'DELETE') {
    if (!datei) nein(404, 'Not Found');
    db.prepare('delete from dateien where konto = ? and pfad = ?').run(k.id, pfad);
    return json(res, 200, { content: null });
  }
  const f = Object.entries(PFADE).find(([p]) => pfad.startsWith(p))?.[1];
  if (f) darf(k, f);
  const inhalt = Buffer.from(String(b.content || ''), 'base64');
  const belegt = db.prepare('select coalesce(sum(length(inhalt)), 0) n from dateien where konto = ?').get(k.id).n - (datei ? datei.inhalt.length : 0);
  if (belegt + inhalt.length > SPEICHER) nein(413, 'Dein Speicher ist voll. Alte Vorträge löschen hilft.');
  const sha = blobSha(inhalt);
  db.prepare('insert into dateien (konto, pfad, inhalt, sha) values (?, ?, ?, ?) on conflict (konto, pfad) do update set inhalt = excluded.inhalt, sha = excluded.sha').run(k.id, pfad, inhalt, sha);
  json(res, datei ? 200 : 201, { content: { type: 'file', name, path: pfad, sha } });
}

/* ---------- KI: OpenRouter mit dem Server-Schlüssel, Kosten pro Konto gebucht ---------- */
async function ki(req, res, k) {
  const b = await liesJson(req, 40e6);  // Vortrag: bis 9 MB Ton pro Teil, als base64
  if (!(b.feature in FUNKTIONEN)) nein(400, 'Unbekannte Funktion.');
  const s = darf(k, b.feature);
  if (!MODELLE.has(b.model)) nein(400, 'Dieses Modell gibt es hier nicht.');
  if (!E.LH_OR_KEY) nein(503, 'Die KI ist auf dem Server noch nicht eingerichtet.');
  if (verbraucht(k.id, s.test) >= (s.test ? TEST.budget : TARIFE[s.tarif].budget))
    nein(429, s.test ? 'Das KI-Guthaben des Tests ist aufgebraucht. Mit einem Tarif geht es sofort weiter.'
      : `Dein KI-Kontingent für diesen Monat ist aufgebraucht. Am 1. geht es weiter${s.tarif === 'ultra' || s.tarif === 'ultraplus' ? '' : ', mit einem größeren Tarif sofort'}.`);
  const halt = new AbortController();
  res.on('close', () => halt.abort());  // Gerät bricht ab → auch OpenRouter abbrechen
  const up = await fetch(`${OR}/chat/completions`, { method: 'POST', signal: halt.signal,
    headers: { Authorization: 'Bearer ' + E.LH_OR_KEY, 'Content-Type': 'application/json', 'X-Title': 'Lernhelfer', 'HTTP-Referer': BASIS },
    body: JSON.stringify({ ...Object.fromEntries(FELDER.filter(x => x in b).map(x => [x, b[x]])), usage: { include: true }, user: 'konto-' + k.id }),
  }).catch(() => nein(502, 'OpenRouter ist gerade nicht erreichbar. Bitte gleich nochmal.'));
  res.writeHead(up.status, { 'Content-Type': up.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
  // Durchreichen und dabei den Preis lesen: im Strom steht er im letzten Stück, sonst in der Antwort
  const dec = new TextDecoder(); let rest = '', usd = 0;
  const zeile = z => { if (z.startsWith('data: {') && z.includes('"cost"')) try { usd = JSON.parse(z.slice(6)).usage?.cost ?? usd; } catch {} };
  try {
    for await (const teil of up.body) {
      res.write(teil);
      rest += dec.decode(teil, { stream: true });
      if (b.stream) { const zeilen = rest.split('\n'); rest = zeilen.pop(); zeilen.forEach(zeile); }
    }
  } catch {}  // ponytail: bricht das Gerät mitten im Strom ab, fehlt der Preis dieser Anfrage; genauer ginge es über /generation?id=
  if (b.stream) zeile(rest); else try { usd = JSON.parse(rest).usage?.cost || 0; } catch {}
  buchen(k.id, usd, s.test);
  res.end();
}

// Word Power und Löser: Prompts liegen verschlüsselt im App-Repo; der Server kennt die Passphrasen und gibt sie nur mit Tarif heraus
const PROMPTS = {};
async function prompts(bereich) {
  if (PROMPTS[bereich]) return PROMPTS[bereich];
  const pass = E['LH_PASS_' + bereich.toUpperCase()];
  if (!pass) nein(503, 'Dieser Bereich ist auf dem Server noch nicht eingerichtet.');
  const j = JSON.parse(readFileSync(join(APP, 'geschuetzt', bereich + '.json'), 'utf8')), b = s => Buffer.from(s, 'base64');
  const basis = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass.toLowerCase().replace(/[^a-zäöüß0-9]/g, '')), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b(j.salt), iterations: j.iter, hash: 'SHA-256' }, basis, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  return PROMPTS[bereich] = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b(j.iv) }, key, b(j.daten))));
}

/* ---------- Routen ---------- */
const ROUTEN = {
  'GET /api/tarife': () => ({ tarife: TARIFE, test: TEST, monate: MONATE, funktionen: FUNKTIONEN,
    zahlung: { empfaenger: E.LH_EMPFAENGER || '', iban: E.LH_IBAN || '', bic: E.LH_BIC || '', paypal: E.LH_PAYPAL || '' } }),
  'GET /api/recht': () => ({ text: existsSync(join(DATEN, 'recht.md')) ? readFileSync(join(DATEN, 'recht.md'), 'utf8') : '' }),
  'GET /api/ich': ({ k }) => ich(muss(k)),

  'POST /api/registrieren': async ({ req, res, b }) => {
    bremse(req, 60);
    const email = String(b.email || '').trim().toLowerCase(), pw = passwortPruefen(String(b.passwort || ''));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) nein(400, 'Bitte eine gültige E-Mail-Adresse eingeben.');
    if (!b.agb) nein(400, 'Bitte bestätige, dass du AGB und Datenschutzerklärung gelesen hast.');
    if (db.prepare('select 1 from konten where email = ?').get(email)) nein(409, 'Mit dieser E-Mail gibt es schon ein Konto. Anmelden oder „Passwort vergessen“?');
    const werber = b.code ? db.prepare('select id from konten where code = ?').get(String(b.code).trim().toUpperCase()) : null;
    if (b.code && !werber) nein(400, 'Diesen Freundescode gibt es nicht. Leer lassen geht auch.');
    let neu; do neu = code(6); while (db.prepare('select 1 from konten where code = ?').get(neu));
    const { lastInsertRowid: id } = db.prepare('insert into konten (email, pw, erstellt, code, geworben_von) values (?, ?, ?, ?, ?)').run(email, pwHash(pw), jetzt(), neu, werber?.id ?? null);
    anmelden(res, id);
    await bestaetigungSenden(id, email);
    return ich({ id });
  },
  'POST /api/anmelden': ({ req, res, b }) => {
    const email = String(b.email || '').trim().toLowerCase();
    bremse(req, 10, email);
    const k = db.prepare('select * from konten where email = ?').get(email);
    if (!pwOk(String(b.passwort || ''), k?.pw || ATTRAPPE) || !k) nein(401, 'E-Mail oder Passwort stimmt nicht.');
    anmelden(res, k.id);
    return ich(k);
  },
  'POST /api/abmelden': ({ req, res }) => { db.prepare('delete from marken where hash = ?').run(sha256(sitzung(req) || '')); abmelden(res); },
  'POST /api/bestaetigen': ({ req, b }) => { bremse(req, 60); db.prepare('update konten set bestaetigt = 1 where id = ?').run(einloesen(b.token, 'bestaetigen')); },
  'POST /api/bestaetigung-senden': async ({ req, k }) => { muss(k); bremse(req, 3, k.email); if (!k.bestaetigt) await bestaetigungSenden(k.id, k.email); },
  'POST /api/passwort-vergessen': async ({ req, b }) => {
    const email = String(b.email || '').trim().toLowerCase();
    bremse(req, 3, email);
    const k = db.prepare('select * from konten where email = ?').get(email);
    if (k) await mail(k.email, 'Lernhelfer: Neues Passwort', `Hallo,\n\nhier kannst du ein neues Passwort setzen:\n${BASIS}/#passwort=${marke(k.id, 'passwort', 3600e3)}\n\nDer Link gilt eine Stunde. Hast du nichts angefordert, ignoriere diese Mail.` + gruss);
  },  // antwortet immer gleich, damit niemand ausprobieren kann, welche Adressen ein Konto haben
  'POST /api/passwort-neu': ({ req, res, b }) => {
    bremse(req, 60);
    const pw = passwortPruefen(String(b.passwort || '')), id = einloesen(b.token, 'passwort');
    db.prepare('update konten set pw = ?, bestaetigt = 1 where id = ?').run(pwHash(pw), id);  // der Link kam per Mail: Adresse damit bestätigt
    db.prepare("delete from marken where konto = ? and art = 'sitzung'").run(id);  // überall abmelden
    anmelden(res, id);
    return ich({ id });
  },
  'POST /api/test': ({ k }) => {
    muss(k);
    if (!k.bestaetigt) nein(403, 'Bitte bestätige zuerst deine E-Mail-Adresse. Der Link steht in der Mail, die wir dir geschickt haben.');
    if (k.test_bis || bezahlt(k.id)) nein(409, 'Den Ultra-Test gibt es einmal pro Konto, und du hast ihn schon genutzt.');
    if (stufe(k).tarif !== 'base') nein(409, 'Du hast schon einen Tarif.');
    db.prepare('update konten set test_bis = ? where id = ?').run(jetzt() + TEST.stunden * 3600e3, k.id);
    return ich(k);
  },
  'POST /api/bestellen': ({ k, b }) => {
    muss(k);
    const T = TARIFE[b.tarif], monate = Number(b.monate);
    if (!T?.preis || !MONATE.includes(monate)) nein(400, 'Tarif oder Laufzeit fehlt.');
    if (!b.sofort) nein(400, 'Bitte bestätige, dass der Tarif gleich nach der Zahlung starten soll.');
    if (db.prepare("select 1 from bestellungen where konto = ? and status = 'gemeldet'").get(k.id)) nein(409, 'Deine letzte Zahlung wird gerade geprüft. Danach kannst du wieder bestellen.');
    db.prepare("update bestellungen set status = 'ersetzt' where konto = ? and status = 'offen'").run(k.id);
    const { rabatt, gutschein } = rabattFuer(k, T);
    let zweck; do zweck = 'LH-' + code(6); while (db.prepare('select 1 from bestellungen where zweck = ?').get(zweck));
    db.prepare("insert into bestellungen (konto, email, tarif, monate, betrag, rabatt, gutschein, zweck, status, erstellt) values (?, ?, ?, ?, ?, ?, ?, ?, 'offen', ?)")
      .run(k.id, k.email, b.tarif, monate, T.preis * monate - rabatt, rabatt, gutschein, zweck, jetzt());
    return ich(k);
  },
  'POST /api/storno': ({ k }) => { muss(k); db.prepare("update bestellungen set status = 'storniert' where konto = ? and status = 'offen'").run(k.id); return ich(k); },
  'POST /api/gemeldet': async ({ k }) => {
    muss(k);
    const b = db.prepare("select * from bestellungen where konto = ? and status = 'offen' order by id desc").get(k.id);
    if (!b) nein(404, 'Keine offene Bestellung.');
    db.prepare("update bestellungen set status = 'gemeldet', gemeldet = ? where id = ?").run(jetzt(), b.id);
    if (ADMIN) await mail(ADMIN, `Zahlung gemeldet: ${b.zweck} · ${eur(b.betrag)}`, `${k.email} meldet ${eur(b.betrag)} für ${TARIFE[b.tarif].name}, ${b.monate} Monat(e).\nVerwendungszweck: ${b.zweck}\n\nNach Zahlungseingang freischalten: ${BASIS}/#/admin`);
    return ich(k);
  },
  'POST /api/pc': ({ k }) => {  // Schlüssel für den OLAT-Abgleich am PC; ein neuer ersetzt den alten
    muss(k);
    db.prepare("delete from marken where konto = ? and art = 'sync'").run(k.id);
    return { token: marke(k.id, 'sync', 3650 * TAG), api: BASIS + '/api/gh', repo: 'lernhelfer/konto' };
  },
  'POST /api/konto-loeschen': async ({ k, b, res }) => {
    muss(k);
    if (!pwOk(String(b.passwort || ''), k.pw)) nein(403, 'Das Passwort stimmt nicht.');
    if (k.or_hash && E.LH_OR_VERWALTUNG) await orSchluessel('/' + k.or_hash, 'DELETE').catch(e => console.error(e.message));
    db.prepare('delete from konten where id = ?').run(k.id);  // Speicher, Sitzungen, Verbrauch gehen mit; Bestellungen bleiben für die Buchhaltung
    abmelden(res);
  },
  'GET /api/geschuetzt/wordpower': async ({ k }) => {
    const s = darf(muss(k), 'wp-transkript'), p = await prompts('wordpower');
    return TARIFE[s.tarif].rang >= FUNKTIONEN['wp-text'] ? p : { transcribe: p.transcribe };
  },
  'GET /api/geschuetzt/onlinetest': async ({ k }) => { darf(muss(k), 'loeser'); return prompts('onlinetest'); },

  'GET /api/admin': ({ k }) => {
    admin(k);
    const m = monat();
    return {
      bestellungen: db.prepare("select id, email, tarif, monate, betrag, rabatt, zweck, status, erstellt, gemeldet, bezahlt from bestellungen where status in ('offen', 'gemeldet') or bezahlt > ? order by id desc").all(jetzt() - 60 * TAG),
      konten: db.prepare(`select k.id, k.email, k.erstellt, k.bestaetigt, k.tarif, k.bis, k.test_bis, coalesce(v.usd, 0) usd, w.email werber
        from konten k left join verbrauch v on v.konto = k.id and v.monat = ? left join konten w on w.id = k.geworben_von order by k.id desc limit 500`).all(m),
      monat: { einnahmen: db.prepare("select coalesce(sum(betrag), 0) n from bestellungen where status = 'bezahlt' and bezahlt >= ?").get(Date.parse(m + '-01T00:00:00Z')).n,
        kiUsd: db.prepare('select coalesce(sum(usd), 0) n from verbrauch where monat = ?').get(m).n },
    };
  },
  'POST /api/admin/bezahlt': ({ k, b }) => { admin(k); return freischalten(Number(b.id)); },
  'POST /api/admin/storno': ({ k, b }) => { admin(k); db.prepare("update bestellungen set status = 'storniert' where id = ? and status in ('offen', 'gemeldet')").run(Number(b.id)); },
  'POST /api/admin/tarif': async ({ k, b }) => {  // von Hand: Tarif für n Tage setzen (0 Tage = zurück auf Base), etwa als Geschenk oder Erstattung
    admin(k);
    const z = kontoMit(Number(b.konto)), tage = Number(b.tage);
    if (!z || !TARIFE[b.tarif] || !(tage >= 0)) nein(400, 'Konto, Tarif oder Tage fehlen.');
    db.prepare('update konten set tarif = ?, bis = ? where id = ?').run(b.tarif === 'base' ? null : b.tarif, b.tarif === 'base' ? 0 : jetzt() + tage * TAG, z.id);
    await apiAbgleich(z).catch(e => console.error(e.message));
  },
};
const admin = k => { if (!istAdmin(muss(k))) nein(403, 'Nur für die Verwaltung.'); };

/* ---------- Dateien der App (nur diese, nie den Rest des Ordners) ---------- */
const DATEIEN = {
  '/': ['index.html', 'text/html; charset=utf-8'], '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/holen.py': ['holen.py', 'text/plain; charset=utf-8'], '/einrichten.ps1': ['einrichten.ps1', 'text/plain; charset=utf-8'],
  '/fonts/Archivo.woff2': ['fonts/Archivo.woff2', 'font/woff2'], '/fonts/SourceSerif4.woff2': ['fonts/SourceSerif4.woff2', 'font/woff2'],
};
function statisch(req, res, pfad) {
  const d = DATEIEN[pfad];
  if (!d || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Nicht gefunden'); }
  let inhalt = readFileSync(join(APP, d[0]));
  if (d[0] === 'index.html') inhalt = inhalt.toString('utf8').replace('<html lang="de">', '<html lang="de" data-server>');  // App weiß: Konten statt eigener Schlüssel
  res.writeHead(200, { 'Content-Type': d[1], 'Cache-Control': d[0].startsWith('fonts/') ? 'public, max-age=604800' : 'no-cache' });
  res.end(req.method === 'HEAD' ? undefined : inhalt);
}

/* ---------- Stündlich: Abgelaufenes aufräumen, Ultra+-Schlüssel abgleichen, an das Ende des Tarifs erinnern ---------- */
async function aufraeumen() {
  const t = jetzt();
  db.prepare('delete from marken where bis < ?').run(t);
  db.prepare("update bestellungen set status = 'verfallen' where status = 'offen' and erstellt < ?").run(t - 14 * TAG);
  for (const k of db.prepare('select id from konten where or_hash is not null or (tarif = ? and bis > ?)').all('ultraplus', t)) await apiAbgleich(k).catch(e => console.error(e.message));
  for (const k of db.prepare('select * from konten where tarif is not null and bis > ? and bis < ? and erinnert != bis').all(t, t + 3 * TAG)) {
    db.prepare('update konten set erinnert = bis where id = ?').run(k.id);
    await mail(k.email, `Lernhelfer: ${TARIFE[k.tarif].name} endet bald`, `Hallo,\n\ndein Tarif ${TARIFE[k.tarif].name} läuft am ${new Date(k.bis).toLocaleDateString('de-AT')} ab. Danach geht es mit Base weiter, deine Daten bleiben. Verlängern kannst du hier:\n${BASIS}/#/upgrade` + gruss);
  }
  for (const [a, l] of VERSUCHE) if (!l.some(x => t - x < 15 * 60e3)) VERSUCHE.delete(a);
}
setInterval(() => aufraeumen().catch(e => console.error(e)), 3600e3);

createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  if (SICHER) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  try {
    const url = new URL(req.url, BASIS);
    if (!url.pathname.startsWith('/api/')) return statisch(req, res, url.pathname);
    if (req.method !== 'GET' && req.headers.origin && req.headers.origin !== HERKUNFT) nein(403, 'Anfrage von fremder Seite.');
    const k = konto(req);
    const gh = url.pathname.match(/^\/api\/gh\/repos\/[^/]+\/[^/]+\/contents(?:\/(.*))?$/);
    if (gh) return await speicher(req, res, muss(k, true), gh[1] || '');
    if (url.pathname === '/api/ki' && req.method === 'POST') return await ki(req, res, muss(k));
    const route = ROUTEN[`${req.method} ${url.pathname}`];
    if (!route) nein(404, 'Gibt es nicht.');
    const b = req.method === 'POST' ? await liesJson(req) : {};
    json(res, 200, (await route({ req, res, k, b })) ?? { ok: true });
  } catch (e) {
    if (!(e instanceof Fehler)) console.error(e);
    if (res.headersSent) return res.end();
    json(res, e instanceof Fehler ? e.code : 500, { error: { message: e instanceof Fehler ? e.message : 'Da ist auf dem Server etwas schiefgegangen.' } });
  }
}).listen(Number(E.LH_PORT || 8080), E.LH_HOST || '127.0.0.1', () => console.log(`Lernhelfer-Server läuft auf ${E.LH_HOST || '127.0.0.1'}:${E.LH_PORT || 8080} für ${BASIS}`));
