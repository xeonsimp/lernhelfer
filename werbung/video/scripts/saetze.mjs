// Gibt die Sätze des Voice-overs mit Start und spätestem Ende (Frames bei 60 fps) als JSON aus, direkt aus dem Zeitplan in src/ (für scripts/stimme.py).
// Aufruf aus werbung/video:  node scripts/saetze.mjs
import {build} from 'esbuild';
import {rmSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const r = await build({
	stdin: {contents: "import {REEL} from './src/reel'; import {zeitplan} from './src/Spot'; export const saetze = zeitplan(REEL).saetze;", resolveDir: '.', loader: 'ts'},
	bundle: true, platform: 'node', format: 'esm', packages: 'external', jsx: 'automatic', write: false, logLevel: 'error',
});
const datei = 'node_modules/.saetze.mjs'; // in node_modules, damit react und remotion auflösbar sind
writeFileSync(datei, r.outputFiles[0].text);
try {
	const {saetze} = await import(pathToFileURL(datei).href);
	process.stdout.write(JSON.stringify(saetze));
} finally {
	rmSync(datei);
}
