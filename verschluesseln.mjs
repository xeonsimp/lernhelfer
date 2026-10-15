// Verschlüsselt die Prompts der privaten Bereiche (Word Power, voller Löser) mit einem Passwort und legt sie ins private Daten-Repo
// (daten/geschuetzt/<bereich>.json). Lesen kann die Datei nur, wer den GitHub-Schlüssel des Daten-Repos hat; die App entschlüsselt sie
// erst nach Eingabe des Passworts. Groß/klein, Leer- und Satzzeichen zählen nicht (wie in der App und auf dem Server).
//   node verschluesseln.mjs wordpower "<Passwort>"    Prompts aus Z:\opus\index.html (wird nur gelesen)
//   node verschluesseln.mjs onlinetest "<Passwort>"   Löser-Prompt aus loeser_prompt.txt (nicht im öffentlichen Repo)
// Danach in daten/ committen und pushen; für den Server die Datei nach /var/lib/lernhelfer/geschuetzt/ kopieren.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const [bereich, ...worte] = process.argv.slice(2);
const passwort = worte.join('').toLowerCase().replace(/[^a-zäöüß0-9]/g, '');
const quellen = {
  wordpower: () => {
    const html = readFileSync('Z:/opus/index.html', 'utf8');
    const prompt = name => html.match(new RegExp(`const ${name} = \`([\\s\\S]*?)\`;`))[1];
    return { transcribe: prompt('TRANSCRIBE_PROMPT'), homework: prompt('HOMEWORK_PROMPT') };
  },
  onlinetest: () => ({ system: readFileSync(new URL('loeser_prompt.txt', import.meta.url), 'utf8') }),
};
if (!quellen[bereich] || passwort.length < 6) throw new Error('Aufruf: node verschluesseln.mjs wordpower|onlinetest "<Passwort, mind. 6 Zeichen>"');
const klartext = JSON.stringify(quellen[bereich]());

const iter = 1_000_000;  // PBKDF2 bremst jeden Rateversuch auf rund 1/10 000 s pro Grafikkarte
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const basis = await crypto.subtle.importKey('raw', new TextEncoder().encode(passwort), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, basis, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const daten = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(klartext)));
const b64 = a => Buffer.from(a).toString('base64');

mkdirSync(new URL('daten/geschuetzt/', import.meta.url), { recursive: true });
writeFileSync(new URL(`daten/geschuetzt/${bereich}.json`, import.meta.url), JSON.stringify({ iter, salt: b64(salt), iv: b64(iv), daten: b64(daten) }));
console.log(`daten/geschuetzt/${bereich}.json geschrieben`);
