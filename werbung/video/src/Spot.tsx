// Szenenfolge mit gewischten Übergängen (12 Frames) und bildgenauem Ton; der kurze Spot und das lange Reel nutzen sie
import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {linearTiming, TransitionSeries, type TransitionPresentationComponentProps} from '@remotion/transitions';
import {Hook, hookTon, Kern, kernTon, Lernen, lernenTon, Wende, wendeTon} from './szenen1';
import {Cta, ctaTon, Podcast, podcastTon, Pruefung, pruefungTon, Vortrag, vortragTon} from './szenen2';
import {type Cue, type Sprechen, Tonspur} from './ton';

export const UEBERGANG = 12;
/** Voice-over: ab diesem Frame der Szene wird der Text gesprochen (Aufnahme von scripts/stimme.py) */
export type Satz = [bei: number, text: string];
export type Szene = {name: string; dauer: number; C: React.FC; ton: Cue[]; stimme?: Satz[]};
const LUFT = 12; // mindestens 0,2 s Pause vor dem nächsten Satz

/** Anfang jeder Szene, Gesamtlänge und alle Töne und Sätze auf der Zeitachse des Films */
export const zeitplan = (szenen: Szene[]) => {
	const starts = szenen.map((_, i) => szenen.slice(0, i).reduce((s, x) => s + x.dauer - UEBERGANG, 0));
	const dauer = starts[starts.length - 1] + szenen[szenen.length - 1].dauer;
	const cues: Cue[] = szenen.flatMap((s, i) => s.ton.map(([f, t]) => [starts[i] + f, t] as Cue));
	// Szenenwechsel bekommen einen Swoosh, wenn die neue Szene nicht selbst mit einem beginnt
	for (let i = 1; i < szenen.length; i++) if (!szenen[i].ton.some(([f, t]) => t === 'swoosh' && f < 12)) cues.push([starts[i], 'swoosh']);
	// id: Nummer der Szene, bei mehreren Sätzen mit a, b, c; jeder Satz darf bis kurz vor den nächsten dauern, der letzte bis eine halbe Sekunde vor Schluss
	const folge = szenen.flatMap((s, i) => (s.stimme ?? []).map(([f, text], j, alle) => ({id: String(i + 1).padStart(2, '0') + (alle.length > 1 ? 'abcdef'[j] : ''), start: starts[i] + f, text})));
	const saetze: Sprechen[] = folge.map((s, i) => ({...s, bis: folge[i + 1] ? folge[i + 1].start - LUFT : dauer - 30}));
	return {starts, dauer, cues, saetze};
};

/** Wischen wie ein Marker: die neue Szene kommt mit schräger Kante von links, die alte rückt ein Stück mit */
const Wisch: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({children, presentationDirection, presentationProgress: p}) => {
	if (presentationDirection === 'exiting') return <AbsoluteFill style={{translate: `${-p * 4}% 0`}}>{children}</AbsoluteFill>;
	const x = p * 125 - 10;
	return <AbsoluteFill style={{clipPath: `polygon(0 0, ${x + 10}% 0, ${x}% 100%, 0 100%)`}}>{children}</AbsoluteFill>;
};
const wisch = {component: Wisch, props: {}};

/** musikLaut: Grundlautstärke der Musik, passend zu ihrer Lautheit (die Effekte sollen gleich laut bleiben); tonLaut: Faktor auf alle Effekte */
export const Film: React.FC<{szenen: Szene[]; musik: string; musikLaut: number; tonLaut?: number}> = ({szenen, musik, musikLaut, tonLaut = 1}) => {
	const {dauer, cues, saetze} = zeitplan(szenen);
	return (
		<AbsoluteFill style={{backgroundColor: '#151515'}}>
			<TransitionSeries>
				{szenen.flatMap(({name, dauer: d, C}, i) => [
					i > 0 && <TransitionSeries.Transition key={`t${i}`} presentation={wisch} timing={linearTiming({durationInFrames: UEBERGANG, easing: Easing.inOut(Easing.quad)})} />,
					<TransitionSeries.Sequence key={name} name={name} durationInFrames={d}>
						<C />
					</TransitionSeries.Sequence>,
				])}
			</TransitionSeries>
			<Tonspur cues={cues} saetze={saetze} ende={dauer} musik={musik} basis={musikLaut} tonLaut={tonLaut} />
		</AbsoluteFill>
	);
};

export const SZENEN: Szene[] = [
	{name: 'Hook', dauer: 270, C: Hook, ton: hookTon},
	{name: 'Wende', dauer: 250, C: Wende, ton: wendeTon},
	{name: 'Kern', dauer: 530, C: Kern, ton: kernTon},
	{name: 'Lernen', dauer: 420, C: Lernen, ton: lernenTon},
	{name: 'Vortrag', dauer: 570, C: Vortrag, ton: vortragTon()},
	{name: 'Podcast', dauer: 330, C: Podcast, ton: podcastTon},
	{name: 'Pruefung', dauer: 350, C: Pruefung, ton: pruefungTon},
	{name: 'CTA', dauer: 420, C: Cta, ton: ctaTon},
];
export const DAUER = zeitplan(SZENEN).dauer;
export const Spot: React.FC = () => <Film szenen={SZENEN} musik="sfx/bgm.wav" musikLaut={0.6} />;
