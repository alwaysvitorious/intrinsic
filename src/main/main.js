import { app, BrowserWindow, dialog, ipcMain } from 'electron/main';
import { Menu } from 'electron';
import { openDb, closeDb } from './db/init.js';
import { loadConfig } from './utils/config.js';
import {
	initSettings,
	loadSettings,
	saveSettings,
	getSettings,
} from './utils/settings.js';
import { fileWriter } from './utils/file-writer.js';
import {
	getTickersCount,
	getTickers,
	getTicker,
	addFinances,
	deletePeriod,
	deleteTicker,
} from './db/queries.js';
import { initOpenAI, runAI } from './ai/inference.js';
import path from 'path';
import fsp from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.setName('Intrinsic');

// Single-instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
	app.quit();
	process.exit(0);
}

let mainWindow = null;
let db = null;

let config;
try {
	config = loadConfig();
} catch (err) {
	console.error('Failed to load config:', err);
	process.exit(1);
}

// ───────── Window ─────────
function createWindow() {
	mainWindow = new BrowserWindow({
		width: 900,
		height: 650,
		frame: false,
		resizable: false,
		backgroundColor: '#e6e6e6',
		show: false,
		webPreferences: {
			preload: path.join(__dirname, 'preload.cjs'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
			devTools: process.env.NODE_ENV === 'development',
		},
	});

	if (process.env.NODE_ENV === 'development') {
		mainWindow.loadURL('http://localhost:5173');
	} else {
		mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
	}

	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
	});
}

app.on('second-instance', () => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) mainWindow.restore();
		mainWindow.focus();
	}
});

// ───────── Lifecycle ─────────
app.whenReady().then(async () => {
	initSettings();
	loadSettings();

	// ---- DB init ----
	try {
		const dbDir = path.join(app.getPath('userData'), 'sqlite');
		const dbName = 'intrinsic.sqlite';
		db = openDb({ dbDir, dbFilename: dbName });
		if (process.env.NODE_ENV === 'development') {
			console.log('DB path:', path.join(dbDir, dbName));
		}
	} catch (err) {
		console.error('Could not open database:', err);
		dialog.showErrorBox('Database Error', String(err));
		app.quit();
		setTimeout(() => process.exit(1), 3000); // belt & suspenders
		return; // stop startup
	}

	// ---- OpenAI init ----
	try {
		await initOpenAI(config.openai_api_key);
	} catch (err) {
		console.error('Could not initialize OpenAI:', err);
		dialog.showErrorBox('OpenAI Error', String(err));
		app.quit();
		setTimeout(() => process.exit(1), 3000); // belt & suspenders
		return; // stop startup
	}

	ipcMain.handle('settings:get', async () => getSettings());

	ipcMain.handle('settings:update', async (_e, updates) => {
		Object.assign(getSettings(), updates);
		await saveSettings();
		return getSettings();
	});

	ipcMain.handle('db:getTickersCount', () => {
		try {
			return getTickersCount(db);
		} catch (err) {
			console.error('db:getTickersCount failed:', err);
			return { error: err.message };
		}
	});

	ipcMain.handle('db:getTickers', (e, { page, pageSize }) => {
		try {
			const p = Number.isInteger(page) ? page : 0;
			const ps = Number.isInteger(pageSize) ? pageSize : 20;
			return getTickers(db, p, ps);
		} catch (err) {
			console.error('db:getTickers failed:', err);
			return { error: err.message };
		}
	});

	ipcMain.handle('db:getTicker', (e, { ticker }) => {
		try {
			if (!ticker) throw new Error('Ticker is required');
			return getTicker(db, ticker);
		} catch (err) {
			console.error('db:getTicker failed:', err);
			return { error: err.message };
		}
	});

	ipcMain.handle('db:deleteTicker', (e, { ticker }) => {
		try {
			return deleteTicker(db, ticker);
		} catch (err) {
			console.error('db:deleteTicker failed:', err);
			return { error: err.message };
		}
	});

	ipcMain.handle('db:deletePeriod', (e, { ticker, period }) => {
		try {
			return deletePeriod(db, ticker, period);
		} catch (err) {
			console.error('db:deletePeriod failed:', err);
			return { error: err.message };
		}
	});

	ipcMain.handle('db:addFinances', (e, { ticker, period, postprocessed }) => {
		try {
			const ok = addFinances(db, ticker, period, postprocessed);
			return ok;
		} catch (err) {
			console.error('db:addFinances failed:', err);
			return false;
		}
	});

	ipcMain.handle('dialog:openFile', async () => {
		const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
			properties: ['openFile'],
			filters: [
				{
					name: 'Supported Files',
					extensions: ['pdf', 'html', 'xhtml', 'xml', 'mht', 'mhtml'],
				},
			],
		});
		if (canceled) return null;
		return filePaths[0];
	});

	ipcMain.handle('fileWriter', async (_event, filename, content, isRaw) => {
		return fileWriter(filename, content, isRaw);
	});

	ipcMain.handle('readFileBuffer', async (_event, filePath) => {
		try {
			const buf = await fsp.readFile(filePath);
			return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		} catch (err) {
			console.error('Error reading file:', err);
			return null;
		}
	});

	ipcMain.handle(
		'ai:run',
		async (_event, cleanedChunks, hits, minHits, period) => {
			try {
				return await runAI(cleanedChunks, hits, minHits, period);
			} catch (err) {
				console.error('OpenAI request failed:', err);
				return null;
			}
		}
	);

	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});

	ipcMain.on('app:shutdown', () => {
		if (mainWindow) {
			mainWindow.destroy();
		}
		app.quit();
	});
});

if (process.env.NODE_ENV !== 'development') {
	const template = [
		{
			label: app.name,
			submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }],
		},
		{
			label: 'Edit',
			submenu: [
				{ role: 'undo' },
				{ role: 'redo' },
				{ type: 'separator' },
				{ role: 'cut' },
				{ role: 'copy' },
				{ role: 'paste' },
				{ role: 'delete' },
				{ type: 'separator' },
				{ role: 'selectAll' },
			],
		},
	];
	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
}

app.on('before-quit', () => {
	if (db) {
		try {
			closeDb(db);
		} catch {}
		db = null;
	}
});

app.on('will-quit', () => {
	if (db) {
		try {
			closeDb(db);
		} catch {}
		db = null;
	}
});

app.on('browser-window-created', (_, window) => {
	if (process.env.NODE_ENV !== 'development') {
		window.webContents.on('before-input-event', (event, input) => {
			if (
				(input.control || input.meta) &&
				input.shift &&
				input.key.toLowerCase() === 'i'
			) {
				event.preventDefault();
			}
			if (input.key === 'F12') {
				event.preventDefault();
			}
		});
	}
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
