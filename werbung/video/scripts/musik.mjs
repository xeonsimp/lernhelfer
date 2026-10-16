// Lo-fi-Track fürs lange Reel, komplett synthetisiert (keine Samples, keine Downloads): 90 BPM, C-Dur, 104 Takte ≈ 4:40 min.
// E-Piano, Bass, Pad, Melodie, Kick, Snare, Hi-Hats mit Swing, Hall und leichtem Pumpen. Aufbau in 4-Takt-Blöcken mit Intro, Break und Outro.
// Aufruf aus werbung/video:  node scripts/musik.mjs  →  public/sfx/musik-reel.wav
import {writeFileSync} from 'node:fs';

const SR = 44100, BPM = 90, B = 60 / BPM, TAKT = 4 * B, SWING = 0.08 * B;
const AKKORDE = {
	Fmaj7: {b: 41, v: [57, 60, 64, 67]}, Em7: {b: 40, v: [55, 59, 62, 64]}, Dm7: {b: 38, v: [53, 57, 60, 64]}, Cmaj7: {b: 36, v: [52, 55, 59, 62]},
	G7: {b: 43, v: [53, 57, 59, 62]}, Am7: {b: 45, v: [55, 60, 64, 67]},
};
const A = ['Fmaj7', 'Em7', 'Dm7', 'Cmaj7'], BB = ['Dm7', 'G7', 'Em7', 'Am7'], C = ['Am7', 'Dm7', 'G7', 'Cmaj7'];
// Melodien (m1, m2 über A, m3 über C), je 16 Schläge: [Schlag, MIDI, Dauer in Schlägen]
const MEL = {
	m1: [[0, 76, 1.5], [2, 74, 0.5], [2.5, 72, 1], [4, 71, 1.5], [6, 72, 0.5], [6.5, 74, 1.5], [8, 72, 1], [9, 69, 1], [10, 67, 2], [12, 64, 1], [13, 67, 1], [14, 69, 2]],
	m2: [[0, 72, 0.5], [0.5, 74, 0.5], [1, 76, 2], [4, 79, 1], [5, 76, 1], [6, 74, 2], [8, 77, 1.5], [9.5, 76, 0.5], [10, 74, 2], [12, 72, 3]],
	m3: [[0, 69, 1], [1, 72, 1], [2, 76, 2], [4, 77, 1.5], [5.5, 76, 0.5], [6, 74, 2], [8, 71, 1], [9, 74, 1], [10, 77, 1], [11, 76, 1], [12, 72, 3]],
};
// Blöcke zu 4 Takten: Folge, Schlagzeug (0 aus, 1 leicht, 2 voll), Pad, Melodie
const PLAN = [
	{p: A, d: 0, pad: 0}, {p: A, d: 2}, {p: A, d: 2}, {p: BB, d: 2}, {p: A, d: 2, mel: 'm1'}, {p: A, d: 2, mel: 'm2'}, {p: C, d: 2}, {p: BB, d: 0, pad: 1},
	{p: A, d: 2, pad: 1, mel: 'm1'}, {p: BB, d: 2, pad: 1}, {p: A, d: 2, mel: 'm2'}, {p: C, d: 2, mel: 'm3'}, {p: A, d: 1}, {p: BB, d: 2}, {p: C, d: 2, mel: 'm3'}, {p: A, d: 2, mel: 'm1'},
	{p: BB, d: 0, pad: 1}, {p: A, d: 1, pad: 1}, {p: A, d: 2, mel: 'm2'}, {p: C, d: 2, pad: 1, mel: 'm3'}, {p: BB, d: 2}, {p: A, d: 2, mel: 'm1'}, {p: C, d: 2}, {p: A, d: 2, mel: 'm2'},
	{p: A, d: 1}, {p: A, d: 0, pad: 1, ende: true},
];
const DAUER = PLAN.length * 4 * TAKT + 4;
const N = Math.ceil(DAUER * SR);
const L = new Float32Array(N), R = new Float32Array(N), DL = new Float32Array(N), DR = new Float32Array(N), HALL = new Float32Array(N), PUMPE = new Float32Array(N).fill(1);

let saat = 20261019;
const zufall = () => ((saat = (saat * 1664525 + 1013904223) >>> 0) / 4294967296);
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const TAU = 2 * Math.PI;
const rein = (i, l, r, hall = 0, trommel = false) => {
	if (i < 0 || i >= N) return;
	if (trommel) { DL[i] += l; DR[i] += r; } else { L[i] += l; R[i] += r; }
	HALL[i] += (l + r) * 0.5 * hall;
};

function epiano(t0, m, vel, dauer, pan) {  // Tine-Klang: FM mit schnell abklingendem Index, dazu leise Oktave
	const f = hz(m), i0 = Math.round(t0 * SR), n = Math.round((dauer + 1.5) * SR);
	for (let k = 0; k < n; k++) {
		const t = k / SR;
		const env = Math.min(1, t / 0.004) * Math.exp(-t / 1.5) * (t > dauer ? Math.exp(-(t - dauer) / 0.15) : 1);
		const x = TAU * f * t;
		const v = vel * env * (Math.sin(x + 1.0 * Math.exp(-t * 6) * Math.sin(x)) + 0.25 * Math.sin(2 * x) * Math.exp(-t * 4));
		const trem = 0.12 * Math.sin(TAU * 4.2 * (t0 + t));
		rein(i0 + k, v * (1 - pan) * (1 + trem), v * (1 + pan) * (1 - trem), 0.28);
	}
}
function bass(t0, m, vel, dauer) {
	const f = hz(m), i0 = Math.round(t0 * SR), n = Math.round((dauer + 0.2) * SR);
	for (let k = 0; k < n; k++) {
		const t = k / SR, x = TAU * f * t;
		const env = Math.min(1, t / 0.01) * Math.exp(-t / 1.6) * (t > dauer ? Math.exp(-(t - dauer) / 0.05) : 1);
		const v = (vel * env * Math.tanh(1.6 * (Math.sin(x) + 0.25 * Math.sin(2 * x)))) / 1.3;
		rein(i0 + k, v, v);
	}
}
function pad(t0, ms, dauer, vel) {  // zwei leicht verstimmte Sägezähne je Ton, weich gefiltert, links und rechts
	const i0 = Math.round(t0 * SR), n = Math.round((dauer + 1.6) * SR), a = 1 - Math.exp((-TAU * 1100) / SR);
	for (const m of ms) for (const [cent, links] of [[-9, true], [9, false]]) {
		const f = hz(m) * 2 ** (cent / 1200);
		let ph = zufall(), y = 0;
		for (let k = 0; k < n; k++) {
			const t = k / SR;
			ph = (ph + f / SR) % 1;
			y += a * (2 * ph - 1 - y);
			const env = Math.min(1, t / 1.2) * (t > dauer ? Math.exp(-(t - dauer) / 0.5) : 1);
			const v = vel * env * y;
			rein(i0 + k, links ? v : 0, links ? 0 : v, 0.4);
		}
	}
}
function melodie(t0, m, vel, dauer) {
	const f = hz(m), i0 = Math.round(t0 * SR), n = Math.round((dauer + 0.8) * SR);
	for (let k = 0; k < n; k++) {
		const t = k / SR, x = TAU * f * t;
		const env = Math.min(1, t / 0.012) * Math.exp(-t / 0.9) * (t > dauer ? Math.exp(-(t - dauer) / 0.12) : 1);
		const v = vel * env * (Math.sin(x) + 0.12 * Math.sin(3 * x) + 0.06 * Math.sin(2 * x));
		rein(i0 + k, v * 1.2, v * 0.8, 0.4);
	}
}
function kick(t0, vel) {
	const i0 = Math.round(t0 * SR);
	let ph = 0;
	for (let k = 0; k < 0.45 * SR; k++) {
		const t = k / SR;
		ph += (TAU * (46 + 100 * Math.exp(-t * 32))) / SR;
		const v = vel * (Math.sin(ph) * Math.exp(-t * 7.5) + 0.12 * Math.exp(-t * 300) * (zufall() * 2 - 1));
		rein(i0 + k, v, v, 0, true);
		if (i0 + k < N) PUMPE[i0 + k] = Math.min(PUMPE[i0 + k], 1 - 0.3 * Math.exp(-t * 8));
	}
}
function snare(t0, vel) {
	const i0 = Math.round(t0 * SR);
	let vor = 0, lp = 0;
	for (let k = 0; k < 0.35 * SR; k++) {
		const t = k / SR, x = zufall() * 2 - 1, hp = x - vor;
		vor = x; lp += 0.45 * (hp - lp);
		const v = vel * (0.7 * lp * Math.exp(-t * 16) + 0.35 * Math.sin(TAU * 185 * t) * Math.exp(-t * 28));
		rein(i0 + k, v * 0.95, v * 1.05, 0.3, true);
	}
}
function hat(t0, vel, offen) {
	const i0 = Math.round(t0 * SR);
	let a = 0, b = 0;
	for (let k = 0; k < (offen ? 0.25 : 0.06) * SR; k++) {
		const t = k / SR, x = zufall() * 2 - 1, y = x - 2 * a + b;
		b = a; a = x;
		const v = vel * 0.34 * y * Math.exp(-t * (offen ? 14 : 60));
		rein(i0 + k, v * 0.8, v * 1.2, 0.08, true);
	}
}

// ---------- Noten setzen ----------
PLAN.forEach((blk, bi) => {
	for (let tk = 0; tk < 4; tk++) {
		const t = (bi * 4 + tk) * TAKT, akk = AKKORDE[blk.p[tk]], mensch = () => (zufall() - 0.5) * 0.016;
		const letzter = blk.ende && tk === 3;
		// E-Piano: Schlag 1 und „und“ von 2 (geswingt), manchmal eine Vorwegnahme auf 4-und
		const anschlaege = letzter ? [[0, 3.9, 0.3]] : [[0, 3.9, 0.3], [1.5, 2.4, 0.2], ...(zufall() < 0.5 ? [[3.5, 0.5, 0.16]] : [])];  // klingt durch den ganzen Takt
		for (const [schlag, dauer, vel] of anschlaege) {
			const t1 = t + schlag * B + (schlag % 1 ? SWING : 0) + mensch();
			akk.v.forEach((m, j) => epiano(t1 + j * 0.014, m, vel * (0.85 + 0.3 * zufall()) * 0.42, dauer * B, (j - 1.5) * 0.18));
		}
		if (blk.pad || bi > 0) pad(t, akk.v.map((m) => m - 12).concat(akk.v[3]), TAKT * 0.98, blk.pad ? 0.022 : 0.011);  // leiser Teppich, im Break lauter
		if (blk.d > 0 || blk.pad) {  // Bass
			const leise = blk.d === 0 ? 0.6 : 1;
			bass(t + mensch(), akk.b, 0.42 * leise, 2.2 * B);
			bass(t + 2.5 * B + SWING + mensch(), akk.b, 0.32 * leise, 0.45 * B);
			if (zufall() < 0.6) bass(t + 3.5 * B + SWING + mensch(), akk.b + (zufall() < 0.5 ? 7 : 12), 0.26 * leise, 0.35 * B);
		}
		if (blk.d === 2) {
			kick(t, 0.75); kick(t + 2.5 * B + SWING, 0.6);
			if (zufall() < 0.4) kick(t + 1.5 * B + SWING, 0.45);
			snare(t + B + 0.018, 0.42); snare(t + 3 * B + 0.018, 0.45);
		} else if (blk.d === 1) {
			snare(t + B + 0.018, 0.25); snare(t + 3 * B + 0.018, 0.28);
		}
		if (blk.d > 0 || (bi === 0 && tk >= 2)) for (let e = 0; e < 8; e++) {
			const off = e % 2 === 1;
			hat(t + e * 0.5 * B + (off ? SWING : 0) + mensch(), (off ? 0.32 : 0.5) * (0.8 + 0.4 * zufall()) * (blk.d === 0 ? 0.6 : 1), off && e === 7 && zufall() < 0.25);
		}
	}
	if (blk.mel) for (const [schlag, m, dauer] of MEL[blk.mel]) melodie(bi * 4 * TAKT + schlag * B + (schlag % 1 ? SWING : 0), m, 0.2, dauer * B);
});

// ---------- Hall (Schroeder: vier Kammfilter mit Dämpfung, zwei Allpässe), links und rechts leicht verschieden ----------
function hall(ein, versatz) {
	const aus = new Float32Array(N);
	for (const ms of [29.7, 37.1, 41.1, 43.7]) {
		const d = Math.round(((ms + versatz) * SR) / 1000), puf = new Float32Array(d);
		let p = 0, lp = 0;
		for (let i = 0; i < N; i++) {
			const y = puf[p];
			lp += 0.35 * (y - lp);
			puf[p] = ein[i] + 0.82 * lp;
			p = (p + 1) % d;
			aus[i] += y * 0.25;
		}
	}
	for (const ms of [5.0, 1.7]) {
		const d = Math.round((ms * SR) / 1000), puf = new Float32Array(d);
		let p = 0;
		for (let i = 0; i < N; i++) {
			const x = aus[i], y = puf[p] - 0.7 * x;
			puf[p] = x + 0.7 * y;
			p = (p + 1) % d;
			aus[i] = y;
		}
	}
	return aus;
}
const HL = hall(HALL, 0), HR = hall(HALL, 1.3);

// ---------- Summe: Pumpen, Tiefpass (Intro auf, Outro zu), sanfte Sättigung, Pegel ----------
const ende = PLAN.length * 4 * TAKT;
const grenze = (t) => (t < 4 * TAKT ? 1200 + (11000 - 1200) * (t / (4 * TAKT)) ** 2 : t > ende - 3 * TAKT ? Math.max(900, 11000 - (11000 - 900) * ((t - (ende - 3 * TAKT)) / (3 * TAKT))) : 11000);
let fl = 0, fr = 0, spitze = 0, rl = 0, rr = 0;
const OL = new Float32Array(N), OR = new Float32Array(N);
for (let i = 0; i < N; i++) {
	const t = i / SR, a = 1 - Math.exp((-TAU * grenze(t)) / SR);
	rl += 0.02 * (zufall() * 2 - 1 - rl); rr += 0.02 * (zufall() * 2 - 1 - rr);  // leises Bandrauschen, damit es nie digital still wird
	const l = L[i] * PUMPE[i] + DL[i] + 0.35 * HL[i] + 0.02 * rl, r = R[i] * PUMPE[i] + DR[i] + 0.35 * HR[i] + 0.02 * rr;
	fl += a * (l - fl); fr += a * (r - fr);
	OL[i] = Math.tanh(fl * 1.3); OR[i] = Math.tanh(fr * 1.3);
	spitze = Math.max(spitze, Math.abs(OL[i]), Math.abs(OR[i]));
}
const k = 0.8 / spitze, wav = Buffer.alloc(44 + N * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + N * 4, 4); wav.write('WAVE', 8); wav.write('fmt ', 12);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22); wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
	const blende = Math.min(1, i / (0.5 * SR), (N - i) / (2 * SR));
	wav.writeInt16LE(Math.round(OL[i] * k * blende * 32767), 44 + i * 4);
	wav.writeInt16LE(Math.round(OR[i] * k * blende * 32767), 46 + i * 4);
}
writeFileSync(new URL('../public/sfx/musik-reel.wav', import.meta.url), wav);
console.log(`musik-reel.wav: ${(N / SR).toFixed(1)} s, ${PLAN.length * 4} Takte`);
