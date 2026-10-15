// Prüflauf für den Server: startet ihn mit leerer Datenbank und einer OpenRouter-Attrappe und spielt alles einmal durch.
//   node server/test.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 18000 + Math.floor(Math.random() * 1000), BASIS = `http://127.0.0.1:${PORT}`;
const ordner = mkdtempSync(join(tmpdir(), 'lernhelfer-test-'));

// OpenRouter-Attrappe: jede Antwort kostet 0,30 $; Schlüssel anlegen und sperren wird mitgeschrieben
const or = { anfragen: [], schluessel: [] };
const attrappe = createServer((req, res) => {
  let b = ''; req.on('data', t => b += t); req.on('end', () => {
    const j = b ? JSON.parse(b) : {};
    if (req.url === '/chat/completions') {
      or.anfragen.push({ auth: req.headers.authorization, ...j });
      if (j.stream) {
        res.writeHead(200, { 'Content-Type': 'text/event-stream' });
        res.write(': OPENROUTER PROCESSING\n\n');
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: 'Hallo ' } }] })}\n\n`);
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: 'Welt' }, finish_reason: 'stop' }], usage: { cost: 0.3 } })}\n\ndata: [DONE]\n\n`);
        return res.end();
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ choices: [{ message: { content: 'Antwort' } }], usage: { cost: 0.3 } }));
    }
    or.schluessel.push({ method: req.method, url: req.url, ...j });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(req.method === 'POST' ? { key: 'sk-or-v1-test', data: { hash: 'h1' } } : { data: {} }));
  });
}).listen(0);
await new Promise(ok => attrappe.on('listening', ok));

let log = '';
const server = spawn(process.execPath, ['--no-warnings', join(import.meta.dirname, 'server.mjs')], { env: { ...process.env,
  LH_DATEN: ordner, LH_PORT: String(PORT), LH_URL: BASIS, LH_OR_URL: `http://127.0.0.1:${attrappe.address().port}`, LH_OR_KEY: 'sk-or-server',
  LH_OR_VERWALTUNG: 'verwaltung', LH_ADMIN: 'chef@example.com', LH_IBAN: 'AT00 TEST', LH_BREVO: '' } });
server.stdout.on('data', t => log += t); server.stderr.on('data', t => log += t);
const warte = async (bis, was) => { for (let i = 0; i < 100; i++) { const x = await bis(); if (x) return x; await new Promise(ok => setTimeout(ok, 50)); } throw new Error('Zeit um: ' + was + '\n' + log); };
await warte(() => fetch(BASIS + '/api/tarife').then(r => r.ok, () => false), 'Server startet');
const link = (email, art) => warte(() => [...log.matchAll(new RegExp(`\\[Mail an ${email}\\][^[]*?#${art}=([\\w-]+)`, 'g'))].at(-1)?.[1], `Mail ${art} an ${email}`);

function person() {  // eigener Cookie, wie ein Browser
  let keks = '';
  return async (method, pfad, body, kopf = {}) => {
    const r = await fetch(BASIS + pfad, { method, body: body && JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', Origin: BASIS, ...(keks && { Cookie: keks }), ...kopf } });
    const sc = r.headers.get('set-cookie');
    if (sc) keks = /^lh=;/.test(sc) ? '' : sc.split(';')[0];
    const text = await r.text();
    let j = null; try { j = JSON.parse(text); } catch {}
    return { status: r.status, j, text };
  };
}
const gh = pfad => `/api/gh/repos/lernhelfer/konto/contents/${pfad}`;
const b64 = s => Buffer.from(s).toString('base64');

try {
  // Seite: nur die App-Dateien, mit Server-Kennung
  const seite = await fetch(BASIS + '/?ref=ABC').then(r => r.text());
  assert.match(seite, /<html lang="de" data-server>/);
  for (const p of ['/openrouter_key.txt.txt', '/loeser_prompt.txt', '/daten/README.md', '/server/server.mjs', '/.git/config']) assert.equal((await fetch(BASIS + p)).status, 404, p);

  // Konten
  const chef = person(), anna = person(), fremd = person();
  assert.equal((await chef('POST', '/api/registrieren', { email: 'chef@example.com', passwort: 'kurz', agb: true })).status, 400);
  assert.equal((await chef('POST', '/api/registrieren', { email: 'chef@example.com', passwort: 'langes-passwort' })).status, 400, 'ohne AGB');
  const c = await chef('POST', '/api/registrieren', { email: 'Chef@Example.com', passwort: 'langes-passwort', agb: true });
  assert.equal(c.status, 200); assert.equal(c.j.tarif, 'base'); assert.equal(c.j.admin, false, 'erst nach Bestätigung');
  assert.equal((await anna('POST', '/api/registrieren', { email: 'anna@example.com', passwort: 'annas-passwort', agb: true, code: 'FALSCH' })).status, 400);
  const a = await anna('POST', '/api/registrieren', { email: 'anna@example.com', passwort: 'annas-passwort', agb: true, code: c.j.code.toLowerCase() });
  assert.equal(a.j.erstrabatt, true); assert.equal(a.j.testFrei, true);
  assert.equal((await fremd('POST', '/api/registrieren', { email: 'anna@example.com', passwort: 'irgendwas-langes', agb: true })).status, 409);
  assert.equal((await fremd('POST', '/api/anmelden', { email: 'anna@example.com', passwort: 'falsch-falsch' })).status, 401);
  assert.equal((await fremd('GET', '/api/ich')).status, 401);
  for (let i = 0; i < 10; i++) await fremd('POST', '/api/anmelden', { email: 'rate@example.com', passwort: 'falsch-falsch' });
  assert.equal((await fremd('POST', '/api/anmelden', { email: 'rate@example.com', passwort: 'falsch-falsch' })).status, 429, 'Passwort-Raten gebremst');
  assert.equal((await fremd('POST', '/api/anmelden', { email: 'andere@example.com', passwort: 'falsch-falsch' })).status, 401, 'andere Adresse geht weiter');
  assert.equal((await anna('POST', '/api/test', {}, { Origin: 'https://boese.example' })).status, 403, 'fremde Herkunft');

  // Speicher wie GitHub
  let r = await anna('PUT', gh('faecher/BWL.json'), { message: 'x', content: b64('{"dateien":[]}') });
  assert.equal(r.status, 201); const sha = r.j.content.sha;
  assert.equal(sha, createHash('sha1').update('blob 14\0{"dateien":[]}').digest('hex'), 'Git-Prüfsumme wie in holen.py');
  assert.equal((await anna('GET', gh('faecher/BWL.json'), null, { Accept: 'application/vnd.github.raw+json' })).text, '{"dateien":[]}');
  assert.deepEqual((await anna('GET', gh('faecher'))).j.map(d => d.name), ['BWL.json']);
  assert.deepEqual((await anna('GET', gh(''))).j.map(d => [d.name, d.type]), [['faecher', 'dir']]);
  assert.equal((await anna('PUT', gh('faecher/BWL.json'), { content: b64('neu') })).status, 422, 'ohne sha');
  assert.equal((await anna('PUT', gh('faecher/BWL.json'), { content: b64('neu'), sha: 'alt' })).status, 409, 'falsche sha');
  assert.equal((await anna('PUT', gh('faecher/BWL.json'), { content: b64('neu'), sha })).status, 200);
  assert.equal((await chef('GET', gh('faecher/BWL.json'))).status, 404, 'jedes Konto sieht nur seins');
  assert.equal((await anna('PUT', gh('kalender/plan.ics'), { content: b64('BEGIN:VCALENDAR') })).status, 402, 'Kalender ist Pro');
  assert.equal((await anna('PUT', gh('a%2F..%2Fb'), { content: '' })).status, 400);

  // PC-Abgleich mit eigenem Schlüssel: darf nur den Speicher
  const pc = (await anna('POST', '/api/pc')).j;
  assert.equal(pc.api, BASIS + '/api/gh');
  const mitPc = (m, p, body) => fetch(BASIS + p, { method: m, headers: { Authorization: 'Bearer ' + pc.token }, body: body && JSON.stringify(body) });
  assert.equal((await mitPc('GET', gh('abgleich.json'))).status, 404);
  assert.equal((await mitPc('PUT', gh('abgleich.json'), { content: b64('{"ok":true}') })).status, 201);
  assert.equal((await mitPc('GET', '/api/ich')).status, 401);
  assert.equal((await anna('GET', '/api/ich')).j.pc, true);

  // KI: Base darf die Ausgabe, nicht den Chat; Preis wird gebucht und der Server-Schlüssel benutzt
  assert.equal((await anna('POST', '/api/ki', { feature: 'chat', model: 'openai/gpt-6-luna', messages: [] })).status, 402);
  assert.equal((await anna('POST', '/api/ki', { feature: 'ausgabe', model: 'anthropic/teuer', messages: [] })).status, 400);
  r = await anna('POST', '/api/ki', { feature: 'ausgabe', model: 'openai/gpt-6-luna', messages: [{ role: 'user', content: 'x' }], plugins: [{ id: 'web' }] });
  assert.equal(r.j.choices[0].message.content, 'Antwort');
  assert.equal(or.anfragen.at(-1).auth, 'Bearer sk-or-server'); assert.equal(or.anfragen.at(-1).plugins, undefined, 'fremde Felder fliegen raus');
  assert.equal((await anna('GET', '/api/ich')).j.genutzt, 30, '0,30 $ von 1 $');

  // 24 Stunden Ultra: erst nach Bestätigung, dann Chat im Strom, Testbudget 0,50 $
  assert.equal((await anna('POST', '/api/test')).status, 403);
  assert.equal((await anna('POST', '/api/bestaetigen', { token: await link('anna@example.com', 'bestaetigen') })).status, 200);
  r = await anna('POST', '/api/test');
  assert.equal(r.j.tarif, 'ultra'); assert.equal(r.j.test, true); assert.ok(r.j.bis - Date.now() > 23.9 * 3600e3);
  r = await anna('POST', '/api/ki', { feature: 'chat', model: 'openai/gpt-6-luna', stream: true, messages: [] });
  assert.match(r.text, /Hallo /); assert.match(r.text, /\[DONE\]/);
  assert.equal((await anna('GET', '/api/ich')).j.genutzt, 60, 'Test zählt extra: 0,30 von 0,50 $');
  await anna('POST', '/api/ki', { feature: 'chat', model: 'openai/gpt-6-luna', messages: [] });
  assert.equal((await anna('POST', '/api/ki', { feature: 'chat', model: 'openai/gpt-6-luna', messages: [] })).status, 429, 'Testbudget aufgebraucht');
  assert.equal((await anna('POST', '/api/test')).status, 409, 'nur einmal');
  assert.equal((await anna('GET', '/api/geschuetzt/onlinetest')).status, 503, 'ohne Passphrase auf dem Server');

  // Bestellen: Anna wurde geworben → 30 % auf einen Monat Ultra; melden; Chef bestätigt und schaltet frei
  assert.equal((await anna('POST', '/api/bestellen', { tarif: 'ultra', monate: 1 })).status, 400, 'ohne Zustimmung zum Sofortstart');
  r = await anna('POST', '/api/bestellen', { tarif: 'ultra', monate: 1, sofort: true });
  assert.equal(r.j.bestellung.betrag, 990 - 297); assert.match(r.j.bestellung.zweck, /^LH-[A-Z2-9]{6}$/);
  assert.equal((await anna('POST', '/api/gemeldet')).j.bestellung.status, 'gemeldet');
  assert.match(log, /Zahlung gemeldet: LH-/);
  assert.equal((await anna('POST', '/api/bestellen', { tarif: 'pro', monate: 1, sofort: true })).status, 409, 'während der Prüfung');
  assert.equal((await anna('GET', '/api/admin')).status, 403);
  assert.equal((await chef('GET', '/api/admin')).status, 403, 'unbestätigt');
  await chef('POST', '/api/bestaetigen', { token: await link('chef@example.com', 'bestaetigen') });
  const offen = (await chef('GET', '/api/admin')).j.bestellungen.find(x => x.email === 'anna@example.com');
  assert.equal(offen.status, 'gemeldet');
  assert.equal((await chef('POST', '/api/admin/bezahlt', { id: offen.id })).status, 200);
  r = (await anna('GET', '/api/ich')).j;
  assert.equal(r.tarif, 'ultra'); assert.equal(r.test, false); assert.equal(r.bestellung, null); assert.equal(r.erstrabatt, false);
  assert.ok(Math.abs(r.bis - Date.now() - 30 * 864e5) < 60e3);
  assert.match(log, /Freundes-Bonus/);

  // Chef hat jetzt einen Gutschein: 20 % auf einen Monat Pro, bei drei Monaten
  r = (await chef('POST', '/api/bestellen', { tarif: 'pro', monate: 3, sofort: true })).j;
  assert.equal(r.gutscheine, 1); assert.equal(r.bestellung.betrag, 3 * 490 - 98);
  r = (await chef('POST', '/api/bestellen', { tarif: 'ultraplus', monate: 1, sofort: true })).j;  // neue Wahl ersetzt die offene
  assert.equal(r.bestellung.betrag, 1490 - 297, 'Ultra+: Rabatt nur auf den Ultra-Teil');
  await chef('POST', '/api/storno');
  assert.equal((await chef('GET', '/api/ich')).j.bestellung, null);

  // Anna wechselt auf Ultra+: Resttage nach Wert umgerechnet, API-Schlüssel wird angelegt, beim Zurückstufen gesperrt
  await anna('POST', '/api/bestellen', { tarif: 'ultraplus', monate: 1, sofort: true });
  const id2 = (await chef('GET', '/api/admin')).j.bestellungen.find(x => x.email === 'anna@example.com' && x.status === 'offen').id;
  await chef('POST', '/api/admin/bezahlt', { id: id2 });
  r = (await anna('GET', '/api/ich')).j;
  assert.equal(r.tarif, 'ultraplus'); assert.equal(r.api, 'sk-or-v1-test');
  assert.ok(Math.abs(r.bis - Date.now() - (30 * 990 / 1490 + 30) * 864e5) < 120e3, 'Resttage umgerechnet');
  assert.equal(or.schluessel[0].limit, 11); assert.equal(or.schluessel[0].limit_reset, 'monthly');
  const annaId = (await chef('GET', '/api/admin')).j.konten.find(x => x.email === 'anna@example.com').id;
  await chef('POST', '/api/admin/tarif', { konto: annaId, tarif: 'base', tage: 0 });
  assert.deepEqual(or.schluessel.at(-1), { method: 'PATCH', url: '/keys/h1', disabled: true });
  r = (await anna('GET', '/api/ich')).j;
  assert.equal(r.tarif, 'base'); assert.equal(r.api, null);

  // Passwort vergessen → neues Passwort; alte Sitzung ist danach abgemeldet
  await fremd('POST', '/api/passwort-vergessen', { email: 'anna@example.com' });
  const anna2 = person();
  assert.equal((await anna2('POST', '/api/passwort-neu', { token: await link('anna@example.com', 'passwort'), passwort: 'neues-passwort-1' })).status, 200);
  assert.equal((await anna('GET', '/api/ich')).status, 401);
  assert.equal((await anna2('GET', '/api/ich')).j.email, 'anna@example.com');

  // Konto löschen: Daten weg, Bestellungen bleiben für die Buchhaltung, Schlüssel bei OpenRouter gelöscht
  assert.equal((await anna2('POST', '/api/konto-loeschen', { passwort: 'falsch' })).status, 403);
  assert.equal((await anna2('POST', '/api/konto-loeschen', { passwort: 'neues-passwort-1' })).status, 200);
  assert.equal((await anna2('GET', '/api/ich')).status, 401);
  assert.equal((await mitPc('GET', gh('abgleich.json'))).status, 401);
  assert.deepEqual(or.schluessel.at(-1), { method: 'DELETE', url: '/keys/h1' });
  assert.equal((await chef('GET', '/api/admin')).j.bestellungen.filter(x => x.email === 'anna@example.com' && x.status === 'bezahlt').length, 2);
  assert.equal((await anna2('POST', '/api/anmelden', { email: 'anna@example.com', passwort: 'neues-passwort-1' })).status, 401);
  console.log('Server: alles in Ordnung.');
} catch (e) {
  console.error(log);
  throw e;
} finally {
  server.kill(); attrappe.close();
  await new Promise(ok => server.on('exit', ok));
  rmSync(ordner, { recursive: true, force: true });
}
