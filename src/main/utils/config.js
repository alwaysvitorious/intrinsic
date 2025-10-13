import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let CONFIG = null;

function expandAndNormalize(p) {
	if (typeof p === 'string' && p !== '') {
		// Expand ~
		if (p.startsWith('~')) {
			p = path.join(process.env.HOME || process.env.USERPROFILE, p.slice(1));
		}

		// Ensure trailing slash
		if (!p.endsWith(path.sep)) p += path.sep;
	}
	return p;
}

export function loadConfig() {
	if (CONFIG) return CONFIG;

	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const configPath = path.resolve(__dirname, '../../../config.json');

	const raw = fs.readFileSync(configPath, 'utf8');
	const cfg = JSON.parse(raw);

	cfg.filewriter_abs_path = expandAndNormalize(cfg.filewriter_abs_path);
	cfg.filewriter_raw_abs_path = expandAndNormalize(cfg.filewriter_raw_abs_path);

	CONFIG = cfg;
	return CONFIG;
}

//  Get the already-loaded config. Call loadConfig() first
export function getConfig() {
	if (!CONFIG) {
		throw new Error('Config not loaded. Call loadConfig() early in startup.');
	}
	return CONFIG;
}
