import OpenAI from 'openai';
import {
	getSystemPromptOpenAI,
	promptEngineerCleanerOpenAI,
	promptEngineerSubmitterOpenAI,
} from './prompts.js';
import { fileWriter } from '../utils/file-writer.js';

let openAIClient = null;
let openAIReady = false;

export async function initOpenAI(apiKey) {
	if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
		throw new Error('OpenAI API key is missing or empty.');
	}

	try {
		const client = new OpenAI({ apiKey: apiKey.trim() });

		// ping to verify key
		await client.models.list();

		openAIClient = client;
		openAIReady = true;
		return openAIClient;
	} catch (err) {
		openAIClient = null;
		openAIReady = false;

		if (err?.status === 401) {
			throw new Error('Invalid OpenAI API key (401).');
		}
		if (err?.code === 'ENOTFOUND' || err?.errno === 'ENOTFOUND') {
			throw new Error('Network error while contacting OpenAI (ENOTFOUND).');
		}
		throw new Error(
			`Failed to initialize OpenAI client: ${err?.message || String(err)}`
		);
	}
}

function getAIClient() {
	if (!openAIReady || !openAIClient) {
		throw new Error(
			'OpenAI client not initialized. Call initOpenAI() at startup.'
		);
	}
	return openAIClient;
}

const makeBalance = () => ({
	units: null,
	cash_and_equivalents: null,
	current_assets: null,
	non_current_assets: null,
	total_assets: null,
	current_liabilities: null,
	non_current_liabilities: null,
	total_liabilities: null,
	equity: null,
});

const makeIncome = () => ({
	units: null,
	revenue: null,
	net_income: null,
	eps: null,
});

const makeCashFlow = () => ({
	units: null,
	cash_flow_from_operations: null,
	cash_flow_from_investing: null,
	cash_flow_from_financing: null,
});

export const runAI = async (cleanedChunks, hits, minHits, period) => {
	/*
        cleanedChunks = {
            balance: {
                text: string,
                units: number,
            },
            income: {
                text: string,
                units: number,
            },
            cashFlow: {
                text: string,
                units: number,
            }
        }
        */

	const client = getAIClient();

	let balance = makeBalance();
	let income = makeIncome();
	let cashFlow = makeCashFlow();

	try {
		if (!hits || typeof hits.balance === 'undefined') {
			throw new Error(
				'Invalid hits object passed to runAI: ' + JSON.stringify(hits)
			);
		}

		if (!cleanedChunks || !cleanedChunks.balance) {
			throw new Error(
				'Invalid cleanedChunks object passed to runAI: ' +
					JSON.stringify(cleanedChunks)
			);
		}

		const tasks = {};

		if (hits.balance >= minHits) {
			tasks.balance = runOpenAIPipe(
				client,
				cleanedChunks.balance,
				'balance',
				period,
				balance
			);
		}

		if (hits.income >= minHits) {
			tasks.income = runOpenAIPipe(
				client,
				cleanedChunks.income,
				'income',
				period,
				income
			);
		}

		if (hits.cashFlow >= minHits) {
			tasks.cashFlow = runOpenAIPipe(
				client,
				cleanedChunks.cashFlow,
				'cashFlow',
				period,
				cashFlow
			);
		}

		if (Object.keys(tasks).length === 0) {
			return { tokens: { input: 0, output: 0 }, balance, income, cashFlow };
		}

		const results = await Promise.all(
			Object.entries(tasks).map(([key, promise]) =>
				promise.then((res) => [key, res])
			)
		);
		const updated = Object.fromEntries(results);

		({ balance, income, cashFlow } = {
			...{ balance, income, cashFlow },
			...updated,
		});

		const tokens = {
			input: 0,
			output: 0,
		};

		for (const section of [balance, income, cashFlow]) {
			if (section.inputTokens) tokens.input += section.inputTokens;
			if (section.outputTokens) tokens.output += section.outputTokens;
		}

		return { tokens, balance, income, cashFlow };
	} catch (err) {
		console.error('OpenAI request failed:', err);
		return false;
	}
};

function buildOpenAISchema(template, units) {
	const skipUnits = typeof units === 'number' && units !== 0;

	const properties = {};
	const required = [];
	for (const key of Object.keys(template)) {
		if (key === 'units' && skipUnits) continue;
		properties[key] = { type: ['number', 'null'] };
		required.push(key);
	}

	return {
		type: 'json_schema',
		name: 'financial_data',
		schema: {
			type: 'object',
			properties,
			required,
			additionalProperties: false,
		},
		strict: true,
	};
}

async function runOpenAIPipe(client, cleanedChunk, target, period, template) {
	const roles = getSystemPromptOpenAI(target); // role.cleaner || role.submitter
	const cleanerPrompt = promptEngineerCleanerOpenAI(
		cleanedChunk.text,
		target,
		cleanedChunk.units
	);

	const model = 'gpt-5-mini';

	const cleanerResp = await client.responses.create({
		model: model,
		input: [
			{ role: 'system', content: roles.cleaner },
			{
				role: 'user',
				content: cleanerPrompt,
			},
		],
	});

	const submitterPrompt = promptEngineerSubmitterOpenAI(
		cleanerResp.output_text,
		period
	);

	fileWriter(target + '_submitter', submitterPrompt, false);

	const schema = buildOpenAISchema(template, cleanedChunk.units);

	const submitterResp = await client.responses.create({
		model: model,
		input: [
			{ role: 'system', content: roles.submitter },
			{
				role: 'user',
				content: submitterPrompt,
			},
		],
		reasoning: {
			effort: 'low',
		},
		text: {
			verbosity: 'low',
			format: schema,
		},
	});

	const inputTokens =
		(cleanerResp?.usage?.input_tokens || 0) +
		(submitterResp?.usage?.input_tokens || 0);
	const outputTokens =
		(cleanerResp?.usage?.output_tokens || 0) +
		(submitterResp?.usage?.output_tokens || 0);

	let parsed = template;
	if (submitterResp?.output_text) {
		try {
			parsed = JSON.parse(submitterResp.output_text);
		} catch (e) {
			console.warn('Failed to parse JSON output_text; using template.', e);
		}
	}

	if (typeof cleanedChunk.units === 'number' && cleanedChunk.units !== 0) {
		parsed.units = cleanedChunk.units;
	}

	return { inputTokens, outputTokens, ...parsed };
}
