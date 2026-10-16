// Bausteine im Skizzen-Stil der App (skizze.css): Papier mit Punktraster, gezeichnete Rahmen, Marker, Schriftzug, Geräte.
import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, Img, interpolate, interpolateColors, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {evolvePath} from '@remotion/paths';
import {Highlight} from '@remotion/rough-notation';
import rough from 'roughjs';
import type {Options} from 'roughjs/bin/core';
import shots from '../public/shots/shots.json';
import lang from '../public/shots/lang.json';

export const FARBE = {
	hell: {bg: '#fbfbf9', bg2: '#f2f2ee', tinte: '#121212', text2: '#4f535a', punkt: 'rgba(24,32,56,0.17)', akzent: '#2446c8', zettel: '#fff2a8'},
	dunkel: {bg: '#151515', bg2: '#1f1e1c', tinte: '#e9e6df', text2: '#a9a59d', punkt: 'rgba(233,230,223,0.09)', akzent: '#cbb894', zettel: '#fff2a8'},
};
export type Thema = keyof typeof FARBE;
export const GELB = '#ffe93a';
export const BLAU = '#2446c8';
export const SCHRIFT = 'Archivo, system-ui, sans-serif';
export const FACH = {mathe: '#0f766e', vwl: '#b45309', bwl: '#7c3aed', englisch: '#be185d'};

export const klemm = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const weich = Easing.bezier(0.16, 1, 0.3, 1);
/** 0 → 1 zwischen zwei Frames, weich auslaufend */
export const ab = (f: number, von: number, dauer: number, easing = weich) => interpolate(f, [von, von + dauer], [0, 1], {...klemm, easing});
/** Alle Zahlen (Zeitpunkte) um f strecken: mehr Zeit zum Lesen, die Animationen selbst bleiben gleich schnell */
export const streck = <T,>(o: T, f: number): T => JSON.parse(JSON.stringify(o), (_, v) => (typeof v === 'number' ? Math.round(v * f) : v));

/** Sicherer Bereich: 9:16 oben 250 px und unten 350 px frei. Bühne = Fläche für Gerät oder Karten, Textfeld = Fläche für die Texttafel. */
export const useFormat = () => {
	const {width, height} = useVideoConfig();
	const quer = width > height;
	return quer
		? {quer, W: width, H: height, text: {x: 120, y: 0, w: 760, h: height}, buehne: {x: 930, y: 70, w: 900, h: 940}, schrift: 76}
		: {quer, W: width, H: height, text: {x: 84, y: 250, w: 912, h: 310}, buehne: {x: 60, y: 580, w: 960, h: 990}, schrift: 88};
};

/** Bühne 960 × 990 im Video: Maßstab k und linke obere Ecke */
export const useBuehne = () => {
	const {buehne} = useFormat();
	const k = Math.min(buehne.w / 960, buehne.h / 990);
	return {k, x0: buehne.x + (buehne.w - 960 * k) / 2, y0: buehne.y + (buehne.h - 990 * k) / 2};
};
/** Inhalt, gebaut für eine Bühne von 960 × 990, passend in die Bühne des Formats skaliert */
export const Buehne: React.FC<{children: React.ReactNode}> = ({children}) => {
	const {k, x0, y0} = useBuehne();
	return (
		<div style={{position: 'absolute', left: x0, top: y0, width: 960, height: 990, scale: String(k), transformOrigin: '0 0'}}>
			{children}
		</div>
	);
};

export const Papier: React.FC<{thema: Thema; children?: React.ReactNode}> = ({thema, children}) => {
	const c = FARBE[thema];
	return (
		<AbsoluteFill style={{backgroundColor: c.bg, backgroundImage: `radial-gradient(circle at 2px 2px, ${c.punkt} 2.3px, transparent 2.9px)`, backgroundSize: '44px 44px', color: c.tinte, fontFamily: SCHRIFT}}>
			{children}
		</AbsoluteFill>
	);
};

// ---------- Gezeichnetes mit roughjs, Strich für Strich per evolvePath ----------
const gen = rough.generator();
type Pfad = {d: string};
const merke = new Map<string, Pfad[]>();
export const rau = (key: string, fn: (g: typeof gen) => ReturnType<typeof gen.path>): Pfad[] => {
	if (!merke.has(key)) merke.set(key, gen.toPaths(fn(gen)).map((p) => ({d: p.d})));
	return merke.get(key)!;
};
export const rundesRechteck = (x: number, y: number, w: number, h: number, r: number) =>
	`M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

/** Zeichnet Pfade nacheinander; progress 0 → 1 */
export const Striche: React.FC<{pfade: Pfad[]; progress: number; farbe: string; breite?: number; style?: React.CSSProperties}> = ({pfade, progress, farbe, breite = 3, style}) => (
	<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style}} width={1} height={1}>
		{pfade.map((p, i) => {
			const t = Math.max(0, Math.min(1, progress * pfade.length - i));
			if (t <= 0) return null;
			if (t >= 1) return <path key={i} d={p.d} fill="none" stroke={farbe} strokeWidth={breite} strokeLinecap="round" strokeLinejoin="round" />;
			const {strokeDasharray, strokeDashoffset} = evolvePath(t, p.d);
			return <path key={i} d={p.d} fill="none" stroke={farbe} strokeWidth={breite} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />;
		})}
	</svg>
);

/** Gezeichneter Kasten wie .rahmen in skizze.css: Striche stehen an den Ecken leicht über */
export const Rahmen: React.FC<{w: number; h: number; progress: number; farbe: string; seed?: number; breite?: number; rund?: number; rauheit?: number; style?: React.CSSProperties}> = ({w, h, progress, farbe, seed = 1, breite = 3, rund = 0, rauheit = 1.1, style}) => {
	const opt: Options = {seed, roughness: rauheit, bowing: 0.6, preserveVertices: false};
	const pfade = rau(`r${w}x${h}s${seed}r${rund}k${rauheit}`, (g) =>
		rund ? g.path(rundesRechteck(0, 0, w, h, rund), opt) : g.linearPath([[-4, 2], [w + 3, -1], [w + 1, h + 4], [-2, h - 1], [2, -3]], opt),
	);
	return <Striche pfade={pfade} progress={progress} farbe={farbe} breite={breite} style={style} />;
};

/** Haken aus skizze.css (--haken-blau), wächst mit progress */
export const Haken: React.FC<{groesse: number; progress: number; farbe: string; style?: React.CSSProperties}> = ({groesse, progress, farbe, style}) => {
	const d = 'M3.5 10.8Q6.2 12.6 8.1 16.4Q11.6 8.4 17.6 3';
	const {strokeDasharray, strokeDashoffset} = evolvePath(Math.max(0.0001, progress), d);
	return (
		<svg viewBox="0 0 20 20" width={groesse} height={groesse} style={{position: 'absolute', overflow: 'visible', ...style}}>
			<path d={d} fill="none" stroke={farbe} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} opacity={progress > 0 ? 1 : 0} />
		</svg>
	);
};

// ---------- Schriftzug LERNHELFER (--wortmarke), jeder Strich einzeln ----------
const WORTMARKE: [string, string][] = [
	['translate(6 7.4) rotate(-2.4 25 50)', 'M6 2Q4 52 7 99M6 98Q26 95 50 99'],
	['translate(73 11.2) rotate(2.4 25 50)', 'M7 3Q5 52 7 98M8 4Q28 1 48 5M8 50Q24 47 41 50M7 97Q28 99 50 95'],
	['translate(140 9.4) rotate(0.1 27 50)', 'M7 99Q5 52 8 3M8 4C38-1 56 12 51 29C47 45 28 50 9 49M25 50Q38 72 54 99'],
	['translate(211 8.4) rotate(-0.2 29 50)', 'M6 99Q5 52 7 4M7 4Q30 52 52 98M52 98Q54 52 51 2'],
	['translate(286 11.4) rotate(0.3 28 50)', 'M6 2Q4 52 7 99M51 3Q53 52 50 99M7 51Q29 47 51 52'],
	['translate(359 7.9) rotate(-1.2 25 50)', 'M7 3Q5 52 7 98M8 4Q28 1 48 5M8 50Q24 47 41 50M7 97Q28 99 50 95'],
	['translate(426 10.1) rotate(1.3 25 50)', 'M6 2Q4 52 7 99M6 98Q26 95 50 99'],
	['translate(493 9.2) rotate(-1.5 23 50)', 'M7 99Q5 52 8 3M8 4Q28 1 46 6M8 51Q23 48 38 51'],
	['translate(556 10.2) rotate(-1 25 50)', 'M7 3Q5 52 7 98M8 4Q28 1 48 5M8 50Q24 47 41 50M7 97Q28 99 50 95'],
	['translate(623 12.9) rotate(-1 27 50)', 'M7 99Q5 52 8 3M8 4C38-1 56 12 51 29C47 45 28 50 9 49M25 50Q38 72 54 99'],
];
const STRICHE = WORTMARKE.flatMap(([t, d]) => d.split('M').filter(Boolean).map((s) => [t, 'M' + s] as const));
export const Wortmarke: React.FC<{breite: number; progress: number; farbe: string; style?: React.CSSProperties}> = ({breite, progress, farbe, style}) => (
	<svg viewBox="0 0 694 124" width={breite} height={(breite * 124) / 694} style={{overflow: 'visible', ...style}}>
		<g fill="none" stroke={farbe} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round">
			{STRICHE.map(([t, d], i) => {
				const p = interpolate(progress, [(i / STRICHE.length) * 0.78, (i / STRICHE.length) * 0.78 + 0.22], [0, 1], klemm);
				const {strokeDasharray, strokeDashoffset} = evolvePath(Math.max(0.0001, p), d);
				return <path key={i} transform={t} d={d} strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} opacity={p > 0 ? 1 : 0} />;
			})}
		</g>
	</svg>
);

// ---------- Texttafel: Wörter fliegen ein, Schlüsselwörter bekommen den gelben Marker ----------
export type Teil = string | {m: string; bei?: number} | {t: string; bei: number};
export const Texttafel: React.FC<{
	zeilen: Teil[][];
	start: number;
	thema: Thema;
	groesse?: number;
	markerAb?: number; // Frame, ab dem der Marker wischt (sonst kurz nach dem Wort)
	aus?: number; // Frame, ab dem die Tafel ausblendet
	gewicht?: number;
	style?: React.CSSProperties;
}> = ({zeilen, start, thema, groesse, markerAb, aus, gewicht = 800, style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const fmt = useFormat();
	const g = groesse ?? fmt.schrift;
	const c = FARBE[thema];
	let n = 0;
	const raus = aus == null ? 0 : ab(frame, aus, 10, Easing.in(Easing.quad));
	return (
		<div style={{fontSize: g, fontWeight: gewicht, fontStretch: '88%', lineHeight: 1.08, letterSpacing: '-0.015em', color: c.tinte, opacity: 1 - raus, translate: `0 ${-raus * 30}px`, ...style}}>
			{zeilen.map((zeile, zi) => (
				<div key={zi}>
					{zeile.map((teil, ti) => {
						const i = n++;
						const s = typeof teil === 'object' && teil.bei != null ? teil.bei : start + i * 6;
						const rein = spring({frame: frame - s, fps, config: {damping: 14, mass: 0.6}});
						const wort = typeof teil === 'string' ? teil : 'm' in teil ? teil.m : teil.t;
						const stil: React.CSSProperties = {display: 'inline-block', opacity: Math.min(1, rein * 1.4), translate: `0 ${(1 - rein) * 40}px`, whiteSpace: 'pre'};
						if (typeof teil === 'string' || !('m' in teil)) return <span key={ti} style={stil}>{wort}</span>;
						const m = ab(frame, markerAb ?? s + 10, 14, Easing.inOut(Easing.quad));
						return (
							<span key={ti} style={stil}>
								<Highlight progress={m} color={GELB} seed={7 + i} iterations={1} padding={{left: g * 0.08, right: g * 0.08, top: 0, bottom: 0}} name="Marker">
									<span style={{color: interpolateColors(m, [0, 0.4], [c.tinte, '#121212'])}}>{wort}</span>
								</Highlight>
							</span>
						);
					})}
				</div>
			))}
		</div>
	);
};

// ---------- App-Aufnahmen ----------
export type Feld = {lh: number; oben: number; links: number; bg: string; zeilen: number};
type Shot = {w: number; h: number; boxen: Record<string, number[]>; feld?: Feld};
export const SHOTS = {...shots, ...lang} as Record<string, Shot>;
export const kasten = (shot: string, name: string) => {
	const b = SHOTS[shot]?.boxen[name];
	if (!b) throw new Error(`Box ${name} fehlt in ${shot}`);
	return {x: b[0], y: b[1], w: b[2], h: b[3]};
};

/** Eine Seite der App im Bildschirm: breite = angezeigte Breite des Viewports, scroll in CSS-Pixeln. Kinder liegen in Seitenkoordinaten. */
export const Seite: React.FC<{shot: string; breite: number; scroll?: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({shot, breite, scroll = 0, style, children}) => {
	const s = SHOTS[shot];
	const k = breite / s.w;
	return (
		<div style={{position: 'absolute', left: 0, top: 0, width: s.w, height: s.h, scale: String(k), transformOrigin: '0 0', translate: `0 ${-scroll * k}px`, ...style}}>
			<Img src={staticFile(`shots/${shot}.png`)} style={{width: s.w, height: s.h, display: 'block'}} />
			{children}
		</div>
	);
};

/** Ausschnitt einer Aufnahme (CSS-Pixel), z. B. eine Karte; breite = angezeigte Breite */
export const Ausschnitt: React.FC<{shot: string; x: number; y: number; w: number; h: number; breite: number; style?: React.CSSProperties}> = ({shot, x, y, w, h, breite, style}) => {
	const s = SHOTS[shot];
	const k = breite / w;
	return (
		<div style={{position: 'relative', width: breite, height: h * k, overflow: 'hidden', ...style}}>
			<Img src={staticFile(`shots/${shot}.png`)} style={{position: 'absolute', left: -x * k, top: -y * k, width: s.w * k, height: s.h * k, maxWidth: 'none'}} />
		</div>
	);
};

// ---------- Geräte: gezeichnete Kontur, kein Logo ----------
export const Handy: React.FC<{breite: number; thema: Thema; zeichnen?: number; seed?: number; tabs?: string; children: (screen: {w: number; h: number}) => React.ReactNode}> = ({breite, thema, zeichnen = 1, seed = 3, tabs, children}) => {
	const c = FARBE[thema];
	const b = Math.round(breite * 0.045);
	const w = breite - 2 * b;
	const h = Math.round((w * 844) / 390);
	const H = h + 2 * b;
	const r = breite * 0.14;
	const kontur = useMemo(() => {
		const o: Options = {seed, roughness: 0.9, bowing: 0.4};
		return [
			...rau(`handy${breite}s${seed}`, (g) => g.path(rundesRechteck(0, 0, breite, H, r), o)),
			...rau(`handyK${breite}s${seed}`, (g) => g.linearPath([[-5, H * 0.2], [-5, H * 0.27]], o)),
			...rau(`handyL${breite}s${seed}`, (g) => g.linearPath([[breite + 5, H * 0.24], [breite + 5, H * 0.34]], o)),
		];
	}, [breite, H, r, seed]);
	const tabH = tabs ? (SHOTS[tabs].h * w) / 390 : 0;
	return (
		<div style={{position: 'relative', width: breite, height: H}}>
			<div style={{position: 'absolute', inset: 0, borderRadius: r, background: thema === 'hell' ? '#fffefa' : '#1b1a18', opacity: Math.min(1, zeichnen * 2), boxShadow: '0 40px 80px -40px rgba(0,0,0,0.55)'}} />
			{/* schmaler schwarzer Rand ums Display, damit es sich auch auf Weiß abhebt */}
			<div style={{position: 'absolute', left: b, top: b, width: w, height: h, borderRadius: r - b, overflow: 'hidden', background: c.bg, boxShadow: `0 0 0 ${Math.max(3, Math.round(breite * 0.013))}px #121212`, opacity: interpolate(zeichnen, [0.4, 0.8], [0, 1], klemm)}}>
				{children({w, h})}
				{tabs ? <Img src={staticFile(`shots/${tabs}.png`)} style={{position: 'absolute', left: 0, bottom: 0, width: w, height: tabH}} /> : null}
			</div>
			<Striche pfade={kontur} progress={zeichnen} farbe={c.tinte} breite={3.4} />
		</div>
	);
};

export const Tablet: React.FC<{breite: number; thema: Thema; zeichnen?: number; seed?: number; children: (screen: {w: number; h: number}) => React.ReactNode}> = ({breite, thema, zeichnen = 1, seed = 5, children}) => {
	const c = FARBE[thema];
	const b = Math.round(breite * 0.03);
	const w = breite - 2 * b;
	const h = Math.round((w * 900) / 1440);
	const H = h + 2 * b;
	const r = breite * 0.045;
	const kontur = useMemo(() => rau(`tablet${breite}s${seed}`, (g) => g.path(rundesRechteck(0, 0, breite, H, r), {seed, roughness: 0.9, bowing: 0.4})), [breite, H, r, seed]);
	return (
		<div style={{position: 'relative', width: breite, height: H}}>
			<div style={{position: 'absolute', inset: 0, borderRadius: r, background: thema === 'hell' ? '#fffefa' : '#1b1a18', opacity: Math.min(1, zeichnen * 2), boxShadow: '0 40px 80px -40px rgba(0,0,0,0.55)'}} />
			<div style={{position: 'absolute', left: b, top: b, width: w, height: h, borderRadius: r * 0.5, overflow: 'hidden', background: c.bg, opacity: interpolate(zeichnen, [0.4, 0.8], [0, 1], klemm)}}>{children({w, h})}</div>
			<div style={{position: 'absolute', left: b / 2 - 5, top: H / 2 - 5, width: 10, height: 10, borderRadius: 5, background: c.tinte, opacity: 0.6}} />
			<Striche pfade={kontur} progress={zeichnen} farbe={c.tinte} breite={3.4} />
		</div>
	);
};

/** Tipp-Kreis: wo „getippt“ wird */
export const Tipp: React.FC<{x: number; y: number; bei: number; farbe?: string}> = ({x, y, bei, farbe = BLAU}) => {
	const frame = useCurrentFrame();
	const p = ab(frame, bei - 6, 22, Easing.out(Easing.quad));
	if (frame < bei - 6 || p >= 1) return null;
	return (
		<>
			<div style={{position: 'absolute', left: x - 30, top: y - 30, width: 60, height: 60, borderRadius: 30, background: farbe, opacity: 0.28 * (1 - p), scale: String(0.6 + p * 0.5)}} />
			<div style={{position: 'absolute', left: x - 22, top: y - 22, width: 44, height: 44, borderRadius: 22, border: `3px solid ${farbe}`, opacity: 1 - p, scale: String(0.7 + p * 1.2)}} />
		</>
	);
};

/** Kleiner Hinweis unter App-Aufnahmen */
export const Beispieldaten: React.FC<{thema: Thema; style?: React.CSSProperties}> = ({thema, style}) => (
	<div style={{position: 'absolute', fontSize: 24, fontWeight: 600, letterSpacing: '0.04em', color: FARBE[thema].text2, opacity: 0.85, ...style}}>Beispieldaten</div>
);

/** Gelber Zettel mit Text, leicht gedreht (wie .verlauf .frage) */
export const Zettel: React.FC<{text: string; bei: number; dreh?: number; style?: React.CSSProperties; groesse?: number}> = ({text, bei, dreh = -2, style, groesse = 34}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = spring({frame: frame - bei, fps, config: {damping: 11, mass: 0.7}});
	return (
		<div style={{position: 'absolute', padding: '14px 22px', background: FARBE.hell.zettel, color: '#121212', fontSize: groesse, fontWeight: 750, borderRadius: 3, rotate: `${dreh}deg`, scale: String(p), opacity: Math.min(1, p * 2), boxShadow: '0 2px 3px rgba(0,0,0,0.12), 0 18px 30px -16px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', ...style}}>
			{text}
		</div>
	);
};

/** Karte, die mit leichtem Überschwingen einfliegt */
export const useEinflug = (bei: number, von: [number, number] = [0, 260], damping = 12) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = spring({frame: frame - bei, fps, config: {damping, mass: 0.8, stiffness: 140}});
	return {p, style: {translate: `${(1 - p) * von[0]}px ${(1 - p) * von[1]}px`, opacity: Math.min(1, Math.max(0, p * 2)), scale: String(0.9 + 0.1 * p)} as React.CSSProperties};
};

/** Zahl zählt hoch */
export const zaehle = (frame: number, von: number, bis: number, start: number, dauer: number) => Math.round(interpolate(frame, [start, start + dauer], [von, bis], {...klemm, easing: Easing.out(Easing.cubic)}));
