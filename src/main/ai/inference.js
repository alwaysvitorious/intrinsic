import OpenAI from 'openai';
import {
	getSystemPromptOpenAI,
	promptEngineerCleanerOpenAI,
	promptEngineerSubmitterOpenAI,
} from './prompts.js';
import { fileWriter } from '../main.js';

let openAIClient = null;

export const setupOpenai = (apiKey) => {
	if (openAIClient) return openAIClient;
	openAIClient = new OpenAI({ apiKey });
	return openAIClient;
};

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

	if (!openAIClient)
		throw new Error('OpenAI openAIClient not initialized. Review OpenAI key.');

	let balance = makeBalance();
	let income = makeIncome();
	let cashFlow = makeCashFlow();

	try {
		const tasks = {};

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

		if (hits.balance >= minHits) {
			tasks.balance = runOpenAIPipe(
				cleanedChunks.balance,
				'balance',
				period,
				balance
			);
		}

		if (hits.income >= minHits) {
			tasks.income = runOpenAIPipe(
				cleanedChunks.income,
				'income',
				period,
				income
			);
		}

		if (hits.cashFlow >= minHits) {
			tasks.cashFlow = runOpenAIPipe(
				cleanedChunks.cashFlow,
				'cashFlow',
				period,
				cashFlow
			);
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

		let tokens = {
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

async function runOpenAIPipe(cleanedChunk, target, period, template) {
	const roles = getSystemPromptOpenAI(target); // role.cleaner || role.submitter
	const cleanerPrompt = promptEngineerCleanerOpenAI(
		cleanedChunk.text,
		target,
		cleanedChunk.units
	);

	const model = 'gpt-5-mini';

	const cleanerResp = await openAIClient.responses.create({
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

	const submitterResp = await openAIClient.responses.create({
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
		cleanerResp.usage.input_tokens + submitterResp.usage.input_tokens;
	const outputTokens =
		cleanerResp.usage.output_tokens + submitterResp.usage.output_tokens;

	const parsed = submitterResp.output_text
		? JSON.parse(submitterResp.output_text)
		: template;

	if (typeof cleanedChunk.units === 'number' && cleanedChunk.units !== 0) {
		parsed.units = cleanedChunk.units;
	}

	return { inputTokens, outputTokens, ...parsed };
}
