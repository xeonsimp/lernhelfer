// Verschlüsselt die Prompts von Word Power (aus Z:\opus\index.html, wird nur gelesen) mit einem Passwort
// und legt sie ins private Daten-Repo: daten/englisch/wordpower.json. Die App entschlüsselt sie erst nach Eingabe des Passworts.
// Aufruf: node wordpower_verschluesseln.mjs <Passwort>   (danach im Ordner daten committen und pushen)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const passwort = process.argv[2];
if (!passwort) throw new Error('Aufruf: node wordpower_verschluesseln.mjs <Passwort>');
const html = readFileSync('Z:/opus/index.html', 'utf8');
const prompt = name => html.match(new RegExp(`const ${name} = \`([\\s\\S]*?)\`;`))[1];
const klartext = JSON.stringify({ transcribe: prompt('TRANSCRIBE_PROMPT'), homework: prompt('HOMEWORK_PROMPT') });

const iter = 1_000_000;  // PBKDF2 bremst Rateversuche; ein 4-stelliges Passwort bleibt trotzdem nur ein Schloss gegen Neugierige
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const basis = await crypto.subtle.importKey('raw', new TextEncoder().encode(passwort), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, basis, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const daten = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(klartext)));
const b64 = a => Buffer.from(a).toString('base64');

mkdirSync(new URL('daten/englisch/', import.meta.url), { recursive: true });
writeFileSync(new URL('daten/englisch/wordpower.json', import.meta.url), JSON.stringify({ iter, salt: b64(salt), iv: b64(iv), daten: b64(daten) }));
console.log('daten/englisch/wordpower.json geschrieben');
