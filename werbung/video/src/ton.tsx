// Ton: synthetische Effekte (public/sfx, per ffmpeg erzeugt) bildgenau auf den Szenen, Musik unter Effekten 6 dB leiser.
import React from 'react';
import {Audio} from '@remotion/media';
import {interpolate, staticFile} from 'remotion';
import {klemm} from './lib';

export type Ton = 'scratch' | 'pop' | 'click' | 'ding' | 'swoosh' | 'tick';
export type Cue = [frame: number, ton: Ton];
// Länge in Frames bei 60 fps und Grundlautstärke
const TON: Record<Ton, {dauer: number; laut: number}> = {
	scratch: {dauer: 27, laut: 0.45},
	pop: {dauer: 6, laut: 0.8},
	click: {dauer: 3, laut: 0.9},
	ding: {dauer: 36, laut: 0.55},
	swoosh: {dauer: 17, laut: 0.55},
	tick: {dauer: 2, laut: 0.35},
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

export const Tonspur: React.FC<{cues: Cue[]; ende: number; musik: string; basis: number}> = ({cues, ende, musik: datei, basis}) => (
	<>
		<Audio name="Musik" src={staticFile(datei)} volume={(f) => musik(f, cues, ende, basis)} durationInFrames={ende} />
		{cues.map(([f, t], i) => (
			<Audio key={i} name={t} from={f} durationInFrames={TON[t].dauer + 2} src={staticFile(`sfx/${t}.wav`)} volume={TON[t].laut} />
		))}
	</>
);
