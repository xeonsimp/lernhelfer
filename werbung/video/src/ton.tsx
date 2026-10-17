// Ton: synthetische Effekte (public/sfx, per ffmpeg erzeugt) bildgenau auf den Szenen, Musik unter Effekten 6 dB leiser.
// Voice-over (public/vo, von scripts/stimme.py mit edge-tts erzeugt) Satz für Satz an den Zeitpunkten der Szenen.
import React from 'react';
import {Audio} from '@remotion/media';
import {interpolate, staticFile} from 'remotion';
import {klemm} from './lib';
import vo from '../public/vo/vo.json';

export type Ton = 'scratch' | 'pop' | 'click' | 'ding' | 'swoosh' | 'tick';
export type Cue = [frame: number, ton: Ton];
/** Ein gesprochener Satz auf der Zeitachse des Films: darf von start bis bis dauern */
export type Sprechen = {id: string; start: number; bis: number; text: string};
// Länge in Frames bei 60 fps und Grundlautstärke
const TON: Record<Ton, {dauer: number; laut: number}> = {
	scratch: {dauer: 27, laut: 0.45},
	pop: {dauer: 6, laut: 0.8},
	click: {dauer: 3, laut: 0.9},
	ding: {dauer: 36, laut: 0.55},
	swoosh: {dauer: 17, laut: 0.55},
	tick: {dauer: 2, laut: 0.35},
};
const AUFNAHMEN = vo as Record<string, {text: string; sek: number}>;

/** Länge der Aufnahme in Frames; bricht ab, wenn sie fehlt, zu einem anderen Text gehört oder in den nächsten Satz liefe */
const laenge = ({id, start, bis, text}: Sprechen) => {
	const a = AUFNAHMEN[id];
	if (!a || a.text !== text) throw new Error(`Voice-over ${id} fehlt oder ist veraltet: python scripts/stimme.py`);
	const n = Math.ceil(a.sek * 60);
	if (start + n > bis) throw new Error(`Voice-over ${id} ist ${((start + n - bis) / 60).toFixed(2)} s zu lang: Text kürzen (python scripts/stimme.py prüft das)`);
	return n;
};

/** Musik-Lautstärke: −6 dB (Faktor 0,5) während jedes Effekts, mit kurzen Rampen; Ein- und Ausblenden */
const musik = (f: number, cues: Cue[], ende: number, basis: number) => {
	let duck = 1;
	for (const [s, t] of cues) {
		const e = s + Math.max(10, TON[t].dauer);
		if (f < s - 4 || f > e + 6) continue;
		duck = Math.min(duck, interpolate(f, [s - 4, s, e, e + 6], [1, 0.5, 0.5, 1], klemm));
	}
	return basis * duck * interpolate(f, [0, 20, ende - 70, ende - 4], [0, 1, 1, 0], klemm);
};

export const Tonspur: React.FC<{cues: Cue[]; saetze: Sprechen[]; ende: number; musik: string; basis: number; tonLaut: number}> = ({cues, saetze, ende, musik: datei, basis, tonLaut}) => (
	<>
		<Audio name="Musik" src={staticFile(datei)} volume={(f) => musik(f, cues, ende, basis)} durationInFrames={ende} />
		{cues.map(([f, t], i) => (
			<Audio key={i} name={t} from={f} durationInFrames={TON[t].dauer + 2} src={staticFile(`sfx/${t}.wav`)} volume={TON[t].laut * tonLaut} />
		))}
		{saetze.map((s) => (
			<Audio key={s.id} name={`Stimme ${s.id}`} from={s.start} durationInFrames={laenge(s) + 2} src={staticFile(`vo/vo-${s.id}.mp3`)} volume={1} />
		))}
	</>
);
