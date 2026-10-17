import React from 'react';
import {Composition, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {DAUER, Film, Spot, zeitplan} from './Spot';
import {REEL} from './reel';

// Archivo (SIL OFL 1.1) aus fonts/ im Repo, variabel in Gewicht und Breite wie in der App
loadFont({family: 'Archivo', url: staticFile('fonts/Archivo.woff2'), weight: '100 900', stretch: '62% 125%'});

// Musik als Bett 12 dB unter der Stimme: musik-reel.wav hat −12,6 LUFS, die Sätze −16 LUFS, also Faktor 0,17 (≈ −28 LUFS); Effekte 2 dB leiser als im Spot
const Reel: React.FC = () => <Film szenen={REEL} musik="sfx/musik-reel.wav" musikLaut={0.17} tonLaut={0.8} />;

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="Lernhelfer-9x16" component={Spot} durationInFrames={DAUER} fps={60} width={1080} height={1920} />
		<Composition id="Lernhelfer-16x9" component={Spot} durationInFrames={DAUER} fps={60} width={1920} height={1080} />
		<Composition id="Lernhelfer-Reel" component={Reel} durationInFrames={zeitplan(REEL).dauer} fps={60} width={1080} height={1920} />
		<Composition id="Lernhelfer-Reel-16x9" component={Reel} durationInFrames={zeitplan(REEL).dauer} fps={60} width={1920} height={1080} />
	</>
);
