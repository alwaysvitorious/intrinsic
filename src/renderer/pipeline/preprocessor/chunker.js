import {
	WINDOW_SIZE,
	OVERLAP_STRIDE,
	BUFFER_SIZE,
	OUTPUT_CHUNK_SIZE,
	balanceIndicatorsEN,
	incomeIndicatorsEN,
	cashFlowIndicatorsEN,
	balanceIndicatorsES,
	incomeIndicatorsES,
	cashFlowIndicatorsES,
} from './chunker-consts.js';
import { runWorker } from '../../workers/run.js';

export class Chunker {
	constructor() {
		this.WINDOW_SIZE = WINDOW_SIZE;
		this.OVERLAP_STRIDE = OVERLAP_STRIDE;
		this.BUFFER_SIZE = BUFFER_SIZE;
		this.OUTPUT_CHUNK_SIZE = OUTPUT_CHUNK_SIZE;

		this.balanceIndicatorsENarr = Array.from(balanceIndicatorsEN);
		this.incomeIndicatorsENarr = Array.from(incomeIndicatorsEN);
		this.cashFlowIndicatorsENarr = Array.from(cashFlowIndicatorsEN);
		this.balanceIndicatorsESarr = Array.from(balanceIndicatorsES);
		this.incomeIndicatorsESarr = Array.from(incomeIndicatorsES);
		this.cashFlowIndicatorsESarr = Array.from(cashFlowIndicatorsES);
	}

	async getChunks(content, minHits) {
		let balanceResult = {};
		let incomeResult = {};
		let cashFlowResult = {};
		let language = 'EN';

		try {
			const lowerContent = this.normalizeText(content);

			// try EN
			[balanceResult, incomeResult, cashFlowResult] = await Promise.all([
				runWorker('findChunk', [
					content,
					lowerContent,
					this.balanceIndicatorsENarr,
				]),
				runWorker('findChunk', [
					content,
					lowerContent,
					this.incomeIndicatorsENarr,
				]),
				runWorker('findChunk', [
					content,
					lowerContent,
					this.cashFlowIndicatorsENarr,
				]),
			]);

			// not enough hits -> try ES
			if (
				balanceResult.hits < minHits ||
				incomeResult.hits < minHits ||
				cashFlowResult.hits < minHits
			) {
				language = 'ES';

				[balanceResult, incomeResult, cashFlowResult] = await Promise.all([
					runWorker('findChunk', [
						content,
						lowerContent,
						this.balanceIndicatorsESarr,
					]),
					runWorker('findChunk', [
						content,
						lowerContent,
						this.incomeIndicatorsESarr,
					]),
					runWorker('findChunk', [
						content,
						lowerContent,
						this.cashFlowIndicatorsESarr,
					]),
				]);
			}

			return {
				language,
				balance: balanceResult,
				income: incomeResult,
				cashFlow: cashFlowResult,
			};
		} catch (error) {
			console.error('Error in Chunker.getChunks:', error);
			throw new Error('Chunker failed');
		}
	}

	normalizeText(content) {
		return content
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, ''); // strip accents
	}

	findChunk(content, lowerContent, indicatorArray) {
		const { OVERLAP_STRIDE, WINDOW_SIZE, BUFFER_SIZE, OUTPUT_CHUNK_SIZE } =
			this;

		let bestStart = 0;
		let bestIndicators = new Set();
		let bestHits = 0;

		const contentLength = lowerContent.length;
		const foundIndicators = new Set();

		for (let i = 0; i < contentLength; i += OVERLAP_STRIDE) {
			foundIndicators.clear();

			const windowEnd = Math.min(i + WINDOW_SIZE, contentLength);
			const window = lowerContent.substring(i, windowEnd);

			for (const indicator of indicatorArray) {
				if (window.includes(indicator)) {
					foundIndicators.add(indicator);
				}
			}

			const count = foundIndicators.size;

			if (count > bestHits) {
				bestHits = count;
				bestStart = i;
				bestIndicators = new Set(foundIndicators);
			}
		}

		// chunk boundaries
		const chunkStart = bestStart > BUFFER_SIZE ? bestStart - BUFFER_SIZE : 0;
		const chunkLength = Math.min(
			OUTPUT_CHUNK_SIZE,
			content.length - chunkStart
		);
		const chunk = content.substring(chunkStart, chunkStart + chunkLength);

		return {
			chunk,
			hits: bestHits,
			indicators: Array.from(bestIndicators),
		};
	}
}
