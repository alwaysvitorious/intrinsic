import { cleanChunk } from '../pipeline/preprocessor/cleaner.js';
import { Chunker } from '../pipeline/preprocessor/chunker.js';

const chunker = new Chunker();

const registry = {
	cleanChunk,
	findChunk: (...args) => chunker.findChunk(...args),
};

self.onmessage = async (event) => {
	const { fn, args } = event.data;
	const handler = registry[fn];
	if (!handler) {
		self.postMessage({ error: `Unknown function: ${fn}` });
		return;
	}

	try {
		const result = await handler(...args); // will await even if handler is sync
		self.postMessage({ result });
	} catch (err) {
		self.postMessage({ error: err.message });
	}
};
