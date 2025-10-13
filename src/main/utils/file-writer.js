import fsp from 'fs/promises';
import path from 'path';
import { getConfig } from './config.js';

export async function fileWriter(filename, content, isRaw = false) {
	const config = getConfig();

	if (!config.filewriter_abs_path || config.filewriter_abs_path.trim() === '') {
		return false;
	}

	try {
		await fsp.mkdir(config.filewriter_abs_path, { recursive: true });

		let targetPath;
		if (isRaw) {
			if (
				config.filewriter_raw_abs_path &&
				config.filewriter_raw_abs_path.trim() !== ''
			) {
				await fsp.mkdir(config.filewriter_raw_abs_path, { recursive: true });
				targetPath = path.join(
					config.filewriter_raw_abs_path,
					`${filename}.txt`
				);
			} else {
				targetPath = path.join(config.filewriter_abs_path, `raw_parsed.txt`);
			}
		} else {
			targetPath = path.join(config.filewriter_abs_path, `${filename}.txt`);
		}

		await fsp.writeFile(targetPath, content, 'utf8');
		return true;
	} catch (err) {
		console.error('fileWriter failed to write file:', err);
		return false;
	}
}
