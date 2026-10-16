// Das lange Reel „Alles drin“: ein gestresster Erstsemester geht durch alle Funktionen. Gedanken in der Ich-Form, die App zeigt echte Aufnahmen mit Beispieldaten.
import React from 'react';
import {Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Circle} from '@remotion/rough-notation';
import {ab, Beispieldaten, BLAU, Buehne, FARBE, GELB, Haken, kasten, klemm, Papier, Rahmen, rau, rundesRechteck, Seite, SHOTS, streck, Striche, type Thema, Tipp, Wortmarke} from './lib';
import {Bild, bisUnten, ChatFolge, chatTon, type Chat, Gedanke, Notiz, Telefon, useRaus} from './bausteine';
import {Datei, DATEIEN, LANDUNG} from './szenen1';
import {Cta, ctaTon, Vortrag, vortragTon} from './szenen2';
import type {Szene} from './Spot';
import type {Cue} from './ton';

const H: Thema = 'hell'; // alle Szenen hell: weiße Karten immer auf Papier
// Tempo je Szene: Faktor auf alle Zeitpunkte und die Länge. Seiten mit viel Text bekommen am meisten Zeit zum Lesen, die Animationen bleiben gleich schnell.
const TEMPO = {hook: 1.2, abgleich: 1.35, heute: 1.5, ausgabe: 2.8, chat: 2, uebung: 1.6, karten: 1.35, frag: 1.8, kalender: 1.5, tests: 1.8, noten: 1.5, probe: 1.6, training: 2.2, podcast: 1.3, panik: 1.2, vortrag: 1.6, coach: 1.8, klein: 1.5, tarife: 1.6, schluss: 1.2};
const Stufe: React.FC<{thema: Thema; children: React.ReactNode; beispiel?: boolean}> = ({thema, children, beispiel = true}) => (
	<Papier thema={thema}>
		<Buehne>
			{children}
			{beispiel && <Beispieldaten thema={thema} style={{left: 0, right: 0, textAlign: 'center', top: 972}} />}
		</Buehne>
	</Papier>
);
const ausblenden = (frame: number, bei: number): React.CSSProperties => ({opacity: 1 - ab(frame, bei, 12)});

// ---------- 1 Hook ----------
const HOOK = streck({a: 10, b: 60, c: 112, marker: 196}, TEMPO.hook);
const hookTon: Cue[] = [[HOOK.a, 'scratch'], [HOOK.b, 'scratch'], [HOOK.c, 'scratch'], [HOOK.marker, 'scratch'], ...DATEIEN.filter((_, i) => i % 3 === 0).map((d) => [Math.round(d.start + LANDUNG), 'tick'] as Cue)];
const RHook: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<>
			<Stufe thema={H} beispiel={false}>
				{DATEIEN.map((d, i) => {
					if (frame < d.start) return null;
					const p = spring({frame: frame - d.start, fps, config: {damping: 9, mass: 0.7, stiffness: 120}});
					return <div key={i} style={{position: 'absolute', left: d.x, top: interpolate(p, [0, 1], [-1500, d.y]), rotate: `${d.dreh * p}deg`}}><Datei i={i} thema="hell" /></div>;
				})}
			</Stufe>
			<Gedanke thema={H} start={0} markerAb={HOOK.marker}
				zeilen={[[{t: 'Sonntag, 23:14.', bei: HOOK.a}], [{t: 'Morgen PS in Mathe.', bei: HOOK.b}], [{t: 'Und ich hab ', bei: HOOK.c}, {m: 'keinen Plan,', bei: HOOK.c + 6}], [{t: 'was diese Woche dran war.', bei: HOOK.c + 14}]]} />
		</>
	);
};

// ---------- 2 Abgleich: PC holt alles aus OLAT, iPad lädt selbst hoch ----------
const AB = streck({laptop: 8, a: 10, aAus: 130, b: 142, bMarker: 200, dateien: 70, notiz1: 120, notiz2: 230, teil2: 322, c: 336, cMarker: 384, form: 340, notiz3: 390}, TEMPO.abgleich);
const abgleichTon: Cue[] = [[AB.laptop, 'scratch'], ...Array.from({length: 6}, (_, i) => [AB.dateien + 40 + i * 28, 'pop'] as Cue), [AB.bMarker, 'scratch'], [AB.notiz2, 'pop'], [AB.form, 'pop'], [AB.cMarker, 'scratch']];
const Laptop: React.FC<{progress: number; frame: number}> = ({progress, frame}) => {
	const pfade = rau('laptop', (g) => g.path(rundesRechteck(40, 0, 400, 260, 14) + 'M0 300L480 300L452 272L28 272Z', {seed: 12, roughness: 1, bowing: 0.6}));
	const fertig = ab(frame, AB.dateien + 200, 12);
	return (
		<div style={{position: 'absolute', left: 30, top: 150, width: 480, height: 300}}>
			<div style={{position: 'absolute', left: 54, top: 14, width: 372, height: 232, background: '#fffefa', opacity: progress}} />
			<div style={{position: 'absolute', left: 80, top: 40, fontSize: 30, fontWeight: 800, color: '#121212', opacity: progress}}>Lernhelfer OLAT</div>
			{[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: 80, top: 100 + i * 34, width: 300 - i * 70, height: 10, borderRadius: 5, background: '#121212', opacity: 0.15 * progress}} />)}
			<div style={{position: 'absolute', left: 80, top: 196, fontSize: 28, fontWeight: 750, color: FARBE.hell.akzent, opacity: fertig}}>Fertig ✓</div>
			<Striche pfade={pfade} progress={progress} farbe={FARBE.hell.tinte} breite={3.4} />
		</div>
	);
};
const RAbgleich: React.FC = () => {
	const frame = useCurrentFrame();
	const weg = ausblenden(frame, AB.teil2);
	const handy = rau('miniHandy', (g) => g.path(rundesRechteck(0, 0, 250, 520, 34), {seed: 14, roughness: 0.9, bowing: 0.4}));
	return (
		<>
			<Stufe thema={H}>
				{frame < AB.teil2 + 14 && (
					<div style={weg}>
						<Laptop progress={ab(frame, AB.laptop, 40, Easing.inOut(Easing.quad))} frame={frame} />
						<div style={{position: 'absolute', left: 660, top: 40, width: 250, height: 520, opacity: ab(frame, AB.laptop + 20, 20)}}>
							<div style={{position: 'absolute', left: 12, top: 12, width: 226, height: 496, borderRadius: 24, overflow: 'hidden', background: '#fbfbf9', boxShadow: '0 0 0 4px #121212'}}>
								<Seite shot="lang/heute" breite={226} />
							</div>
							<Striche pfade={handy} progress={1} farbe={FARBE.hell.tinte} breite={3.4} />
						</div>
						{Array.from({length: 12}, (_, i) => {
							const p = ab(frame, AB.dateien + i * 14, 44, Easing.inOut(Easing.cubic));
							if (p <= 0 || p >= 1) return null;
							const x = interpolate(p, [0, 1], [200, 720]), y = interpolate(p, [0, 1], [230, 200]) - Math.sin(p * Math.PI) * 220;
							return <div key={i} style={{position: 'absolute', left: x, top: y, scale: String(0.55 - 0.25 * p), rotate: `${(random(`f${i}`) - 0.5) * 60 + p * 40}deg`, transformOrigin: '0 0'}}><Datei i={i} thema="hell" /></div>;
						})}
						<Notiz text="Folien · PS-Blätter · Onlinetests" bei={AB.notiz1} x={40} y={520} />
						<Notiz text="Dein OLAT-Passwort sieht er nie." bei={AB.notiz2} x={180} y={700} dreh={2} groesse={32} />
					</div>
				)}
				<Bild shot="lang/unterlagen_form" top={110} bei={AB.form} />
				{frame >= AB.notiz3 - 2 && <Notiz text="PDF · PPTX · DOCX · TXT · ZIP" bei={AB.notiz3} x={360} y={60} dreh={3} />}
			</Stufe>
			<Gedanke thema={H} start={AB.a} aus={AB.aAus} groesse={88} zeilen={[['Okay. Lernhelfer.']]} />
			<Gedanke thema={H} start={AB.b} aus={AB.teil2} markerAb={AB.bMarker} zeilen={[['Einmal am PC einrichten.'], ['Dann holt er ', {m: 'alles'}, ' selbst'], ['aus OLAT.']]} />
			<Gedanke thema={H} start={AB.c} markerAb={AB.cMarker} zeilen={[['Nur iPad? Dann lädst'], ['du die Dateien'], [{m: 'selbst hoch.'}]]} />
		</>
	);
};

// ---------- 3 Heute ----------
const HE = streck({rein: 6, text: 10, marker: 50, fristen: 70, tipp: 120, ab: 150, woche: 210, faecher: 310}, TEMPO.heute);
const heuteTon: Cue[] = [[HE.rein, 'swoosh'], [HE.marker, 'scratch'], [HE.fristen, 'pop'], [HE.tipp, 'click'], [HE.tipp + 4, 'ding'], [HE.woche, 'pop'], [HE.faecher, 'pop']];
const RHeute: React.FC = () => {
	const frame = useCurrentFrame();
	const h = kasten('lang/heute', 'haken1');
	return (
		<>
			<Stufe thema={H}>
				<Telefon shot="lang/heute" thema={H} rein={HE.rein} ueber={[{shot: 'lang/heute_ab', bei: HE.ab}]}
					halte={[{bei: 0}, {bei: HE.fristen, box: 'fristen', zoom: 1.75, anteil: 0.08}, {bei: HE.woche, box: 'woche', zoom: 1.75, anteil: 0.1}, {bei: HE.faecher, box: 'mathe', zoom: 1.6, anteil: 0.1}]}
					kinder={<>
						<Tipp x={h.x + h.w / 2} y={h.y + h.h / 2} bei={HE.tipp} />
						<Haken groesse={h.w + 4} progress={ab(frame, HE.tipp, 12)} farbe={BLAU} style={{left: h.x - 2, top: h.y + 1}} />
					</>} />
				<Notiz text="Fristen der nächsten zwei Wochen" bei={HE.fristen + 4} aus={HE.woche - 30} x={20} y={20} />
				<Notiz text="Erledigt? Abhaken." bei={HE.tipp + 10} aus={HE.woche - 30} x={560} y={860} dreh={3} />
				<Notiz text="Die Woche: Tag antippen" bei={HE.woche + 4} aus={HE.faecher - 30} x={20} y={20} />
				<Notiz text="Deine Fächer" bei={HE.faecher + 4} x={20} y={20} />
			</Stufe>
			<Gedanke thema={H} start={HE.text} markerAb={HE.marker} zeilen={[['Montag, 8:40.'], ['Was ist eigentlich ', {m: 'fällig?'}]]} />
		</>
	);
};

// ---------- 4 Wochenausgabe ----------
const AU = streck({rein: 6, a: 10, aMarker: 40, aAus: 230, b: 244, bMarker: 290, stopps: [60, 150, 240, 340, 430]}, TEMPO.ausgabe);
const AU_TEILE = [['blick', 'Auf einen Blick'], ['zusammenfassung', 'Zusammenfassung der letzten Einheit'], ['formeln', 'Formeln Schritt für Schritt'], ['ps', 'Nächstes PS mit Aufgaben'], ['lexikon', 'Lexikon']] as const;
const ausgabeTon: Cue[] = [[AU.rein, 'swoosh'], [AU.aMarker, 'scratch'], [AU.bMarker, 'scratch'], ...AU.stopps.map((f) => [f + 4, 'pop'] as Cue)];
const RAusgabe: React.FC = () => (
	<>
		<Stufe thema={H}>
			<Telefon shot="lang/ausgabe" thema={H} rein={AU.rein} halte={[{bei: 0}, ...AU_TEILE.map(([box], i) => ({bei: AU.stopps[i], box, zoom: 1.9, anteil: 0.08}))]} />
			{AU_TEILE.map(([, text], i) => <Notiz key={i} text={text} bei={AU.stopps[i] + 4} aus={AU.stopps[i + 1] != null ? AU.stopps[i + 1] - 30 : undefined} x={20} y={20} dreh={i % 2 ? 3 : -3} />)}
		</Stufe>
		<Gedanke thema={H} start={AU.a} aus={AU.aAus} markerAb={AU.aMarker} zeilen={[['Mathe antippen.'], ['Da ist ', {m: 'die ganze Woche.'}]]} />
		<Gedanke thema={H} start={AU.b} markerAb={AU.bMarker} zeilen={[['Ultra-Fassung: mehr als'], ['doppelt so ', {m: 'ausführlich.'}]]} />
	</>
);

// ---------- 5 Rückfrage zur Ausgabe ----------
const CH: Chat = streck<Chat>({name: 'lang/chat', bei: 16, tippen: [40, 196], senden: 210, antwort: [292, 420], zweite: {name: 'lang/chat2_antwort', bei: 560, antwort: [600, 690]}}, TEMPO.chat);
const CHT = streck({a: 10, aMarker: 50, aAus: 250, b: 262, bMarker: 330, bAus: 532, c: 544, cMarker: 650}, TEMPO.chat);
const chatTonR: Cue[] = [...chatTon(CH), [CHT.aMarker, 'scratch'], [CHT.bMarker, 'scratch'], [CHT.cMarker, 'scratch']];
const RChat: React.FC = () => (
	<>
		<Stufe thema={H}>
			<ChatFolge {...CH} top={40} fenster={880} />
			<Notiz text="Kennt nur die Unterlagen dieses Fachs" bei={CHT.bMarker} aus={CHT.bAus} x={300} y={890} dreh={2} groesse={30} />
			<Notiz text="Ehrlich statt raten" bei={CHT.cMarker + 20} x={520} y={890} dreh={-2} />
		</Stufe>
		<Gedanke thema={H} start={CHT.a} aus={CHT.aAus} markerAb={CHT.aMarker} zeilen={[['Und wenn ich’s'], ['trotzdem nicht ', {m: 'check?'}]]} />
		<Gedanke thema={H} start={CHT.b} aus={CHT.bAus} markerAb={CHT.bMarker} zeilen={[['Fragen, wie du redest.'], ['Antwort nur aus'], [{m: 'deinen Unterlagen.'}]]} />
		<Gedanke thema={H} start={CHT.c} markerAb={CHT.cMarker} zeilen={[['Und was nicht drinsteht,'], [{m: 'erfindet er nicht.'}]]} />
	</>
);

// ---------- 6 Übungen ----------
const UE = streck({karte: 16, tipp: 110, auf: 116, text: 10, marker: 140}, TEMPO.uebung);
const uebungTon: Cue[] = [[UE.karte + 2, 'pop'], [UE.tipp, 'click'], [UE.marker, 'scratch']];
const RUebung: React.FC = () => {
	const frame = useCurrentFrame();
	const zu = kasten('lang/ausgabe', 'aufgabe1'), auf = kasten('lang/ausgabe_auf', 'aufgabe1'), k = 820 / zu.w;
	const offen = frame >= UE.auf;
	return (
		<>
			<Stufe thema={H}>
				<Bild shot={offen ? 'lang/ausgabe_auf' : 'lang/ausgabe'} box="aufgabe1" top={140} bei={UE.karte}
					fenster={interpolate(frame, [UE.auf, UE.auf + 20], [zu.h * k, auf.h * k], {...klemm, easing: Easing.bezier(0.2, 0.9, 0.3, 1)})}>
					<Tipp x={zu.x + 94} y={zu.y + 139} bei={UE.tipp} />
				</Bild>
				<Notiz text="In jeder Ausgabe" bei={UE.karte + 30} x={600} y={60} dreh={3} />
			</Stufe>
			<Gedanke thema={H} start={UE.text} markerAb={UE.marker} zeilen={[['Erst selbst rechnen.'], [{m: 'Dann aufdecken.'}]]} />
		</>
	);
};

// ---------- 7 Karteikarten ----------
const KA = streck({karte: 16, flip: 90, raus: 196, export: 212, text: 10, marker: 140}, TEMPO.karten);
const kartenTon: Cue[] = [[KA.karte + 2, 'pop'], [KA.flip, 'swoosh'], [KA.marker, 'scratch'], [KA.export + 2, 'pop']];
const RKarten: React.FC = () => {
	const frame = useCurrentFrame();
	const karte = kasten('m_hell_karten', 'karte');
	const winkel = interpolate(frame, [KA.flip, KA.flip + 30], [0, 180], {...klemm, easing: Easing.inOut(Easing.cubic)});
	const raus = useRaus(KA.raus);
	return (
		<>
			<Stufe thema={H}>
				{frame < KA.raus + 16 && (
					<div style={{position: 'absolute', inset: 0, perspective: 2400, ...raus}}>
						<Bild shot={winkel <= 90 ? 'm_hell_karten' : 'm_hell_karten_h'} box="karte" top={150} bei={KA.karte} style={{rotate: `y ${winkel <= 90 ? winkel : winkel - 180}deg`}} />
						<Notiz text="Was sitzt, kommt nach 1, 3, 7, 14 und 30 Tagen wieder" bei={KA.flip + 40} x={30} y={160 + (karte.h * 820) / karte.w + 40} groesse={30} dreh={2} />
					</div>
				)}
				<Bild shot="lang/karten_export" top={330} bei={KA.export} />
				<Notiz text="Export für Anki und Quizlet" bei={KA.export + 30} x={200} y={580} dreh={-2} />
			</Stufe>
			<Gedanke thema={H} start={KA.text} markerAb={KA.marker} zeilen={[['Begriffe abfragen.'], ['Was sitzt, kommt'], [{m: 'seltener.'}]]} />
		</>
	);
};

// ---------- 8 Frag den Lernhelfer ----------
const FR: Chat = streck<Chat>({name: 'lang/assistent', bei: 16, tippen: [40, 200], senden: 214, antwort: [292, 390]}, TEMPO.frag);
const FRT = streck({a: 10, aMarker: 50, aAus: 250, b: 262, bMarker: 330}, TEMPO.frag);
const fragTon: Cue[] = [...chatTon(FR), [FRT.aMarker, 'scratch'], [FRT.bMarker, 'scratch']];
const RFrag: React.FC = () => (
	<>
		<Stufe thema={H}>
			<ChatFolge {...FR} top={40} fenster={900} />
		</Stufe>
		<Gedanke thema={H} start={FRT.a} aus={FRT.aAus} markerAb={FRT.aMarker} zeilen={[['Wo ist eigentlich'], ['mein ', {m: 'VWL-PS?'}]]} />
		<Gedanke thema={H} start={FRT.b} markerAb={FRT.bMarker} zeilen={[['„Frag den Lernhelfer“'], ['kennt Stundenplan, Fristen'], ['und ', {m: 'alle Ausgaben.'}]]} />
	</>
);

// ---------- 9 Kalender ----------
const KL = streck({woche: 16, pan: [110, 170], a: 10, aMarker: 60, aAus: 222, ipad: 240, tipp: 300, b: 234, bMarker: 320, notiz: 330}, TEMPO.kalender);
const kalenderTon: Cue[] = [[KL.woche + 2, 'pop'], [KL.aMarker, 'scratch'], [KL.ipad + 2, 'pop'], [KL.tipp, 'click'], [KL.tipp + 4, 'ding'], [KL.bMarker, 'scratch']];
const RKalender: React.FC = () => {
	const frame = useCurrentFrame();
	const W = SHOTS['lang/kal_woche'], kn = SHOTS['lang/kal_ipad'].boxen.knopf;
	const x = interpolate(frame, KL.pan, [0, W.w - 600], {...klemm, easing: Easing.inOut(Easing.cubic)});
	return (
		<>
			<Stufe thema={H}>
				<Bild shot="lang/kal_woche" rect={[x, 0, 600, W.h]} breite={900} top={20} bei={KL.woche} />
				<Notiz text="Stundenplan aus LFU:online" bei={KL.aMarker + 10} aus={KL.ipad} x={420} y={380} dreh={2} />
				<Bild shot="lang/kal_ipad" rect={[0, 0, 526, 190]} top={430} bei={KL.ipad} breite={820}>
					<Tipp x={kn[0] + kn[2] / 2} y={kn[1] + kn[3] / 2} bei={KL.tipp} />
				</Bild>
				<Notiz text="Erinnerung 1 Tag und 2 Std. vorher" bei={KL.notiz} x={360} y={860} dreh={-2} />
			</Stufe>
			<Gedanke thema={H} start={KL.a} aus={KL.aAus} markerAb={KL.aMarker} zeilen={[['Mein ganzer Stundenplan.'], ['Mit ', {m: 'Thema'}, ' jeder Einheit.']]} />
			<Gedanke thema={H} start={KL.b} markerAb={KL.bMarker} zeilen={[['Fristen ab ins iPad.'], [{m: 'Mit Erinnerung.'}]]} />
		</>
	);
};

// ---------- 10 Onlinetests ----------
const OT = streck({rein: 6, offen: 60, fertig: 150, teil2: 210, foto: 216, teil3: 380, loesung: 388, a: 10, aMarker: 60, b: 222, bMarker: 270, c: 394, cMarker: 440}, TEMPO.tests);
const testsTon: Cue[] = [[OT.rein, 'swoosh'], [OT.aMarker, 'scratch'], [OT.foto + 2, 'pop'], [OT.bMarker, 'scratch'], [OT.loesung + 2, 'pop'], [OT.cMarker, 'scratch']];
const RTests: React.FC = () => {
	const frame = useCurrentFrame();
	const raus2 = useRaus(OT.teil3);
	return (
		<>
			<Stufe thema={H}>
				{frame < OT.teil2 + 14 && (
					<div style={{position: 'absolute', inset: 0, ...ausblenden(frame, OT.teil2)}}>
						<Telefon shot="lang/tests" thema={H} rein={OT.rein} halte={[{bei: 0}, {bei: OT.offen, box: 'offen', zoom: 1.8, anteil: 0.08}, {bei: OT.fertig, box: 'fertig', zoom: 1.8, anteil: 0.08}]} />
						<Notiz text="Offen, bis wann, wie viele Punkte" bei={OT.offen + 4} x={20} y={20} />
					</div>
				)}
				{frame < OT.teil3 + 16 && (
					<div style={{position: 'absolute', inset: 0, ...raus2}}>
						<Bild shot="lang/tests_foto" top={80} breite={720} bei={OT.foto} />
						<Notiz text="Die KI schreibt ab und löst nichts." bei={OT.bMarker + 20} x={300} y={880} dreh={2} groesse={30} />
					</div>
				)}
				<Bild shot="lang/test_loesung" box="weg" top={110} fenster={840} bei={OT.loesung} />
				<Notiz text="Gleiche Art Aufgabe, andere Zahlen" bei={OT.cMarker + 10} x={40} y={30} />
			</Stufe>
			<Gedanke thema={H} start={OT.a} aus={OT.teil2} markerAb={OT.aMarker} zeilen={[['Welcher Test ist offen?'], [{m: 'Bis wann?'}]]} />
			<Gedanke thema={H} start={OT.b} aus={OT.teil3} markerAb={OT.bMarker} zeilen={[['Kein PC?'], [{m: 'Test per Foto.'}]]} />
			<Gedanke thema={H} start={OT.c} markerAb={OT.cMarker} zeilen={[['Test vorbei und'], [{m: 'nicht kapiert?'}]]} />
		</>
	);
};

// ---------- 11 Noten und Prüfung ----------
const NO = streck({rein: 6, diagramm: 60, lv: 160, teil2: 250, plan: 262, a: 10, aMarker: 50, b: 262, bMarker: 330}, TEMPO.noten);
const notenTon: Cue[] = [[NO.rein, 'swoosh'], [NO.aMarker, 'scratch'], [NO.diagramm + 4, 'pop'], [NO.lv + 4, 'pop'], [NO.plan + 2, 'pop'], [NO.bMarker, 'scratch']];
const RNoten: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<>
			<Stufe thema={H}>
				{frame < NO.teil2 + 14 && (
					<div style={{position: 'absolute', inset: 0, ...ausblenden(frame, NO.teil2)}}>
						<Telefon shot="lang/noten" thema={H} rein={NO.rein} halte={[{bei: 0}, {bei: NO.diagramm, box: 'diagramm', zoom: 1.8, anteil: 0.08}, {bei: NO.lv, box: 'lv1', zoom: 1.8, anteil: 0.08}]} />
						<Notiz text="Verlauf als Diagramm" bei={NO.diagramm + 4} aus={NO.lv - 30} x={20} y={20} />
						<Notiz text="Prognose und was zur nächsten Note fehlt" bei={NO.lv + 4} x={20} y={20} groesse={30} />
					</div>
				)}
				<Bild shot="lang/pruefung_plan" top={120} bei={NO.plan} />
				<Notiz text="Zwei Tage Puffer zum Üben" bei={NO.bMarker + 20} x={400} y={880} dreh={2} />
			</Stufe>
			<Gedanke thema={H} start={NO.a} aus={NO.teil2} markerAb={NO.aMarker} zeilen={[['Wie steh ich'], [{m: 'eigentlich?'}]]} />
			<Gedanke thema={H} start={NO.b} markerAb={NO.bMarker} zeilen={[['30 Tage bis zum'], ['Zwischentest. ', {m: 'Plan steht.'}]]} />
		</>
	);
};

// ---------- 12 Probeklausur ----------
const PK = streck({rein: 6, kopf: 60, aufgaben: 150, teil2: 226, kacheln: 236, falsch: 296, a: 10, aMarker: 60, b: 236, bMarker: 310}, TEMPO.probe);
const pkTon: Cue[] = [[PK.rein, 'swoosh'], [PK.aMarker, 'scratch'], [PK.kacheln + 2, 'pop'], [PK.falsch + 2, 'pop'], [PK.bMarker, 'scratch']];
const RProbe: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<>
			<Stufe thema={H}>
				{frame < PK.teil2 + 14 && (
					<div style={{position: 'absolute', inset: 0, ...ausblenden(frame, PK.teil2)}}>
						<Telefon shot="lang/pk_laeuft" thema={H} rein={PK.rein} halte={[{bei: 0}, {bei: PK.kopf, box: 'pk', zoom: 1.9, anteil: 0.05}, {bei: PK.aufgaben, box: 'aufgaben', zoom: 1.9, anteil: 0.05}]} />
						<Notiz text="Zeitlimit läuft" bei={PK.kopf + 4} x={20} y={20} />
					</div>
				)}
				<Bild shot="lang/pk_kacheln" top={20} breite={520} bei={PK.kacheln} style={{left: 60}} />
				<Bild shot="lang/pk_ergebnis" box="falsch" top={550} fenster={420} bei={PK.falsch} breite={760} />
			</Stufe>
			<Gedanke thema={H} start={PK.a} aus={PK.teil2} markerAb={PK.aMarker} zeilen={[['Generalprobe.'], ['Im Stil der ', {m: 'Prüfung.'}]]} />
			<Gedanke thema={H} start={PK.b} markerAb={PK.bMarker} zeilen={[['Punkte, Note und'], [{m: 'jeder Lösungsweg.'}]]} />
		</>
	);
};

// ---------- 13 Schwächen-Training und Lernskript ----------
const TR = streck({training: 16, scroll1: [90, 200], teil2: 222, skript: 234, scroll2: [290, 400], a: 10, aMarker: 50, b: 234, bMarker: 290}, TEMPO.training);
const trainingTon: Cue[] = [[TR.training + 2, 'pop'], [TR.aMarker, 'scratch'], [TR.skript + 2, 'pop'], [TR.bMarker, 'scratch']];
const RTraining: React.FC = () => {
	const frame = useCurrentFrame();
	const fenster = 860;
	const s1 = interpolate(frame, TR.scroll1, [0, bisUnten('lang/training', fenster)], {...klemm, easing: Easing.inOut(Easing.cubic)});
	const s2 = interpolate(frame, TR.scroll2, [0, bisUnten('lang/skript', fenster)], {...klemm, easing: Easing.inOut(Easing.cubic)});
	const raus = useRaus(TR.teil2);
	return (
		<>
			<Stufe thema={H}>
				{frame < TR.teil2 + 16 && (
					<div style={{position: 'absolute', inset: 0, ...raus}}>
						<Bild shot="lang/training" top={40} fenster={fenster} scroll={s1} bei={TR.training} />
						<Notiz text="Aus Tests, Probeklausuren und Noten" bei={TR.aMarker + 30} x={300} y={870} dreh={2} groesse={30} />
					</div>
				)}
				<Bild shot="lang/skript" top={40} fenster={fenster} scroll={s2} bei={TR.skript} />
				<Notiz text="Auch als PDF" bei={TR.bMarker + 40} x={620} y={870} dreh={-3} />
			</Stufe>
			<Gedanke thema={H} start={10} aus={TR.teil2} markerAb={TR.aMarker} zeilen={[['Üben,'], [{m: 'wo’s hakt.'}]]} groesse={88} />
			<Gedanke thema={H} start={TR.b} markerAb={TR.bMarker} zeilen={[['Der ganze Stoff'], ['als ', {m: 'Lernskript.'}]]} groesse={88} />
		</>
	);
};

// ---------- 14 Podcast ----------
const PO = streck({hoerer: 12, welle: 50, karte: 96, text: 10, marker: 60, notiz: 150}, TEMPO.podcast);
const podcastTonR: Cue[] = [[PO.hoerer + 2, 'scratch'], [PO.marker, 'scratch'], [PO.karte + 2, 'pop'], [PO.notiz, 'pop']];
const RPodcast: React.FC = () => {
	const frame = useCurrentFrame();
	const hoerer = rau('kopfhoerer', (g) =>
		g.path('M250 330C246 80 714 80 710 330M282 318C284 130 676 130 678 318' + rundesRechteck(196, 300, 110, 190, 40) + rundesRechteck(654, 300, 110, 190, 40), {seed: 8, roughness: 0.9, bowing: 0.5}),
	);
	const L = FARBE.hell;
	return (
		<>
			<Stufe thema={H}>
				<div style={{position: 'absolute', left: 0, top: -50, width: 960, height: 520, scale: '0.78', transformOrigin: '480px 0'}}>
					<Striche pfade={hoerer} progress={ab(frame, PO.hoerer, 40, Easing.inOut(Easing.quad))} farbe={L.tinte} breite={6} />
					{Array.from({length: 22}, (_, i) => {
						const a = Math.abs(Math.sin(i * 0.8 + frame * 0.19) * Math.sin(i * 0.33 + frame * 0.06));
						const h = (14 + a * 120) * ab(frame, PO.welle + i, 12);
						return <div key={i} style={{position: 'absolute', left: 344 + i * 13, top: 395 - h / 2, width: 7, height: h, borderRadius: 4, background: i % 3 ? L.tinte : BLAU}} />;
					})}
				</div>
				<Bild shot="lang/hoeren" top={410} breite={720} bei={PO.karte} />
				<Notiz text="Offline speicherbar" bei={PO.notiz} x={560} y={350} dreh={3} />
			</Stufe>
			<Gedanke thema={H} start={PO.text} markerAb={PO.marker} zeilen={[['Keine Lust zu lesen?'], ['Hör’s dir ', {m: 'im Bus'}, ' an.']]} />
		</>
	);
};

// ---------- 15 Vortrag: Panik, dann die Analyse aus dem kurzen Spot, dann Reflexion und Coach ----------
const PA = streck({blatt: 12, kreis: 90, text: 10, marker: 84}, TEMPO.panik);
const panikTon: Cue[] = [[PA.blatt + 2, 'scratch'], [PA.marker, 'scratch'], [PA.kreis, 'scratch']];
const RPanik: React.FC = () => {
	const frame = useCurrentFrame();
	const e = spring({frame: frame - PA.blatt, fps: 60, config: {damping: 12, mass: 0.8}});
	return (
		<>
			<Stufe thema={H} beispiel={false}>
				<div style={{position: 'absolute', left: 250, top: 120, width: 460, height: 520, background: '#fffefa', rotate: `${-3 + (1 - e) * 10}deg`, scale: String(0.9 + 0.1 * e), opacity: Math.min(1, e * 2), boxShadow: '0 30px 60px -28px rgba(18,18,18,0.45)'}}>
					<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 110, background: FARBE.hell.akzent}} />
					<div style={{position: 'absolute', left: 0, right: 0, top: 22, textAlign: 'center', fontSize: 56, fontWeight: 800, color: '#fff', letterSpacing: '0.04em'}}>FREITAG</div>
					<div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontSize: 64, fontWeight: 800}}>Englisch-PS</div>
					<div style={{position: 'absolute', left: 0, right: 0, top: 270, display: 'flex', justifyContent: 'center'}}>
						<Circle progress={ab(frame, PA.kreis, 18)} color={GELB} seed={3} strokeWidth={5} padding={{left: 18, right: 18, top: 12, bottom: 12}} name="Pitch">
							<span style={{fontSize: 56, fontWeight: 800}}>Pitch, 3 Min.</span>
						</Circle>
					</div>
					<Rahmen w={460} h={520} seed={81} farbe="#121212" progress={1} />
				</div>
			</Stufe>
			<Gedanke thema={H} start={PA.text} markerAb={PA.marker} groesse={88} zeilen={[['Freitag: Präsentation'], ['in Englisch. ', {m: 'Panik.', bei: PA.text + 60}]]} />
		</>
	);
};
const CO = streck({reflexion: 16, scroll: [90, 210], teil2: 232, a: 10, aMarker: 60, b: 244, bMarker: 300, notiz1: 100, notiz2: 560}, TEMPO.coach);
const COACH: Chat = streck<Chat>({name: 'lang/coach', bei: 248, tippen: [272, 404], senden: 416, antwort: [490, 580]}, TEMPO.coach);
const coachTon: Cue[] = [[CO.reflexion + 2, 'pop'], [CO.aMarker, 'scratch'], ...chatTon(COACH), [CO.bMarker, 'scratch']];
const RCoach: React.FC = () => {
	const frame = useCurrentFrame();
	const fenster = 860;
	const s = interpolate(frame, CO.scroll, [0, bisUnten('lang/vt_reflexion', fenster)], {...klemm, easing: Easing.inOut(Easing.cubic)});
	const raus = useRaus(CO.teil2);
	return (
		<>
			<Stufe thema={H}>
				{frame < CO.teil2 + 16 && (
					<div style={{position: 'absolute', inset: 0, ...raus}}>
						<Bild shot="lang/vt_reflexion" top={40} fenster={fenster} scroll={s} bei={CO.reflexion} />
						<Notiz text="„stimmt“, „teilweise“ oder „stimmt nicht“, mit Begründung" bei={CO.notiz1} x={60} y={880} dreh={2} groesse={28} />
					</div>
				)}
				<ChatFolge {...COACH} top={40} fenster={860} />
				<Notiz text="Das Video bleibt auf deinem Gerät." bei={CO.notiz2} x={330} y={880} dreh={-2} groesse={30} />
			</Stufe>
			<Gedanke thema={H} start={CO.a} aus={CO.teil2} markerAb={CO.aMarker} zeilen={[['Davor: kurz selbst'], ['reflektieren. Die KI'], [{m: 'prüft jeden Punkt.'}]]} groesse={72} />
			<Gedanke thema={H} start={CO.b} markerAb={CO.bMarker} zeilen={[['Und Rückfragen'], ['an den ', {m: 'Coach.'}]]} groesse={88} />
		</>
	);
};

// ---------- 16 Kleinkram ----------
const KK = streck({start: 40, takt: 96}, TEMPO.klein);
const KK_TEILE = ['Frühere Ausgaben bleiben', 'Alle Fächer auf einmal neu, fertig in 2 bis 4 Min.', 'Dein Stil für die KI', 'Modell und Design wählen', 'Hell oder dunkel', 'Deine Unterlagen bleiben privat'];
const kleinTon: Cue[] = KK_TEILE.flatMap((_, i) => [[KK.start + i * KK.takt, 'pop'], [KK.start + i * KK.takt + 24, 'pop']] as Cue[]);
const Privat: React.FC<{bei: number}> = ({bei}) => {
	const zeilen = ['Unterlagen privat in deinem Konto', 'Das Vortragsvideo bleibt am Gerät', 'Dein OLAT-Passwort sieht die App nie', 'Was nicht in den Unterlagen steht, wird nicht erfunden'];
	const frame = useCurrentFrame();
	if (frame < bei - 2) return null;
	return (
		<div style={{position: 'absolute', left: 70, top: 160, width: 820, height: 560, background: '#fffefa', color: '#121212', opacity: ab(frame, bei, 12), translate: `0 ${(1 - ab(frame, bei, 20)) * 120}px`}}>
			{zeilen.map((z, i) => (
				<div key={i} style={{position: 'absolute', left: 50, right: 40, top: 60 + i * 120, display: 'flex', gap: 22, alignItems: 'center', fontSize: 36, fontWeight: 700, lineHeight: 1.2, opacity: ab(frame, bei + 10 + i * 8, 12)}}>
					<Haken groesse={44} progress={ab(frame, bei + 10 + i * 8, 12)} farbe={BLAU} style={{position: 'relative', flex: 'none'}} />
					{z}
				</div>
			))}
			<Rahmen w={820} h={560} seed={91} farbe="#121212" progress={1} />
		</div>
	);
};
const RKlein: React.FC = () => {
	const frame = useCurrentFrame();
	const t = (i: number) => KK.start + i * KK.takt;
	const sichtbar = (i: number) => frame >= t(i) - 2 && (i === KK_TEILE.length - 1 || frame < t(i + 1));
	const raus = (i: number): React.CSSProperties => (i < KK_TEILE.length - 1 ? {opacity: 1 - ab(frame, t(i + 1) - 12, 12)} : {});
	const alle = kasten('lang/heute', 'alle');
	return (
		<>
			<Stufe thema={H}>
				{sichtbar(0) && <div style={raus(0)}><Bild shot="lang/archiv" top={120} breite={700} bei={t(0)} /></div>}
				{sichtbar(1) && <div style={raus(1)}><Bild shot="lang/heute" rect={[alle.x - 12, alle.y - 12, alle.w + 24, alle.h + 24]} top={260} breite={640} bei={t(1)} /></div>}
				{sichtbar(2) && <div style={raus(2)}><Bild shot="lang/stil" top={60} breite={640} bei={t(2)} /></div>}
				{sichtbar(3) && (
					<div style={raus(3)}>
						<Bild shot="lang/modell" top={220} breite={760} bei={t(3)} />
						<Bild shot="lang/design" top={460} breite={760} bei={t(3) + 10} />
					</div>
				)}
				{sichtbar(4) && (
					<div style={raus(4)}>
						<Bild shot="m_hell_heute" rect={[0, 0, 390, 640]} top={130} breite={400} bei={t(4)} style={{left: 60, rotate: '-2deg'}} />
						<Bild shot="m_dunkel_heute" rect={[0, 0, 390, 640]} top={150} breite={400} bei={t(4) + 10} style={{left: 500, rotate: '2deg'}} />
					</div>
				)}
				<Privat bei={t(5)} />
				{KK_TEILE.map((text, i) => <Notiz key={i} text={text} bei={t(i) + 24} aus={i < KK_TEILE.length - 1 ? t(i + 1) - 12 : undefined} x={40} y={820} dreh={i % 2 ? 2 : -2} groesse={i === 1 ? 30 : 34} />)}
			</Stufe>
			<Gedanke thema={H} start={10} groesse={88} zeilen={[['Und sonst so?']]} />
		</>
	);
};

// ---------- 17 Tarife ----------
const TA = streck({karte: 16, scroll: [80, 400], a: 10, aMarker: 50, aAus: 232, b: 244, bMarker: 290, notizen: [120, 220, 330]}, TEMPO.tarife);
const tarifTon: Cue[] = [[TA.karte + 2, 'pop'], [TA.aMarker, 'scratch'], [TA.bMarker, 'scratch'], ...TA.notizen.map((f) => [f, 'pop'] as Cue)];
const RTarife: React.FC = () => {
	const frame = useCurrentFrame();
	const fenster = 860;
	const s = interpolate(frame, TA.scroll, [0, bisUnten('lang/tarife_karten', fenster)], {...klemm, easing: Easing.inOut(Easing.sin)});
	return (
		<>
			<Stufe thema={H}>
				<Bild shot="lang/tarife_karten" top={40} fenster={fenster} scroll={s} bei={TA.karte} />
				<Notiz text="Kein Abo" bei={TA.notizen[0]} aus={TA.notizen[1] - 10} x={600} y={870} dreh={3} />
				<Notiz text="24 Stunden Ultra gratis" bei={TA.notizen[1]} aus={TA.notizen[2] - 10} x={480} y={870} dreh={-2} />
				<Notiz text="Freunde sparen bis zu 30 %" bei={TA.notizen[2]} x={400} y={870} dreh={2} />
			</Stufe>
			<Gedanke thema={H} start={TA.a} aus={TA.aAus} markerAb={TA.aMarker} groesse={88} zeilen={[['Und was kostet'], [{m: 'das?'}]]} />
			<Gedanke thema={H} start={TA.b} markerAb={TA.bMarker} zeilen={[['Base: ', {m: '0 €.'}], ['Pro 4,90 €, Ultra 9,90 €'], ['im Monat.']]} />
		</>
	);
};

// ---------- 18 Schluss ----------
const SC = streck({rahmen: 20, schrift: 40, text: 10, marker: 80, notiz: 140}, TEMPO.schluss);
const schlussTon: Cue[] = [[SC.rahmen, 'scratch'], [SC.schrift + 2, 'scratch'], [SC.marker, 'scratch'], [SC.notiz, 'pop']];
const RSchluss: React.FC = () => {
	const frame = useCurrentFrame();
	const c = FARBE.hell;
	return (
		<>
			<Stufe thema={H} beispiel={false}>
				<div style={{position: 'absolute', left: 70, top: 260, width: 820, height: 250}}>
					<Rahmen w={820} h={250} seed={11} breite={4} farbe={c.tinte} progress={ab(frame, SC.rahmen, 26, Easing.inOut(Easing.quad))} />
					<div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center'}}>
						<Wortmarke breite={660} farbe={c.tinte} progress={ab(frame, SC.schrift, 60, Easing.linear)} />
					</div>
				</div>
				<Notiz text="Gute Nacht." bei={SC.notiz} x={560} y={560} dreh={4} groesse={40} />
			</Stufe>
			<Gedanke thema={H} start={SC.text} markerAb={SC.marker} groesse={88} zeilen={[['Sonntag, 23:31.'], [{m: 'Ich check’s.', bei: SC.text + 40}]]} />
		</>
	);
};

const VortragHell: React.FC = () => <Vortrag thema="hell" tempo={TEMPO.vortrag} />;

export const REEL: Szene[] = [
	{name: 'Hook', dauer: streck(300, TEMPO.hook), C: RHook, ton: hookTon},
	{name: 'Abgleich', dauer: streck(480, TEMPO.abgleich), C: RAbgleich, ton: abgleichTon},
	{name: 'Heute', dauer: streck(400, TEMPO.heute), C: RHeute, ton: heuteTon},
	{name: 'Ausgabe', dauer: streck(540, TEMPO.ausgabe), C: RAusgabe, ton: ausgabeTon},
	{name: 'Chat', dauer: streck(820, TEMPO.chat), C: RChat, ton: chatTonR},
	{name: 'Uebungen', dauer: streck(300, TEMPO.uebung), C: RUebung, ton: uebungTon},
	{name: 'Karten', dauer: streck(380, TEMPO.karten), C: RKarten, ton: kartenTon},
	{name: 'Frag', dauer: streck(540, TEMPO.frag), C: RFrag, ton: fragTon},
	{name: 'Kalender', dauer: streck(420, TEMPO.kalender), C: RKalender, ton: kalenderTon},
	{name: 'Tests', dauer: streck(600, TEMPO.tests), C: RTests, ton: testsTon},
	{name: 'Noten', dauer: streck(500, TEMPO.noten), C: RNoten, ton: notenTon},
	{name: 'Probeklausur', dauer: streck(440, TEMPO.probe), C: RProbe, ton: pkTon},
	{name: 'Training', dauer: streck(450, TEMPO.training), C: RTraining, ton: trainingTon},
	{name: 'Podcast', dauer: streck(330, TEMPO.podcast), C: RPodcast, ton: podcastTonR},
	{name: 'Panik', dauer: streck(200, TEMPO.panik), C: RPanik, ton: panikTon},
	{name: 'Vortrag', dauer: streck(570, TEMPO.vortrag), C: VortragHell, ton: vortragTon(TEMPO.vortrag)},
	{name: 'Coach', dauer: streck(680, TEMPO.coach), C: RCoach, ton: coachTon},
	{name: 'Kleinkram', dauer: streck(640, TEMPO.klein), C: RKlein, ton: kleinTon},
	{name: 'Tarife', dauer: streck(460, TEMPO.tarife), C: RTarife, ton: tarifTon},
	{name: 'Schluss', dauer: streck(230, TEMPO.schluss), C: RSchluss, ton: schlussTon},
	{name: 'CTA', dauer: 420, C: Cta, ton: ctaTon},
];
