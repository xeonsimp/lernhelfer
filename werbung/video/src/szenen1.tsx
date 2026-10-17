// Szenen 1–4: Hook, Wende, Kernversprechen, Lernen
import React from 'react';
import {Easing, interpolate, random, useCurrentFrame, useVideoConfig, spring} from 'remotion';
import {
	ab, Ausschnitt, Beispieldaten, BLAU, Buehne, FACH, FARBE, Haken, Handy, kasten, klemm, Papier, Rahmen, rau, Seite, SHOTS, Striche, Tablet, Texttafel, Thema, Tipp,
	useBuehne, useEinflug, useFormat, Wortmarke, zaehle, Zettel,
} from './lib';
import type {Cue} from './ton';

// ---------- Dateisymbole ----------
const ARTEN = [['PDF', FACH.englisch], ['PPTX', FACH.vwl], ['PDF', FACH.englisch], ['DOCX', BLAU], ['ZIP', FACH.mathe], ['PDF', FACH.englisch], ['PPTX', FACH.vwl]] as const;
export const DW = 150, DH = 186;
const ECKE = 38;
export const Datei: React.FC<{i: number; thema: Thema}> = ({i, thema}) => {
	const c = FARBE[thema];
	const [art, farbe] = ARTEN[i % ARTEN.length];
	const pfade = rau(`datei${i % 5}`, (g) => g.path(`M2 2H${DW - ECKE}L${DW - 2} ${ECKE}V${DH - 2}H2ZM${DW - ECKE} 2V${ECKE}H${DW - 2}`, {seed: (i % 5) + 2, roughness: 1.1, bowing: 0.8}));
	return (
		<div style={{position: 'relative', width: DW, height: DH}}>
			<div style={{position: 'absolute', inset: 0, background: thema === 'hell' ? '#fffefa' : c.bg2, clipPath: `polygon(0 0, ${DW - ECKE}px 0, 100% ${ECKE}px, 100% 100%, 0 100%)`}} />
			{[46, 64, 82].map((y, k) => <div key={k} style={{position: 'absolute', left: 22, top: y, width: k === 2 ? 60 : 96, height: 6, borderRadius: 3, background: c.tinte, opacity: 0.18}} />)}
			<div style={{position: 'absolute', left: 18, top: 112, padding: '4px 10px', background: farbe, color: '#fff', fontSize: 30, fontWeight: 800, letterSpacing: '0.02em', borderRadius: 4}}>{art}</div>
			<Striche pfade={pfade} progress={1} farbe={c.tinte} breite={3.2} />
		</div>
	);
};

// Der Stapel: Bühnenkoordinaten, spätere Dateien liegen weiter oben
const N = 37;
export const DATEIEN = Array.from({length: N}, (_, i) => {
	const x = 40 + random(`x${i}`) * 730;
	const mitte = Math.max(0, 1 - Math.abs(x + DW / 2 - 480) / 520);
	return {x, y: 990 - DH - 10 - (i / N) * 420 * (0.3 + 0.7 * mitte) - random(`y${i}`) * 36, dreh: (random(`r${i}`) - 0.5) * 70, start: 36 + i * 3.2};
});
export const LANDUNG = 18; // Frames bis zur Landung

// ---------- 1 Hook ----------
const HOOK = {z1: 10, z2: 56, z3: 102};
export const hookTon: Cue[] = [[HOOK.z1, 'scratch'], [HOOK.z2, 'scratch'], [HOOK.z3, 'scratch'], ...DATEIEN.filter((_, i) => i % 3 === 0).map((d) => [Math.round(d.start + LANDUNG), 'tick'] as Cue)];
export const Hook: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const fmt = useFormat();
	const gelandet = DATEIEN.filter((d) => frame >= d.start + LANDUNG).length;
	const fertig = Math.round(DATEIEN[N - 1].start + LANDUNG + 6);
	return (
		<Papier thema="dunkel">
			<Buehne>
				{DATEIEN.map((d, i) => {
					if (frame < d.start) return null;
					const p = spring({frame: frame - d.start, fps, config: {damping: 9, mass: 0.7, stiffness: 120}});
					return (
						<div key={i} style={{position: 'absolute', left: d.x, top: interpolate(p, [0, 1], [-1500, d.y]), rotate: `${d.dreh * p}deg`}}>
							<Datei i={i} thema="dunkel" />
						</div>
					);
				})}
			</Buehne>
			<div style={{position: 'absolute', left: fmt.text.x, top: fmt.quer ? 300 : fmt.text.y, width: fmt.text.w}}>
				<Texttafel thema="dunkel" start={HOOK.z1} zeilen={[['Sonntagabend.']]} />
				<Texttafel thema="dunkel" start={HOOK.z2} zeilen={[['4 Fächer.']]} />
				<Texttafel thema="dunkel" start={HOOK.z3} markerAb={fertig} zeilen={[[{m: `${gelandet} Dateien`}, ' in OLAT.']]} />
			</div>
		</Papier>
	);
};

// ---------- 2 Wende ----------
const WENDE = {rahmen: 6, sog: 10, schrift: 36, text: 104, marker: 140};
export const wendeTon: Cue[] = [[WENDE.sog, 'swoosh'], [WENDE.rahmen + 2, 'scratch'], [WENDE.schrift + 2, 'scratch'], [WENDE.schrift + 30, 'scratch'], [WENDE.marker, 'scratch']];
export const Wende: React.FC = () => {
	const frame = useCurrentFrame();
	const fmt = useFormat();
	const {k, x0, y0} = useBuehne();
	const c = FARBE.hell;
	const rw = fmt.quer ? 900 : 820, rh = fmt.quer ? 270 : 250;
	const mx = fmt.W / 2, my = fmt.quer ? 400 : 760;
	// Rahmenmitte in Bühnenkoordinaten: Ziel für den Sog
	const zx = (mx - x0) / k - DW / 2, zy = (my - y0) / k - DH / 2;
	return (
		<Papier thema="hell">
			<Buehne>
				{DATEIEN.map((d, i) => {
					const p = interpolate(frame, [WENDE.sog + i * 0.7, WENDE.sog + i * 0.7 + 20], [0, 1], {...klemm, easing: Easing.in(Easing.cubic)});
					if (p >= 1) return null;
					return (
						<div key={i} style={{position: 'absolute', left: interpolate(p, [0, 1], [d.x, zx]), top: interpolate(p, [0, 1], [d.y, zy]), rotate: `${d.dreh * (1 - p) + 200 * p}deg`, scale: String(1 - 0.85 * p), opacity: 1 - p * p}}>
							<Datei i={i} thema="hell" />
						</div>
					);
				})}
			</Buehne>
			<div style={{position: 'absolute', left: mx - rw / 2, top: my - rh / 2, width: rw, height: rh}}>
				<Rahmen w={rw} h={rh} seed={11} breite={4} farbe={c.tinte} progress={ab(frame, WENDE.rahmen, 26, Easing.inOut(Easing.quad))} />
				<div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center'}}>
					<Wortmarke breite={rw * 0.8} farbe={c.tinte} progress={ab(frame, WENDE.schrift, 60, Easing.linear)} />
				</div>
			</div>
			<div style={{position: 'absolute', left: fmt.quer ? 260 : fmt.text.x, width: fmt.quer ? 1400 : fmt.text.w, top: my + rh / 2 + (fmt.quer ? 90 : 110), textAlign: 'center'}}>
				<Texttafel
					thema="hell"
					start={WENDE.text}
					markerAb={WENDE.marker}
					zeilen={fmt.quer ? [['Jede Woche ', {m: 'das Wichtigste'}], ['aus OLAT.']] : [['Jede Woche'], [{m: 'das Wichtigste'}], ['aus OLAT.']]}
				/>
			</div>
		</Papier>
	);
};

// ---------- 3 Kern: Handy (9:16) bzw. Tablet (16:9) mit „Heute“ und der Wochenausgabe ----------
const KERN = {rein: 6, textA: 14, markerA: 44, zoom: 64, tipp1: 104, ab: 140, zurueck: 172, textB: 186, markerB: 220, tipp2: 228, aus: 238, stopps: [266, 332, 398, 464]};
const FAHRT = 24; // Frames für das Scrollen zum nächsten Abschnitt
export const kernTon: Cue[] = [
	[KERN.rein, 'swoosh'], [KERN.markerA, 'scratch'], [KERN.tipp1, 'click'], [KERN.tipp1 + 4, 'ding'], [KERN.tipp2, 'click'], [KERN.markerB, 'scratch'], [KERN.aus, 'swoosh'],
	...KERN.stopps.map((f) => [f, 'pop'] as Cue),
];
const STOPPS = [['blick', 'Auf einen Blick'], ['zusammenfassung', 'Zusammenfassung'], ['ps', 'Nächstes PS'], ['lexikon', 'Lexikon']] as const;
export const Kern: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const fmt = useFormat();
	const tablet = fmt.quer;
	const g = tablet ? 'd' : 'm';
	const heute = `${g}_hell_heute`, heuteAb = `${g}_hell_heute_ab`, ausgabe = `${g}_hell_ausgabe`;
	const vw = tablet ? 1440 : 390, vh = tablet ? 900 : 844;
	// Gerät in Bühnenkoordinaten
	const breite = tablet ? 880 : 470;
	const rand = Math.round(breite * (tablet ? 0.03 : 0.045));
	const screenW = breite - 2 * rand;
	const s = screenW / vw;
	const H = Math.round((screenW * vh) / vw) + 2 * rand;
	const gx = (960 - breite) / 2, gy = (990 - H) / 2;
	const ziel = (shot: string, box: string, anteil: number) => {
		const b = kasten(shot, box);
		return Math.max(0, Math.min(SHOTS[shot].h - vh, b.y - anteil * vh));
	};
	// Scrollen: Heute bis zum Fach, dann die Ausgabe Abschnitt für Abschnitt
	const scrollHeute = interpolate(frame, [KERN.zurueck, KERN.zurueck + 30], [0, ziel(heute, 'mathe', 0.3)], {...klemm, easing: Easing.inOut(Easing.cubic)});
	const st = KERN.stopps;
	const zA = STOPPS.map(([b]) => (b === 'blick' ? 0 : ziel(ausgabe, b, tablet ? 0.12 : 0.06)));
	const scrollAusgabe = interpolate(frame, [st[0], st[1] - FAHRT, st[1], st[2] - FAHRT, st[2], st[3] - FAHRT, st[3]], [zA[0], zA[0], zA[1], zA[1], zA[2], zA[2], zA[3]], {...klemm, easing: Easing.inOut(Easing.cubic)});
	const rein = ab(frame, KERN.aus, 18, Easing.out(Easing.cubic));
	// Kamera: Zoom auf Fristen, für das Tablet zusätzlich auf jeden Abschnitt
	const punkt = (shot: string, box: string, scroll: number) => {
		const b = kasten(shot, box);
		return [gx + rand + (b.x + b.w / 2) * s, gy + rand + (b.y + Math.min(b.h, vh * 0.5) / 2 - scroll) * s];
	};
	const mitte: [number, number] = [480, 495];
	const fr = punkt(heute, 'fristen', 0);
	const stoppNr = st.filter((f) => frame >= f - FAHRT).length - 1;
	const zielPunkt = stoppNr >= 0 ? punkt(ausgabe, STOPPS[stoppNr][0], zA[stoppNr]) : mitte;
	const zoom = frame < KERN.aus
		? interpolate(frame, [KERN.zoom, KERN.zoom + 30, KERN.zurueck, KERN.zurueck + 30], [1, tablet ? 1.45 : 1.32, tablet ? 1.45 : 1.32, 1], {...klemm, easing: Easing.inOut(Easing.cubic)})
		: tablet ? interpolate(frame, [st[0] - 6, st[0] + 14], [1, 1.25], {...klemm, easing: Easing.inOut(Easing.cubic)}) : 1;
	const fokusA = frame < KERN.aus ? fr : zielPunkt;
	const fokusMix = frame < KERN.aus ? interpolate(frame, [KERN.zoom, KERN.zoom + 30, KERN.zurueck, KERN.zurueck + 30], [0, 1, 1, 0], klemm) : tablet ? 1 : 0;
	// sanft zum nächsten Stopp gleiten
	const vorher = stoppNr > 0 ? punkt(ausgabe, STOPPS[stoppNr - 1][0], zA[stoppNr - 1]) : mitte;
	const gleit = stoppNr > 0 ? ab(frame, st[stoppNr] - FAHRT, FAHRT, Easing.inOut(Easing.cubic)) : 1;
	const fx0 = frame < KERN.aus ? fokusA[0] : vorher[0] + (zielPunkt[0] - vorher[0]) * gleit;
	const fy0 = frame < KERN.aus ? fokusA[1] : vorher[1] + (zielPunkt[1] - vorher[1]) * gleit;
	const fx = mitte[0] + (fx0 - mitte[0]) * fokusMix, fy = mitte[1] + (fy0 - mitte[1]) * fokusMix;
	const flug = spring({frame: frame - KERN.rein, fps, config: {damping: 13, mass: 0.9, stiffness: 110}});
	const haken = kasten(heute, 'haken1'), mathe = kasten(heute, 'mathe');
	const bildschirm = ({w}: {w: number; h: number}) => (
		<>
			<Seite shot={heute} breite={w} scroll={scrollHeute}>
				<Tipp x={haken.x + haken.w / 2} y={haken.y + haken.h / 2} bei={KERN.tipp1} />
				<Haken groesse={haken.w + 4} progress={ab(frame, KERN.tipp1, 12)} farbe={BLAU} style={{left: haken.x - 2, top: haken.y + 1}} />
				<Tipp x={mathe.x + mathe.w / 2} y={mathe.y + mathe.h / 2} bei={KERN.tipp2} />
			</Seite>
			<Seite shot={heuteAb} breite={w} scroll={scrollHeute} style={{opacity: ab(frame, KERN.ab, 10)}} />
			<div style={{position: 'absolute', inset: 0, translate: `${(1 - rein) * 105}% 0`, boxShadow: '-20px 0 40px rgba(0,0,0,0.12)', opacity: frame < KERN.aus ? 0 : 1}}>
				<Seite shot={ausgabe} breite={w} scroll={scrollAusgabe} />
			</div>
		</>
	);
	return (
		<Papier thema="dunkel">
			<Buehne>
				{/* 16:9: die Kamera bleibt rechts, damit das Tablet nie über den Text fährt */}
				<div style={{position: 'absolute', left: tablet ? -30 : -400, top: -400, right: tablet ? -60 : -400, bottom: -400, overflow: tablet ? 'hidden' : 'visible', WebkitMaskImage: tablet ? 'linear-gradient(to right, transparent 0, #000 160px)' : undefined}}>
				<div style={{position: 'absolute', left: tablet ? 30 : 400, top: 400, width: 960, height: 990, transformOrigin: '0 0', translate: `${mitte[0] - fx * zoom}px ${mitte[1] - fy * zoom}px`, scale: String(zoom)}}>
					<div style={{position: 'absolute', left: gx, top: gy, translate: `0 ${(1 - flug) * 900}px`, rotate: `${(1 - flug) * 8}deg`}}>
						{tablet ? <Tablet breite={breite} thema="dunkel" zeichnen={1}>{bildschirm}</Tablet> : <Handy breite={breite} thema="dunkel" tabs="m_hell_tabs">{bildschirm}</Handy>}
					</div>
				</div>
				</div>
				<Beispieldaten thema="dunkel" style={{right: tablet ? 20 : 0, top: 952, padding: '4px 12px', borderRadius: 6, background: FARBE.dunkel.bg, whiteSpace: 'nowrap'}} />
				{STOPPS.map(([, text], i) => (
					<Zettel key={i} text={text} bei={st[i]} dreh={i % 2 ? 3 : -3}
						style={{left: tablet ? 40 : i % 2 ? 600 : 10, top: tablet ? 820 : 230 + i * 40, opacity: frame >= (st[i + 1] ?? Infinity) - FAHRT ? 0 : undefined}} />
				))}
			</Buehne>
			<div style={{position: 'absolute', left: fmt.text.x, top: fmt.quer ? 330 : fmt.text.y, width: fmt.text.w}}>
				<Texttafel thema="dunkel" start={KERN.textA} markerAb={KERN.markerA} aus={KERN.zurueck} zeilen={[['Dein PC holt ', {m: 'alles'}], ['aus OLAT.']]} />
			</div>
			<div style={{position: 'absolute', left: fmt.text.x, top: fmt.quer ? 330 : fmt.text.y, width: fmt.text.w}}>
				<Texttafel thema="dunkel" start={KERN.textB} markerAb={KERN.markerB} zeilen={fmt.quer ? [['Du bekommst'], [{m: 'die Woche'}, ' pro Fach.']] : [['Du bekommst ', {m: 'die Woche'}], ['pro Fach.']]} />
			</div>
		</Papier>
	);
};

// ---------- 4 Lernen: drei schnelle Karten ----------
const LERN = {a: 10, tipp: 50, auf: 56, aRaus: 128, b: 132, flip: 184, bRaus: 268, c: 272, kurve: 290, zahl: 318, marker: 336, zettel: 352};
export const lernenTon: Cue[] = [
	[LERN.a + 2, 'pop'], [LERN.tipp, 'click'], [LERN.b + 2, 'pop'], [LERN.flip, 'swoosh'], [LERN.c + 2, 'pop'], [LERN.kurve, 'scratch'],
	...Array.from({length: 8}, (_, i) => [LERN.zahl + i * 4, 'tick'] as Cue), [LERN.zettel, 'pop'], [LERN.marker, 'scratch'],
];
const KW = 820; // Kartenbreite auf der Bühne
const weichAus = Easing.bezier(0.2, 0.9, 0.3, 1);
const Karte: React.FC<{children: React.ReactNode; style?: React.CSSProperties; h: number; seed: number}> = ({children, style, h, seed}) => (
	<div style={{position: 'absolute', left: (960 - KW) / 2, width: KW, height: h, background: '#fffefa', boxShadow: '0 2px 4px rgba(18,18,18,0.08), 0 30px 60px -28px rgba(18,18,18,0.45)', ...style}}>
		<div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>{children}</div>
		<Rahmen w={KW} h={h} seed={seed} farbe="#121212" progress={1} breite={3} />
	</div>
);
export const Lernen: React.FC = () => {
	const frame = useCurrentFrame();
	const fmt = useFormat();
	const zu = kasten('m_hell_ausgabe', 'aufgabe1'), auf = kasten('m_hell_ausgabe_auf', 'aufgabe1');
	const kA = KW / zu.w;
	const hA = interpolate(frame, [LERN.auf, LERN.auf + 18], [zu.h * kA, auf.h * kA], {...klemm, easing: weichAus});
	const a = useEinflug(LERN.a), b = useEinflug(LERN.b), c = useEinflug(LERN.c), d = useEinflug(LERN.zahl - 8);
	const raus = (bei: number): React.CSSProperties => {
		const p = ab(frame, bei, 14, Easing.in(Easing.quad));
		return p > 0 ? {translate: `0 ${-160 * p}px`, opacity: 1 - p, scale: String(1 - 0.1 * p)} : {};
	};
	const karte = kasten('m_hell_karten', 'karte');
	const hB = karte.h * (KW / karte.w);
	const winkel = interpolate(frame, [LERN.flip, LERN.flip + 30], [0, 180], {...klemm, easing: Easing.inOut(Easing.cubic)});
	const dia = kasten('m_hell_noten', 'diagramm');
	const hC = dia.h * (KW / dia.w);
	const kurve = ab(frame, LERN.kurve, 36, Easing.inOut(Easing.quad));
	return (
		<Papier thema="hell">
			<Buehne>
				{frame < LERN.aRaus + 16 && (
					<Karte h={hA} seed={21} style={{top: 120, ...a.style, ...raus(LERN.aRaus)}}>
						<Ausschnitt shot={frame < LERN.auf ? 'm_hell_ausgabe' : 'm_hell_ausgabe_auf'} {...(frame < LERN.auf ? zu : auf)} breite={KW} />
						<Tipp x={94 * kA} y={139 * kA} bei={LERN.tipp} />
					</Karte>
				)}
				{frame >= LERN.b - 2 && frame < LERN.bRaus + 16 && (
					<div style={{position: 'absolute', inset: 0, perspective: 2400, ...b.style, ...raus(LERN.bRaus)}}>
						<Karte h={hB} seed={23} style={{top: 200, rotate: `y ${winkel <= 90 ? winkel : winkel - 180}deg`}}>
							<Ausschnitt shot={winkel <= 90 ? 'm_hell_karten' : 'm_hell_karten_h'} {...karte} breite={KW} />
						</Karte>
					</div>
				)}
				{frame >= LERN.c - 2 && (
					<>
						<Karte h={hC} seed={25} style={{top: 90, ...c.style}}>
							<div style={{clipPath: `inset(0 ${(1 - kurve) * 100}% 0 0)`}}>
								<Ausschnitt shot="m_hell_noten" {...dia} breite={KW} />
							</div>
						</Karte>
						<div style={{position: 'absolute', left: 70, top: 90 + hC + 50, width: 520, height: 210, ...d.style}}>
							<Rahmen w={520} h={210} seed={27} farbe="#121212" progress={1} />
							<div style={{position: 'absolute', left: 34, top: 26, fontSize: 32, fontWeight: 600, color: FARBE.hell.text2}}>Punkte insgesamt</div>
							<div style={{position: 'absolute', left: 34, top: 70, fontSize: 104, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em'}}>{zaehle(frame, 0, 79, LERN.zahl, 30)} %</div>
						</div>
						<Zettel text="Prognose: 2" bei={LERN.zettel} dreh={4} groesse={44} style={{left: 610, top: 90 + hC + 110}} />
					</>
				)}
				<Beispieldaten thema="hell" style={{left: 0, right: 0, textAlign: 'center', top: 970}} />
			</Buehne>
			<div style={{position: 'absolute', left: fmt.text.x, top: fmt.quer ? 330 : fmt.text.y, width: fmt.text.w}}>
				<Texttafel thema="hell" start={0} markerAb={LERN.marker}
					zeilen={[[{t: 'Üben. ', bei: LERN.a}, {t: 'Abfragen.', bei: LERN.b}], [{t: 'Wissen, ', bei: LERN.c}, {m: 'wo du stehst.', bei: LERN.c + 4}]]} />
			</div>
		</Papier>
	);
};
