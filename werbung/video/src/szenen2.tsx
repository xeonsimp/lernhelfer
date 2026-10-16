// Szenen 5–8: Vortrag, Podcast, Prüfung, Call to Action
import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Circle, Highlight} from '@remotion/rough-notation';
import {ab, Beispieldaten, BLAU, Buehne, FACH, FARBE, GELB, klemm, Papier, Rahmen, rau, rundesRechteck, streck, Striche, Texttafel, type Thema, useEinflug, useFormat, Wortmarke, zaehle} from './lib';
import type {Cue} from './ton';

const D = FARBE.dunkel, L = FARBE.hell;

// ---------- 5 Vortrag ----------
const ZEILEN0: {t: string; vor: string; aeh?: string; nach?: string; bei: number}[] = [
	{t: '0:00', vor: 'Good morning everyone. Today I want to pitch an idea for a student café.', bei: 40},
	{t: '0:06', vor: '', aeh: 'Uh,', nach: ' first of all, let me show you why we need it.', bei: 76},
	{t: '0:12', vor: 'At ten o’clock the line is, ', aeh: 'um,', nach: ' very long.', bei: 112},
	{t: '0:37', vor: 'So, ', aeh: 'uh,', nach: ' our break-even is at about eighty cups a day.', bei: 150},
	{t: '0:45', vor: '', aeh: 'Uh,', nach: ' the menu would be simple: coffee, tea and sandwiches.', bei: 188},
];
const VT0 = {rahmen: 6, textA: 10, textAaus: 232, textB: 244, befund: 250, kreis: 268, ger: 400, pfeil: 424, c1: 446};
/** Zeitpunkte bei diesem Tempo (das lange Reel lässt mehr Zeit zum Lesen) */
const zeiten = (tempo: number) => {
	const ZEILEN = streck(ZEILEN0, tempo), VT = streck(VT0, tempo);
	return {ZEILEN, VT, AEH: ZEILEN.filter((z) => z.aeh).map((z) => z.bei + 10)};
};
export const vortragTon = (tempo = 1): Cue[] => {
	const {VT, AEH} = zeiten(tempo);
	return [[VT.rahmen, 'scratch'], ...AEH.map((f) => [f, 'tick'] as Cue), [VT.befund, 'pop'], [VT.kreis, 'scratch'], [VT.ger + 10, 'ding'], [VT.pfeil, 'scratch'], [VT.c1, 'pop']];
};
const ZH = 96; // Höhe einer Transkriptzeile

const Vorschau: React.FC<{frame: number; D: typeof FARBE.dunkel}> = ({frame, D}) => {
	const sek = Math.min(64, Math.max(0, (frame - 20) * 0.13));
	const spiel = ab(frame, VT0.rahmen, 26);
	return (
		<div style={{position: 'absolute', left: 70, top: 10, width: 820, height: 280, background: D.bg2, opacity: Math.min(1, spiel * 2)}}>
			<div style={{position: 'absolute', left: 36, top: 30, width: 380, height: 200, background: '#fbfbf9', rotate: '-1deg'}}>
				<div style={{position: 'absolute', left: 24, top: 18, fontSize: 30, fontWeight: 800, color: '#121212'}}>Student café</div>
				{[70, 110, 150].map((h, i) => <div key={i} style={{position: 'absolute', left: 40 + i * 70, bottom: 22, width: 46, height: h * ab(frame, 30 + i * 6, 20), background: [FACH.mathe, FACH.vwl, BLAU][i]}} />)}
				<div style={{position: 'absolute', left: 250, top: 80, width: 100, height: 6, borderRadius: 3, background: '#121212', opacity: 0.25}} />
				<div style={{position: 'absolute', left: 250, top: 100, width: 80, height: 6, borderRadius: 3, background: '#121212', opacity: 0.25}} />
			</div>
			{Array.from({length: 26}, (_, i) => {
				const a = Math.abs(Math.sin(i * 0.9 + frame * 0.21) * Math.sin(i * 0.37 + frame * 0.07));
				return <div key={i} style={{position: 'absolute', left: 452 + i * 13, top: 120 - (12 + a * 90) / 2, width: 7, height: 12 + a * 90, borderRadius: 4, background: D.tinte, opacity: 0.75 * spiel}} />;
			})}
			<svg style={{position: 'absolute', left: 36, top: 238}} width={24} height={26}><path d="M3 2L22 13L3 24Z" fill={D.tinte} /></svg>
			<div style={{position: 'absolute', left: 76, top: 249, width: 560, height: 4, background: D.tinte, opacity: 0.25}} />
			<div style={{position: 'absolute', left: 76, top: 249, width: (560 * sek) / 64, height: 4, background: D.akzent}} />
			<div style={{position: 'absolute', left: 656, top: 233, fontSize: 26, fontWeight: 650, color: D.text2, fontVariantNumeric: 'tabular-nums'}}>
				{Math.floor(sek / 60)}:{String(Math.floor(sek % 60)).padStart(2, '0')} / 1:04
			</div>
			<Rahmen w={820} h={280} seed={31} farbe={D.tinte} progress={spiel} />
		</div>
	);
};

/** thema: im kurzen Spot dunkel, im langen Reel hell (dort sind alle Szenen hell); tempo streckt die Zeitpunkte */
export const Vortrag: React.FC<{thema?: Thema; tempo?: number}> = ({thema = 'dunkel', tempo = 1}) => {
	const {ZEILEN, VT, AEH} = zeiten(tempo);
	const D = FARBE[thema], hell = thema === 'hell';
	const gelb = hell ? BLAU : GELB; // Striche und Kreise: Gelb ist auf Papier zu blass
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const fmt = useFormat();
	const n = ZEILEN.filter((z) => frame >= z.bei).length;
	const schieben = interpolate(frame, [ZEILEN[4].bei, ZEILEN[4].bei + 14], [0, ZH + 8], {...klemm, easing: Easing.inOut(Easing.cubic)});
	const aeh = AEH.filter((f) => frame >= f).length;
	const befund = useEinflug(VT.befund, [0, 200]);
	const ger = spring({frame: frame - VT.ger, fps, config: {damping: 10, mass: 0.7}});
	const c1 = spring({frame: frame - VT.c1, fps, config: {damping: 11, mass: 0.7}});
	const pfeil = rau('pfeil', (g) => g.path('M10 40C60 4 120 4 168 34M146 18L170 36L144 48', {seed: 4, roughness: 1, bowing: 1}));
	const zaehlerPop = spring({frame: frame - (AEH[aeh - 1] ?? -99), fps, config: {damping: 9, mass: 0.4}});
	return (
		<Papier thema={thema}>
			<Buehne>
				<Vorschau frame={frame / tempo} D={D} />
				<div style={{position: 'absolute', left: 70, top: 400, width: 820, height: 400, overflow: 'hidden', opacity: interpolate(frame, [VT.befund, VT.befund + 12], [1, 0.12], klemm)}}>
					<div style={{translate: `0 ${-schieben}px`}}>
						{ZEILEN.map((z, i) => {
							const p = spring({frame: frame - z.bei, fps, config: {damping: 14, mass: 0.6}});
							return (
								<div key={i} style={{display: 'flex', gap: 18, height: ZH, marginBottom: 8, fontSize: 31, lineHeight: 1.3, opacity: Math.min(1, p * 1.5), translate: `0 ${(1 - p) * 30}px`}}>
									<span style={{flex: 'none', height: 'fit-content', padding: '2px 10px', border: `2px solid ${D.akzent}`, borderRadius: 6, color: D.akzent, fontWeight: 700, fontVariantNumeric: 'tabular-nums'}}>{z.t}</span>
									<span>
										{z.vor}
										{z.aeh && (
											<Highlight progress={ab(frame, z.bei + 10, 8)} color={GELB} seed={i + 3} padding={{left: 4, right: 4, top: 0, bottom: 0}} name="äh">
												<span style={{color: frame >= z.bei + 12 ? '#121212' : D.tinte, fontWeight: 700}}>{z.aeh}</span>
											</Highlight>
										)}
										{z.nach}
									</span>
								</div>
							);
						})}
					</div>
				</div>
				{n > 1 && (
					<div style={{position: 'absolute', left: 70, top: 314, width: 820, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
						<span style={{fontSize: 30, fontWeight: 700, color: D.text2}}>Transkript, Wort für Wort</span>
						<span style={{display: 'flex', alignItems: 'center', gap: 14, fontSize: 30, fontWeight: 700, color: D.text2}}>
							äh-Laute
							<span style={{minWidth: 64, textAlign: 'center', fontSize: 54, fontWeight: 800, color: '#121212', background: GELB, borderRadius: 6, scale: String(0.85 + 0.15 * zaehlerPop), fontVariantNumeric: 'tabular-nums'}}>{aeh}</span>
						</span>
					</div>
				)}
				{frame >= VT.befund - 2 && (
					<div style={{position: 'absolute', left: 70, top: 420, width: 820, height: 310, background: D.bg, ...befund.style}}>
						<Rahmen w={820} h={310} seed={35} farbe={D.tinte} progress={1} />
						<div style={{position: 'absolute', left: 32, top: 28, display: 'flex', alignItems: 'center', gap: 18}}>
							<Circle progress={ab(frame, VT.kreis, 14)} color={gelb} seed={5} strokeWidth={4} padding={{left: 14, right: 14, top: 10, bottom: 10}} name="Zeitstempel">
								<span style={{display: 'inline-block', padding: '4px 14px', border: `2px solid ${D.text2}`, borderRadius: 8, fontSize: 32, fontWeight: 750, fontVariantNumeric: 'tabular-nums'}}>0:37</span>
							</Circle>
							<span style={{fontSize: 28, color: D.text2, fontWeight: 650}}><span style={{color: '#cf9fb3'}}>●</span> Füllwörter</span>
						</div>
						<div style={{position: 'absolute', left: 32, right: 32, top: 102, fontSize: 32, lineHeight: 1.3}}>
							<div style={{fontWeight: 650}}>„So, uh, our break-even is at about eighty cups a day.“</div>
							<div style={{marginTop: 12, color: D.text2, fontSize: 29}}>Füllwort direkt vor der wichtigsten Zahl schwächt sie.</div>
							<div style={{marginTop: 12, fontSize: 29}}><b style={{color: hell ? '#2f7a4a' : '#9cc3a8'}}>Besser:</b> Our break-even is at about eighty cups a day.</div>
						</div>
					</div>
				)}
				{frame >= VT.ger - 4 && (
					<div style={{position: 'absolute', left: 70, top: 752, width: 820, height: 220}}>
						<div style={{fontSize: 32, fontWeight: 750, opacity: Math.min(1, ger * 1.5)}}>Sprachniveau nach GER</div>
						<div style={{position: 'absolute', left: 0, top: 58, width: 150, height: 150, borderRadius: '10px 16px 12px 18px / 16px 10px 18px 12px', background: D.bg2, display: 'grid', placeItems: 'center', fontSize: 76, fontWeight: 800, color: D.akzent, scale: String(ger), rotate: `${(1 - ger) * -20}deg`}}>
							B2
							<Rahmen w={150} h={150} seed={37} farbe={D.akzent} progress={1} />
						</div>
						<div style={{position: 'absolute', left: 168, top: 92}}><Striche pfade={pfeil} progress={ab(frame, VT.pfeil, 16)} farbe={gelb} breite={5} /></div>
						<div style={{position: 'absolute', left: 360, top: 58, width: 150, height: 150, display: 'grid', placeItems: 'center', fontSize: 76, fontWeight: 800, color: hell ? '#121212' : GELB, background: hell ? GELB : undefined, borderRadius: hell ? '12px 16px 10px 18px / 16px 10px 18px 12px' : undefined, scale: String(c1), opacity: Math.min(1, c1 * 2)}}>
							C1
							<Rahmen w={150} h={150} seed={39} farbe={hell ? '#121212' : GELB} progress={ab(frame, VT.c1, 16)} breite={3.5} />
						</div>
						<div style={{position: 'absolute', left: 540, top: 70, width: 290, fontSize: 28, lineHeight: 1.3, color: D.text2, opacity: c1}}>
							<b style={{color: D.tinte}}>Für C1:</b> Zahlen ohne Suchpausen nennen.
						</div>
					</div>
				)}
				<Beispieldaten thema={thema} style={{left: 0, right: 0, textAlign: 'center', top: 975}} />
			</Buehne>
			<div style={{position: 'absolute', left: fmt.text.x, top: fmt.quer ? 330 : fmt.text.y, width: fmt.text.w}}>
				<Texttafel thema={thema} start={VT.textA} aus={VT.textAaus} zeilen={[['Vortrag hochladen.']]} />
			</div>
			<div style={{position: 'absolute', left: fmt.text.x, top: fmt.quer ? 330 : fmt.text.y, width: fmt.text.w}}>
				<Texttafel thema={thema} start={VT.textB} zeilen={fmt.quer ? [['Feedback mit'], [{m: 'Zeitstempel'}, ' und'], [{m: 'GER-Niveau.'}]] : [['Feedback mit'], [{m: 'Zeitstempel'}, ' und'], [{m: 'GER-Niveau.'}]]} />
			</div>
		</Papier>
	);
};

// ---------- 6 Podcast ----------
const POD = {textA: 10, hoerer: 14, welle: 50, textB: 64, marker: 96, lena: 112, max: 176, chip: 236};
export const podcastTon: Cue[] = [[POD.hoerer + 2, 'scratch'], [POD.marker, 'scratch'], [POD.lena, 'pop'], [POD.max, 'pop'], [POD.chip, 'pop']];
const Blase: React.FC<{wer: string; text: string; bei: number; links: boolean; style: React.CSSProperties; seed: number}> = ({wer, text, bei, links, style, seed}) => {
	const e = useEinflug(bei, [links ? -120 : 120, 40], 11);
	const w = 600, h = 200;
	const kontur = rau(`blase${seed}`, (g) =>
		g.path(rundesRechteck(0, 0, w, h, 26) + (links ? `M60 ${h}L40 ${h + 40}L110 ${h}` : `M${w - 60} ${h}L${w - 40} ${h + 40}L${w - 110} ${h}`), {seed, roughness: 0.9, bowing: 0.6}),
	);
	return (
		<div style={{position: 'absolute', width: w, height: h, ...style, ...e.style}}>
			<div style={{position: 'absolute', inset: 0, borderRadius: 26, background: links ? '#fffefa' : L.zettel}} />
			<Striche pfade={kontur} progress={1} farbe={L.tinte} breite={3} />
			<div style={{position: 'absolute', left: 32, top: 24, right: 32}}>
				<div style={{fontSize: 28, fontWeight: 750, color: links ? BLAU : '#121212'}}>{wer}</div>
				<div style={{fontSize: 34, fontWeight: 600, lineHeight: 1.25, marginTop: 8}}>{text}</div>
			</div>
		</div>
	);
};
export const Podcast: React.FC = () => {
	const frame = useCurrentFrame();
	const fmt = useFormat();
	const hoerer = rau('kopfhoerer', (g) =>
		g.path('M250 330C246 80 714 80 710 330M282 318C284 130 676 130 678 318' + rundesRechteck(196, 300, 110, 190, 40) + rundesRechteck(654, 300, 110, 190, 40), {seed: 8, roughness: 0.9, bowing: 0.5}),
	);
	const chip = useEinflug(POD.chip, [0, 60], 11);
	return (
		<Papier thema="hell">
			<Buehne>
				<div style={{position: 'absolute', left: 0, top: -40}}>
					<Striche pfade={hoerer} progress={ab(frame, POD.hoerer, 40, Easing.inOut(Easing.quad))} farbe={L.tinte} breite={6} />
					{Array.from({length: 22}, (_, i) => {
						const a = Math.abs(Math.sin(i * 0.8 + frame * 0.19) * Math.sin(i * 0.33 + frame * 0.06));
						const h = (14 + a * 120) * ab(frame, POD.welle + i, 12);
						return <div key={i} style={{position: 'absolute', left: 344 + i * 13, top: 395 - h / 2, width: 7, height: h, borderRadius: 4, background: i % 3 ? L.tinte : BLAU}} />;
					})}
				</div>
				<div style={{position: 'absolute', left: 0, right: 0, top: 6, display: 'flex', justifyContent: 'center'}}>
					<div style={{padding: '8px 20px', fontSize: 30, fontWeight: 700, border: `2.5px solid ${L.tinte}`, borderRadius: 8, background: L.bg, ...chip.style}}>Anhören · rund 10 Minuten</div>
				</div>
				<Blase wer="Lena fragt" text="„Was misst eine Ableitung eigentlich?“" bei={POD.lena} links style={{left: 40, top: 500}} seed={41} />
				<Blase wer="Max erklärt" text="„Wie schnell sich etwas ändert, etwa die Kosten pro Stück.“" bei={POD.max} links={false} style={{left: 320, top: 730}} seed={43} />
				<Beispieldaten thema="hell" style={{left: 0, right: 0, textAlign: 'center', top: 975}} />
			</Buehne>
			<div style={{position: 'absolute', left: fmt.text.x, top: fmt.quer ? 330 : fmt.text.y, width: fmt.text.w}}>
				<Texttafel thema="hell" start={POD.textA} zeilen={[['Keine Lust zu lesen?']]} groesse={fmt.quer ? 72 : 82} />
				<Texttafel thema="hell" start={POD.textB} markerAb={POD.marker} zeilen={[['Hör deine Ausgabe ', {m: 'im Bus.'}]]} groesse={fmt.quer ? 72 : 82} />
			</div>
		</Papier>
	);
};

// ---------- 7 Prüfung ----------
const PR = {text: 10, zahl: 16, blatt: 90, training: 170, marker: 196, chip: 236};
export const pruefungTon: Cue[] = [...Array.from({length: 13}, (_, i) => [PR.zahl + i * 3, 'tick'] as Cue), [PR.blatt + 2, 'pop'], [PR.training + 2, 'pop'], [PR.marker, 'scratch'], [PR.chip, 'pop']];
export const Pruefung: React.FC = () => {
	const frame = useCurrentFrame();
	const fmt = useFormat();
	const blatt = useEinflug(PR.blatt, [-80, 300]);
	const training = useEinflug(PR.training, [120, 200]);
	const chip = useEinflug(PR.chip, [0, 50], 10);
	const sek = 3600 - Math.max(0, Math.floor((frame - PR.blatt - 10) / 6));
	const aufgaben = ['Leite f(x) = 3x⁴ − 2x² + 7 ab.', 'Grenzkosten bei x = 30?', 'Wann ist K(x) minimal?'];
	return (
		<Papier thema="dunkel">
			<Buehne>
				<div style={{position: 'absolute', left: 70, top: 0, display: 'flex', alignItems: 'baseline', gap: 26}}>
					<div style={{fontSize: 210, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{zaehle(frame, 42, 30, PR.zahl, 40)}</div>
					<div style={{fontSize: 38, fontWeight: 700, lineHeight: 1.2}}>
						Tage bis zum
						<br />
						Zwischentest <span style={{fontSize: 28, padding: '2px 10px', borderRadius: 6, background: '#ccab78', color: '#151515', verticalAlign: 'middle'}}>VWL</span>
					</div>
				</div>
				<div style={{position: 'absolute', left: 70, top: 270, width: 580, height: 600, background: '#fffefa', color: '#121212', rotate: '-2.5deg', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.8)', ...blatt.style}}>
					<Rahmen w={580} h={600} seed={51} farbe="#121212" progress={1} />
					<div style={{position: 'absolute', left: 36, top: 32, fontSize: 36, fontWeight: 800}}>Probeklausur</div>
					<div style={{position: 'absolute', left: 36, top: 80, fontSize: 26, fontWeight: 600, color: L.text2}}>Mathematik · 10 Aufgaben · 60 Minuten</div>
					<div style={{position: 'absolute', right: 30, top: 30, padding: '4px 12px', border: `2.5px solid ${BLAU}`, borderRadius: 8, fontSize: 30, fontWeight: 750, color: BLAU, fontVariantNumeric: 'tabular-nums'}}>
						{Math.floor(sek / 60)}:{String(sek % 60).padStart(2, '0')}
					</div>
					{aufgaben.map((a, i) => (
						<div key={i} style={{position: 'absolute', left: 36, right: 30, top: 150 + i * 120, display: 'flex', gap: 16, fontSize: 30, fontWeight: 600, lineHeight: 1.25}}>
							<span style={{flex: 'none', width: 44, height: 44, borderRadius: 22, border: '2.5px solid #121212', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 800}}>{i + 1}</span>
							<span>{a}</span>
						</div>
					))}
					{[0, 1].map((i) => <div key={i} style={{position: 'absolute', left: 96, top: 520 + i * 26, width: i ? 240 : 380, height: 7, borderRadius: 4, background: '#121212', opacity: 0.15}} />)}
				</div>
				<div style={{position: 'absolute', left: 500, top: 560, width: 420, height: 360, background: D.bg, rotate: '2deg', ...training.style}}>
					<Rahmen w={420} h={360} seed={53} farbe={D.tinte} progress={1} />
					<div style={{position: 'absolute', left: 30, top: 26, fontSize: 32, fontWeight: 800}}>Schwächen-Training</div>
					<div style={{position: 'absolute', left: 30, top: 72, fontSize: 26, color: D.text2, fontWeight: 600}}>Woran es hakt</div>
					{['Kettenregel', 'Grenzkosten', 'Exponentialfunktion'].map((t, i) => (
						<div key={i} style={{position: 'absolute', left: 30, top: 128 + i * 62, fontSize: 32, fontWeight: 650, display: 'flex', alignItems: 'center', gap: 14}}>
							<span style={{width: 14, height: 14, borderRadius: 7, background: '#8db8ae'}} />
							{i === 0 ? (
								<Highlight progress={ab(frame, PR.marker, 12)} color={GELB} seed={9} padding={{left: 6, right: 6, top: 0, bottom: 0}} name="Thema">
									<span style={{color: frame >= PR.marker + 3 ? '#121212' : D.tinte}}>{t}</span>
								</Highlight>
							) : (
								<span style={{opacity: 0.75}}>{t}</span>
							)}
						</div>
					))}
				</div>
				<div style={{position: 'absolute', left: 520, top: 890, padding: '8px 18px', background: GELB, color: '#121212', fontSize: 30, fontWeight: 750, rotate: '-2deg', whiteSpace: 'nowrap', ...chip.style}}>Neue Übungen genau dazu</div>
				<Beispieldaten thema="dunkel" style={{left: 0, right: 0, textAlign: 'center', top: 975}} />
			</Buehne>
			<div style={{position: 'absolute', left: fmt.text.x, top: fmt.quer ? 330 : fmt.text.y, width: fmt.text.w}}>
				<Texttafel thema="dunkel" start={PR.text} markerAb={PR.marker} zeilen={fmt.quer ? [['Probeklausur'], ['und Training genau'], ['da, ', {m: 'wo es hakt.'}]] : [['Probeklausur und'], ['Training genau da,'], [{m: 'wo es hakt.'}]]} />
			</div>
		</Papier>
	);
};

// ---------- 8 Call to Action ----------
const CTA = {marke: 6, a: 40, b: 100, knopf: 160, info: 190, druck: 240};
export const ctaTon: Cue[] = [[CTA.marke + 2, 'scratch'], [CTA.a + 16, 'scratch'], [CTA.knopf + 2, 'pop'], [CTA.druck, 'click'], [CTA.druck + 8, 'ding']];
const MARKER = 'M1.2 3.6C18 2.4 36 3.4 55 2.6S86 3.3 99 2.2L99.6 17.4C82 18.6 63 17.1 44 18S12 17.2.4 18.3Z';
export const Cta: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const fmt = useFormat();
	const q = fmt.quer;
	const knopf = spring({frame: frame - CTA.knopf, fps, config: {damping: 11, mass: 0.7}});
	const druck = interpolate(frame, [CTA.druck, CTA.druck + 4, CTA.druck + 12], [1, 0.97, 1], klemm);
	const fuell = ab(frame, CTA.druck, 10, Easing.out(Easing.quad));
	const info = (bei: number): React.CSSProperties => ({opacity: ab(frame, bei, 16), translate: `0 ${(1 - ab(frame, bei, 16)) * 20}px`});
	const kw = q ? 700 : 760, kh = q ? 140 : 160;
	const y = q ? {marke: 110, text: 230, knopf: 520, preis: 700, info: 762, klein: 960} : {marke: 280, text: 420, knopf: 860, preis: 1066, info: 1140, klein: 1494};
	return (
		<Papier thema="hell">
			<div style={{position: 'absolute', left: 0, right: 0, top: y.marke, display: 'flex', justifyContent: 'center'}}>
				<Wortmarke breite={q ? 460 : 560} farbe={L.tinte} progress={ab(frame, CTA.marke, 40, Easing.linear)} />
			</div>
			<div style={{position: 'absolute', left: 60, right: 60, top: y.text, textAlign: 'center'}}>
				<Texttafel thema="hell" start={CTA.a} zeilen={[['Base ist ', {m: 'kostenlos.'}]]} />
				<Texttafel thema="hell" start={CTA.b} gewicht={650} zeilen={q ? [['24 Stunden Ultra gratis testen.']] : [['24 Stunden Ultra'], ['gratis testen.']]} />
			</div>
			<div style={{position: 'absolute', left: (fmt.W - kw) / 2, top: y.knopf, width: kw, height: kh, scale: String(knopf * druck), opacity: Math.min(1, knopf * 2)}}>
				<svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{position: 'absolute', inset: 6, width: kw - 12, height: kh - 12, clipPath: `inset(0 ${(1 - fuell) * 100}% 0 0)`}}>
					<path d={MARKER} fill={GELB} />
				</svg>
				<Rahmen w={kw} h={kh} seed={61} farbe={BLAU} progress={1} breite={4.5} />
				<div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: q ? 70 : 78, fontWeight: 800, letterSpacing: '-0.01em'}}>lernhelfer.xyz</div>
			</div>
			<div style={{position: 'absolute', left: 60, right: 60, top: y.preis, textAlign: 'center', fontSize: q ? 32 : 36, fontWeight: 650, ...info(CTA.info)}}>
				Pro 4,90 € · Ultra 9,90 € im Monat · kein Abo
			</div>
			<div style={{position: 'absolute', left: q ? 300 : 84, right: q ? 300 : 84, top: y.info, textAlign: 'center', fontSize: q ? 30 : 34, lineHeight: 1.3, color: L.text2, fontWeight: 550, ...info(CTA.info + 10)}}>
				Für OLAT an der Uni Innsbruck · iPad, PC und Mac · Unterlagen bleiben privat
			</div>
			<div style={{position: 'absolute', left: 60, right: 60, top: y.klein, textAlign: 'center', fontSize: 24, color: L.text2, ...info(CTA.info + 20)}}>
				Unabhängiges, privates Projekt. Kein Angebot der Universität Innsbruck.
			</div>
		</Papier>
	);
};
