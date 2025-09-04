const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
	getTickersCount: () => ipcRenderer.invoke('db:getTickersCount'),
	getTickers: (page, pageSize) =>
		ipcRenderer.invoke('db:getTickers', { page, pageSize }),
	getTicker: (ticker) => ipcRenderer.invoke('db:getTicker', { ticker }),
	deleteTicker: (ticker) => ipcRenderer.invoke('db:deleteTicker', { ticker }),
	deletePeriod: (ticker, period) =>
		ipcRenderer.invoke('db:deletePeriod', { ticker, period }),
	addFinances: (ticker, period, postprocessed) =>
		ipcRenderer.invoke('db:addFinances', { ticker, period, postprocessed }),
	getDbPath: () => ipcRenderer.invoke('db:getPath'),
	shutdown: () => ipcRenderer.send('app:shutdown'),
	selectFile: () => ipcRenderer.invoke('dialog:openFile'),
	fileWriter: (filename, content, isRaw) =>
		ipcRenderer.invoke('fileWriter', filename, content, isRaw),
	readFileBuffer: (filePath) => ipcRenderer.invoke('readFileBuffer', filePath),
	runAI: (cleanedChunks, hits, minHits, period) =>
		ipcRenderer.invoke('ai:run', cleanedChunks, hits, minHits, period),
	get: () => ipcRenderer.invoke('settings:get'),
	update: (updates) => ipcRenderer.invoke('settings:update', updates),
});
