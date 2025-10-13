import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { app } from 'electron/main';

let settingsPath;
let settings = {};

// Initialize settings file path once app is ready
export function initSettings() {
	settingsPath = path.join(app.getPath('userData'), 'settings.json');
}

// Load settings (returns the in-memory object)
export function loadSettings() {
	if (!settingsPath) throw new Error('initSettings() must be called first.');
	try {
		const raw = fs.readFileSync(settingsPath, 'utf8');
		settings = JSON.parse(raw);
	} catch {
		settings = {}; // start fresh
	}
	return settings;
}

// Save current settings to disk
export async function saveSettings() {
	if (!settingsPath) throw new Error('initSettings() must be called first.');
	await fsp.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
}

// Get current settings object
export function getSettings() {
	return settings;
}
