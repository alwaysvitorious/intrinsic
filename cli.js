#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use electron installed in project dependencies
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const electronPath = require.resolve('electron/cli.js');

const mainPath = resolve(__dirname, 'src/main/main.js');

const child = spawn(process.execPath, [electronPath, mainPath], {
	stdio: 'inherit',
	shell: false,
	env: { ...process.env, NODE_ENV: 'production' },
});

child.on('exit', (code) => process.exit(code));
