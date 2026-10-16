// Bausteine für das lange Reel: Handy mit Kamerafahrt über eine ganze Seite, große Karten aus App-Ausschnitten, Tippen im Textfeld
import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ab, Handy, kasten, klemm, Rahmen, SCHRIFT, Seite, SHOTS, Texttafel, type Teil, type Thema, Tipp, useEinflug, useFormat, Zettel} from './lib';
import type {Cue} from './ton';

const FAHRT = 30; // Frames für jede Kamerafahrt
const weich = Easing.inOut(Easing.cubic);
const lin = (frame: number, ein: number[], aus: number[]) => (ein.length < 2 ? aus[0] : interpolate(frame, ein, aus, {...klemm, easing: weich}));

/** Ein Halt der Kamera: Element (box) oben im Bildschirm, optional herangezoomt; ohne box: Seite bei y, ganzes Handy */
export type Halt = {bei: number; box?: string; y?: number; zoom?: number; anteil?: number};

/** Handy mit einer ganzen App-Seite. Die Kamera fährt von Halt zu Halt (je 30 Frames bis „bei“), Kinder liegen in Seitenkoordinaten. */
export const Telefon: React.FC<{shot: string; halte: Halt[]; thema: Thema; rein?: number; ueber?: {shot: string; bei: number}[]; kinder?: React.ReactNode}> = ({shot, halte, thema, rein = 0, ueber = [], kinder}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const breite = 470, rand = Math.round(breite * 0.045), s = (breite - 2 * rand) / 390, vh = 844;
	const H = Math.round(((breite - 2 * rand) * vh) / 390) + 2 * rand;
	const gx = (960 - breite) / 2, gy = (990 - H) / 2;
	const S = SHOTS[shot];
	const werte = halte.map((h) => {
		const b = h.box ? kasten(shot, h.box) : null;
		const scroll = Math.max(0, Math.min(S.h - vh, b ? b.y - (h.anteil ?? 0.12) * vh : h.y ?? 0));
		const zoom = h.zoom ?? 1, sichtbar = 990 / zoom / s; // so viel Seite (CSS-Pixel) passt bei diesem Zoom ins Bild
		return zoom > 1 && b
			? {scroll, zoom, fx: gx + rand + (b.x + b.w / 2) * s, fy: gy + rand + (b.y - scroll + Math.min(b.h, sichtbar * 0.7) / 2) * s}
			: {scroll, zoom, fx: 480, fy: 495};
	});
	const zeiten = halte.flatMap((h, i) => (i ? [h.bei - FAHRT, h.bei] : [h.bei]));
	const wert = (k: 'scroll' | 'zoom' | 'fx' | 'fy') => lin(frame, zeiten, werte.flatMap((w, i) => (i ? [werte[i - 1][k], w[k]] : [w[k]])));
	const zoom = wert('zoom'), fx = wert('fx'), fy = wert('fy'), scroll = wert('scroll');
	const flug = spring({frame: frame - rein, fps, config: {damping: 13, mass: 0.9, stiffness: 110}});
	return (
		<div style={{position: 'absolute', left: -60, right: -60, top: -30, bottom: -30, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 30px, #000 calc(100% - 30px), transparent 100%)'}}>
			<div style={{position: 'absolute', left: 60, top: 30, width: 960, height: 990, transformOrigin: '0 0', translate: `${480 - fx * zoom}px ${495 - fy * zoom}px`, scale: String(zoom)}}>
				<div style={{position: 'absolute', left: gx, top: gy, translate: `0 ${(1 - flug) * 1000}px`, rotate: `${(1 - flug) * 8}deg`}}>
					<Handy breite={breite} thema={thema} tabs={shot.startsWith('lang/') ? 'm_hell_tabs' : undefined}>
						{({w}) => (
							<>
								<Seite shot={shot} breite={w} scroll={scroll}>{kinder}</Seite>
								{ueber.map((u) => <Seite key={u.shot} shot={u.shot} breite={w} scroll={scroll} style={{opacity: ab(frame, u.bei, 10)}} />)}
							</>
						)}
					</Handy>
				</div>
			</div>
		</div>
	);
};

/** Aufnahmen ohne eigenen Rand (Text bis an die Kante) bekommen in der Karte Luft zum gezeichneten Rahmen */
const OHNE_RAND = /^lang\/(chat|coach|hoeren|vt_reflexion|archiv|stil|modell|design|test_loesung|pk_ergebnis)/;
const luft = (shot: string) => (OHNE_RAND.test(shot) ? 26 : 0);
/** So viel vom Bild (CSS-Pixel) zeigt eine Karte dieser Höhe, und so weit lässt es sich darin scrollen */
export const sicht = (shot: string, fenster: number, breite = 820) => ((fenster - 2 * luft(shot)) * SHOTS[shot].w) / (breite - 2 * luft(shot));
export const bisUnten = (shot: string, fenster: number, breite = 820) => Math.max(0, SHOTS[shot].h - sicht(shot, fenster, breite));

/** Große Karte aus einem App-Ausschnitt (Element-Aufnahme oder box einer Seite). fenster: Höhe der Karte, scroll und bis in CSS-Pixeln des Bildes. */
export const Bild: React.FC<{
	shot: string;
	box?: string; // Ausschnitt einer ganzen Seite statt einer Element-Aufnahme
	rect?: number[]; // oder ein freier Ausschnitt [x, y, w, h]
	breite?: number;
	fenster?: number;
	scroll?: number;
	bis?: number; // darunter noch verdeckt (fürs „Schreiben“ einer Antwort)
	top: number;
	bei: number;
	seed?: number;
	children?: React.ReactNode; // in Bildkoordinaten (CSS-Pixel)
	style?: React.CSSProperties;
}> = ({shot, box, rect, breite = 820, fenster, scroll = 0, bis, top, bei, seed = 71, children, style}) => {
	const S = SHOTS[shot];
	const b = rect ? {x: rect[0], y: rect[1], w: rect[2], h: rect[3]} : box ? kasten(shot, box) : {x: 0, y: 0, w: S.w, h: S.h};
	const L = luft(shot), k = (breite - 2 * L) / b.w, voll = b.h * k + 2 * L, h = Math.round(Math.min(voll, fenster ?? voll));
	const e = useEinflug(bei, [0, 220]);
	if (useCurrentFrame() < bei - 2) return null;
	return (
		<div style={{position: 'absolute', left: (960 - breite) / 2, top, width: breite, height: h, background: '#fbfbf9', boxShadow: '0 2px 4px rgba(18,18,18,0.08), 0 30px 60px -28px rgba(18,18,18,0.45)', ...e.style, ...style}}>
			<div style={{position: 'absolute', inset: L, overflow: 'hidden'}}>
				<div style={{position: 'absolute', left: -b.x * k, top: -(b.y + scroll) * k, width: S.w * k, height: S.h * k, clipPath: bis == null ? undefined : `inset(0 0 ${Math.max(0, (S.h - b.y - bis) * k)}px 0)`}}>
					<Img src={staticFile(`shots/${shot}.png`)} style={{width: '100%', height: '100%', display: 'block'}} />
				</div>
				<div style={{position: 'absolute', left: -b.x * k, top: -(b.y + scroll) * k, width: S.w, height: S.h, scale: String(k), transformOrigin: '0 0'}}>{children}</div>
			</div>
			<Rahmen w={breite} h={h} seed={seed} farbe="#121212" progress={1} breite={3} />
		</div>
	);
};

/** Tippen im Textfeld einer Element-Aufnahme: der Text erscheint Zeile für Zeile hinter einem Cursor (p 0 → 1) */
export const Tippen: React.FC<{shot: string; p: number}> = ({shot, p}) => {
	const S = SHOTS[shot], f = S.feld, b = S.boxen.feld;
	if (!f || !b || p >= 1) return null;
	const bg = /rgba\(.*, 0\)|transparent/.test(f.bg) ? '#fbfbf9' : f.bg;
	const links = b[0] + f.links, breite = b[2] - f.links - 10, n = f.zeilen;
	const z = Math.min(n - 1, Math.floor(p * n)), q = p * n - z;
	return (
		<>
			{Array.from({length: n}, (_, i) => {
				const x = i < z ? Infinity : i === z ? links + q * breite : links;
				return x === Infinity ? null : <div key={i} style={{position: 'absolute', left: x, top: b[1] + f.oben + i * f.lh - 1, width: b[0] + b[2] - 3 - x, height: f.lh + 2, background: bg}} />;
			})}
			<div style={{position: 'absolute', left: links + q * breite, top: b[1] + f.oben + z * f.lh + f.lh * 0.15, width: 2, height: f.lh * 0.7, background: '#2446c8'}} />
		</>
	);
};

/** Gedanke oben im Bild (Texttafel im Textfeld des Formats). Quer ist das Textfeld schmaler (760 statt 912 px): Schrift im selben Verhältnis kleiner, damit die Zeilen gleich umbrechen. */
export const Gedanke: React.FC<{thema: Thema; start: number; zeilen: Teil[][]; aus?: number; markerAb?: number; groesse?: number}> = ({groesse = 76, ...rest}) => {
	const fmt = useFormat();
	return (
		<div style={{position: 'absolute', left: fmt.text.x, top: fmt.quer ? 300 : fmt.text.y, width: fmt.text.w, fontFamily: SCHRIFT}}>
			<Texttafel groesse={fmt.quer ? Math.round((groesse * fmt.text.w) / 912) : groesse} {...rest} />
		</div>
	);
};

/** Zettel mit Ein- und Ausblenden, Bühnenkoordinaten */
export const Notiz: React.FC<{text: string; bei: number; aus?: number; x: number; y: number; dreh?: number; groesse?: number}> = ({text, bei, aus, x, y, dreh = -3, groesse = 34}) => {
	const frame = useCurrentFrame();
	if (aus != null && frame >= aus + 10) return null;
	return <Zettel text={text} bei={bei} dreh={dreh} groesse={groesse} style={{left: x, top: y, ...(aus != null && frame >= aus ? {opacity: 1 - ab(frame, aus, 10)} : {})}} />;
};

/** Raus nach oben: Stil für Karten, die einer neuen Platz machen */
export const useRaus = (bei: number): React.CSSProperties => {
	const p = ab(useCurrentFrame(), bei, 14, Easing.in(Easing.quad));
	return p > 0 ? {translate: `0 ${-160 * p}px`, opacity: 1 - p, scale: String(1 - 0.08 * p)} : {};
};


/** Chat in der App: Frage tippen, abschicken, „Antwort kommt …“, Antwort schreibt sich. name = „lang/chat“ usw. (Aufnahmen _tippen, _wartet, _antwort).
 zweite: danach eine weitere Frage samt Antwort aus einer zweiten Aufnahme, deren oberer Teil gleich aussieht. */
export type Chat = {name: string; bei: number; tippen: [number, number]; senden: number; antwort: [number, number]; zweite?: {name: string; bei: number; antwort: [number, number]}};
export const ChatFolge: React.FC<Chat & {top: number; fenster: number}> = ({name, bei, tippen, senden, antwort, zweite, top, fenster}) => {
	const frame = useCurrentFrame();
	const T = `${name}_tippen`, W = `${name}_wartet`, A = `${name}_antwort`;
	const f = sicht(T, fenster), feld = SHOTS[T].boxen.feld;
	const unten = (shot: string) => bisUnten(shot, fenster);
	const sT = Math.max(0, Math.min(unten(T), feld[1] + feld[3] + 70 - f));
	const sW = Math.max(sT, unten(W));
	const warten = senden + 12;
	const ende = (shot: string, start: number, [von, bis]: [number, number]) => {
		const a = SHOTS[shot].boxen.antwort, q = SHOTS[shot].boxen.frage;
		const zeile = interpolate(frame, [start, start + 1, von, bis], [q[1], q[1] + q[3] + 10, q[1] + q[3] + 10, a[1] + a[3] + 10], klemm);
		return {bis: zeile, scroll: Math.max(0, Math.min(unten(shot), zeile + 30 - f))};
	};
	let shot = T, scroll = sT, bis: number | undefined, einflug = bei;
	if (zweite && frame >= zweite.bei) {
		const e = ende(zweite.name, zweite.bei, zweite.antwort);
		shot = zweite.name; bis = e.bis; scroll = Math.max(unten(A), e.scroll); einflug = -99;
	} else if (frame >= antwort[0]) {
		const e = ende(A, antwort[0] - 2, antwort);
		shot = A; bis = e.bis; scroll = Math.max(sW, e.scroll); einflug = -99;
	} else if (frame >= warten) {
		shot = W; scroll = interpolate(frame, [warten, warten + 20], [sT, sW], {...klemm, easing: weich}); einflug = -99;
	}
	return (
		<Bild shot={shot} top={top} fenster={fenster} scroll={scroll} bis={bis} bei={einflug}>
			{shot === T && <Tippen shot={T} p={interpolate(frame, tippen, [0, 1], klemm)} />}
			{shot === T && <Tipp x={64} y={feld[1] + feld[3] + 36} bei={senden} />}
		</Bild>
	);
};
/** Töne dazu: Tastenticks beim Tippen, Klick beim Abschicken, Pop bei der Antwort */
export const chatTon = (c: Chat): Cue[] => [
	[c.bei + 2, 'pop'], ...Array.from({length: Math.floor((c.tippen[1] - c.tippen[0]) / 7)}, (_, i) => [c.tippen[0] + i * 7, 'tick'] as Cue), [c.senden, 'click'], [c.antwort[0], 'pop'],
	...(c.zweite ? [[c.zweite.bei, 'pop'] as Cue, [c.zweite.antwort[0], 'pop'] as Cue] : []),
];
