import { LitElement, html, css } from 'lit';
import './navigation.js';
import { globalStyles } from './styles.js';
import {
	iconStyles,
	IconSpinner,
	IconEdit,
	IconTrash,
	IconArrow,
	IconX,
} from './icons.js';
import {
	getDerivedFields,
	addChanges,
	addRatiosChange,
	priceForWhishedPer,
	incomeForWishedPER,
	calculateRatiosWithPrice,
} from '../utils/calculations.js';
import {
	constraints,
	validateEditedField,
} from '../pipeline/postprocessor/postprocessor.js';

export class Ticker extends LitElement {
	static properties = {
		ticker: { type: String },
		period: { type: String },
		data: { type: Object },
		periods: { type: Array },
		loading: { type: Boolean },
		price: { type: String },
		wishedPer: { type: String },
		openEdition: { type: Boolean },
		editData: { type: Object },
		invalid: { type: Boolean },
	};

	static styles = [
		globalStyles,
		iconStyles,
		css`
			:host {
				display: flex;
				height: 100%;
				width: 100%;
				flex-direction: column;
				text-align: center;
				gap: 30px;
				justify-content: center;
			}

			h1 {
				font-size: 16px;
				font-weight: 400;
				letter-spacing: 1.5px;
				text-align: center;
				width: 250px;
				cursor: default;
			}
			p {
				margin: 0;
			}

			.boxes-layout {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 16px;
				box-sizing: border-box;
				padding: 0;
				width: 85%;
				margin: 0 auto;
			}

			.box {
				background: rgba(200, 200, 200, 0.15);
				backdrop-filter: blur(10px);
				-webkit-backdrop-filter: blur(10px);
				border-radius: 15px;
				box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
				-webkit-app-region: no-drag;
				z-index: 10;
				padding: 15px;
				cursor: default;
			}

			/* default row style */
			.row {
				display: flex;
				justify-content: space-between;
				font-size: 12px;
				cursor: default;
				align-items: center;
				letter-spacing: 1px;
				height: 19px;
			}

			.row p {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				max-width: 100%;
			}

			.row,
			input {
				font-size: 14px;
			}

			.row-left-aligned {
				justify-content: left;
				gap: 12px;
			}

			/* odd count → single column */
			.single-col {
				display: flex;
				flex-direction: column;
				justify-content: center;
				gap: 20px;
			}

			/* even count → grid with 2 columns */
			.two-col {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 20px 30px; /* row-gap col-gap */
			}

			button {
				font-weight: 500;
				letter-spacing: 1.5px;
				height: 100%;
				width: 100%;
			}

			input {
				height: 25px;
				letter-spacing: 1px;
				border-radius: 10px;
				width: 55px;
				background-color: transparent;
				-webkit-appearance: none;
				appearance: none;
				border: none;
				padding: 4px 10px;
			}

			.left,
			.right {
				display: flex;
				flex-direction: column;
				gap: 16px;
			}

			.row-boxes {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 16px;
			}

			.na {
				opacity: 0.3;
			}
			.gray-text {
				opacity: 0.3;
				font-size: 8px;
			}
			.green-text {
				color: rgb(60, 189, 133);
				font-size: 8px;
			}
			.red-text {
				color: rgb(255, 69, 118);
				font-size: 8px;
			}
			.label {
				font-size: 8px;
			}

			.input-box {
				display: flex;
				flex-direction: column;
				gap: 23px;
				padding: 20px;
			}

			button:disabled svg {
				opacity: 1;
			}

			.edit-input::-webkit-outer-spin-button,
			.edit-input::-webkit-inner-spin-button {
				-webkit-appearance: none;
				margin: 0;
			}

			.edit-input {
				text-align: right;
			}

			form {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 10px;
				padding: 10px;
			}

			form button {
				grid-column: 2;
				justify-self: center;
				width: fit-content;
			}

			.field {
				display: flex;
				align-items: center;
				width: 210px;
				gap: 10px;
			}
			form input {
				width: 100%;
			}
		`,
	];

	constructor() {
		super();
		this.ticker = null;
		this.data = {};
		this.periods = [];
		this.period = null;
		this.loading = true;
		this.price = null;
		this.wishedPer = null;
		this.openEdition = false;
		this.editData = {};
		this.invalid = false;
	}

	connectedCallback() {
		super.connectedCallback();
		this.loadData();
	}

	async loadData() {
		try {
			const rows = await window.api.getTicker(this.ticker);
			if (!rows || rows.length === 0) {
				this.data = {};
				this.periods = [];
				this.period = null;
				return;
			}
			this.data = this.buildObj(rows);
			this.periods = Object.keys(this.data);
			this.period = this.periods[this.periods.length - 1];
		} catch (err) {
			console.error('Failed to load ticker:', err);
			this.data = {};
			this.periods = [];
			this.period = null;
		} finally {
			this.loading = false;
		}
	}

	buildObj(rows) {
		const out = {};
		for (const row of rows) {
			const key = `${row.year}-${row.period_type}`;

			const { id, ticker, year, period_type, ...rest } = row;

			out[key] = getDerivedFields(rest);
		}

		return addChanges(out);
	}

	async handleDelete() {
		try {
			if (this.periods.length === 1) {
				await window.api.deleteTicker(this.ticker);
				this.dispatchEvent(
					new CustomEvent('close', {
						bubbles: true,
						composed: true,
						detail: { deleted: true },
					})
				);
			} else {
				await window.api.deletePeriod(this.ticker, this.period);
				await this.loadData();
			}
		} catch (err) {
			console.error('handleDelete failed:', err);
			return false;
		}
	}

	handleDialog() {
		this.openEdition = !this.openEdition;

		if (!this.openEdition) {
			this.editData = {};
		} else {
			this.editData = Object.fromEntries(
				Object.entries(this.data[this.period]).filter(
					([key]) => key in constraints
				)
			);
		}
	}

	async handleEdit(e) {
		e?.preventDefault(); // prevent form submission reload

		try {
			const allValid = Object.entries(this.editData).every(([key, value]) =>
				validateEditedField(key, value)
			);

			if (!allValid) {
				throw new Error('Invalid data to edit');
			}

			const ok = await window.api.addFinances(
				this.ticker,
				this.period,
				this.editData
			);
			if (!ok) {
				throw new Error('Failed to save edited fields');
			}

			const currentPeriod = this.period;
			this.handleDialog();
			await this.loadData();
			this.period = currentPeriod;
		} catch (err) {
			console.error('handleEdit failed:', err);
			this.invalid = true;
			setTimeout(() => {
				this.invalid = false;
			}, 2000);
		}
	}

	static rows = [
		{ label: 'P / E', field: 'per', format: 'float', source: 'derivedRatios' },
		{
			label: 'P / BV',
			field: 'p_bv',
			format: 'float',
			source: 'derivedRatios',
		},
		{ label: 'EV', field: 'ev', format: 'int', source: 'derivedRatios' },
		{
			label: html`EV<sub>cap</sub>`,
			field: 'ev_cap',
			format: 'float',
			source: 'derivedRatios',
		},
		{
			label: html`EV / CF<sub>op</sub>`,
			field: 'ev_cfo',
			format: 'float',
			source: 'derivedRatios',
		},
		{
			label: 'EV / π',
			field: 'ev_net_income',
			format: 'float',
			source: 'derivedRatios',
		},

		{ label: 'CA', field: 'current_assets', format: 'int', source: 'data' },
		{
			label: 'NCA',
			field: 'non_current_assets',
			format: 'int',
			source: 'data',
		},
		{ label: 'TA', field: 'total_assets', format: 'int', source: 'data' },
		{
			label: 'Cash',
			field: 'cash_and_equivalents',
			format: 'int',
			source: 'data',
		},
		{
			label: 'CL',
			field: 'current_liabilities',
			format: 'int',
			source: 'data',
		},
		{
			label: 'NCL',
			field: 'non_current_liabilities',
			format: 'int',
			source: 'data',
		},
		{ label: 'TL', field: 'total_liabilities', format: 'int', source: 'data' },
		{ label: 'E', field: 'equity', format: 'int', source: 'data' },
		{ label: 'WC', field: 'working_capital', format: 'int', source: 'data' },
		{ label: 'WC / NCL', field: 'wc_ncl', format: 'float', source: 'data' },
		{
			label: html`Shares<sub>≈</sub>`,
			field: 'shares',
			format: 'int',
			source: 'data',
		},
		{ label: 'BV', field: 'book_value', format: 'float', source: 'data' },

		{ label: 'R', field: 'revenue', format: 'int', source: 'data' },
		{ label: 'π', field: 'net_income', format: 'int', source: 'data' },
		{ label: 'EPS', field: 'eps', format: 'float', source: 'data' },
		{
			label: html`M<sub>net</sub>`,
			field: 'net_margin',
			format: 'percent',
			source: 'data',
		},
		{
			label: 'ROA',
			field: 'roa',
			format: 'percent',
			source: 'data',
		},
		{ label: 'ROE', field: 'roe', format: 'percent', source: 'data' },

		{ label: 'Liquidity', field: 'liquidity', format: 'float', source: 'data' },
		{ label: 'Solvency', field: 'solvency', format: 'float', source: 'data' },
		{ label: 'Leverage', field: 'leverage', format: 'float', source: 'data' },

		{
			label: html`CF<sub>op</sub>`,
			field: 'cash_flow_from_operations',
			format: 'int',
			source: 'data',
		},
		{
			label: html`CF<sub>inv</sub>`,
			field: 'cash_flow_from_investing',
			format: 'int',
			source: 'data',
		},
		{
			label: html`CF<sub>fin</sub>`,
			field: 'cash_flow_from_financing',
			format: 'int',
			source: 'data',
		},

		{
			label: 'Score',
			field: 'score',
			format: 'float',
			source: 'derivedRatios',
		},
	];

	displayValue(field, format, data = this.data, grayChange = false) {
		if (
			!data ||
			data[field] == null ||
			typeof data[field] !== 'number' ||
			isNaN(data[field])
		) {
			return html`<p class="na">NA</p>`;
		}

		const val = data[field];
		const changeKey = field + '_change';
		const change = data[changeKey];
		let changeHTML = '';

		if (change) {
			const changeFormatted = new Intl.NumberFormat('en-US', {
				minimumFractionDigits: 1,
				maximumFractionDigits: 1,
			}).format(change);

			let colorClass = 'gray-text';
			if (!grayChange) {
				if (change > 0) {
					colorClass = 'green-text';
				} else if (change < 0) {
					colorClass = 'red-text';
				}
			}

			changeHTML = html`<sub class="${colorClass}"> ${changeFormatted}%</sub>`;
		}

		const formatMillions = (num, fractionDigits = 2) => {
			return (
				new Intl.NumberFormat('en-US', {
					minimumFractionDigits: fractionDigits,
					maximumFractionDigits: fractionDigits,
				}).format(num / 1_000_000) + 'M'
			);
		};

		if (field === 'score') {
			const formatted = new Intl.NumberFormat('en-US', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(val);
			return html`<p>
				${changeHTML}${formatted} <sub class="label gray-text">score</sub>
			</p>`;
		}

		if (format === 'float') {
			const formatted = new Intl.NumberFormat('en-US', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(val);
			return html`<p>${changeHTML}${formatted}</p>`;
		} else if (format === 'percent') {
			const formatted = new Intl.NumberFormat('en-US', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(val);
			return html`<p>${changeHTML}${formatted}%</p>`;
		} else {
			const formatted =
				Math.abs(val) > 999_999_999
					? formatMillions(val, 0)
					: new Intl.NumberFormat('en-US', {
							maximumFractionDigits: 0,
					  }).format(val);
			return html`<p>${changeHTML}${formatted}</p>`;
		}
	}

	get derivedRatios() {
		let derivedRatios = calculateRatiosWithPrice(
			this.price,
			this.data[this.period]
		);
		let prevDerivedRatios;

		const [year, period] = this.period.split('-');
		const prevPeriod = `${+year - 1}-${period}`;
		if (!this.data[prevPeriod]) {
			return derivedRatios;
		}

		prevDerivedRatios = calculateRatiosWithPrice(
			this.price,
			this.data[prevPeriod]
		);

		return addRatiosChange(derivedRatios, prevDerivedRatios);
	}

	renderEditableFields() {
		return html`
			${this.constructor.rows
				.filter((row) => row.field in this.editData)
				.map((row) => {
					const key = row.field;
					const label = row.label;
					const value = this.editData[key];

					const { min, max } = constraints[key];
					const maxLength = String(Math.floor(Math.abs(max))).length;

					const isFloat = key === 'eps';
					const allowNegative = min < 0;

					const handleInput = (e) => {
						let inputVal = e.target.value;

						let regex;
						if (isFloat) {
							regex = allowNegative ? /^-?\d*(\.\d*)?$/ : /^\d*(\.\d*)?$/;
						} else {
							regex = allowNegative ? /^-?\d*$/ : /^\d*$/;
						}

						if (!regex.test(inputVal)) {
							inputVal = this.editData[key]?.toString() ?? '';
						}

						const numPart = inputVal.replace('-', '').split('.')[0];
						if (numPart.length > maxLength) {
							inputVal = this.editData[key]?.toString() ?? '';
						}

						let parsed = null;
						if (
							inputVal !== '' &&
							inputVal !== '-' &&
							inputVal !== '.' &&
							inputVal !== '-.'
						) {
							const n = Number(inputVal);
							if (!Number.isNaN(n)) {
								parsed = n;
							}
						}

						this.editData = {
							...this.editData,
							[key]: parsed,
						};

						e.target.value = inputVal;
					};

					return html`
						<div class="field">
							<label>${label}</label>
							<input
								class="edit-input"
								type="text"
								placeholder=${(typeof label === 'string'
									? label
									: label.strings?.join('') ?? key
								).replace(/<[^>]+>/g, '')}
								.value=${value ?? ''}
								maxlength=${maxLength +
								(allowNegative ? 1 : 0) +
								(isFloat ? 1 : 0)}
								@input=${handleInput}
							/>
						</div>
					`;
				})}
		`;
	}

	renderBox(slice) {
		const isOdd = slice.length % 2 !== 0;
		return html`
			<div class="box ${isOdd ? 'single-col' : 'two-col'}">
				${slice.map(
					(r) => html`
						<div class="row">
							<p>${r.label}</p>
							${this.displayValue(
								r.field,
								r.format,
								r.source === 'derivedRatios'
									? this.derivedRatios
									: this.data[this.period],
								r.source === 'derivedRatios' ? true : false
							)}
						</div>
					`
				)}
			</div>
		`;
	}

	render() {
		if (this.loading) {
			return html` <div>${IconSpinner}</div>`;
		}

		return html`
			<div class="ui-container">
				<button
					aria-label="Back"
					@click=${() =>
						this.dispatchEvent(
							new CustomEvent('close', { bubbles: true, composed: true })
						)}
				>
					<svg width="20" height="20" class="rot-270">${IconArrow}</svg>
				</button>
				<h1>${this.ticker} ${this.period}</h1>
				<button aria-label="Edit" @click=${this.handleDialog}>
					<svg width="20" height="20">${IconEdit}</svg>
				</button>

				<button aria-label="Delete" @click=${this.handleDelete}>
					<svg width="20" height="20">${IconTrash}</svg>
				</button>
			</div>

			<div class="boxes-layout">
				<!-- Left side -->
				<div class="left">
					${this.renderBox(Ticker.rows.slice(0, 6))}
					${this.renderBox(Ticker.rows.slice(6, 18))}
				</div>

				<!-- Right side -->
				<div class="right">
					<div class="box input-box">
						<div class="row row-left-aligned">
							<input
								id="price"
								type="text"
								placeholder="price"
								.value=${this.price ?? ''}
								@input=${(e) => {
									let v = e.target.value;

									v = v.replace(/[^0-9.]/g, '');
									const parts = v.split('.');
									if (parts.length > 2) {
										v = parts[0] + '.' + parts.slice(1).join('');
									}

									const digitsOnly = v.replace(/\D/g, '');
									if (digitsOnly.length > 4) {
										let count = 0;
										v = v
											.split('')
											.filter((ch) => {
												if (/\d/.test(ch)) {
													if (count < 4) {
														count++;
														return true;
													}
													return false;
												}
												return ch === '.';
											})
											.join('');
									}

									e.target.value = v;
									this.price = v;
								}}
							/>

							${this.displayValue('score', 'float', this.derivedRatios, false)}
						</div>
						<div class="row row-left-aligned">
							<input
								id="wishedper"
								type="text"
								placeholder="w  P / E"
								.value=${this.wishedPer ?? ''}
								@input=${(e) => {
									let v = e.target.value;

									v = v.replace(/[^0-9]/g, '');

									v = v.slice(0, 3);

									e.target.value = v;
									this.wishedPer = v;
								}}
							/>
							<p>
								${priceForWhishedPer(
									this.wishedPer,
									this.data[this.period].eps
								)}
							</p>
							<p>
								${incomeForWishedPER(
									this.price,
									this.wishedPer,
									this.data[this.period].shares,
									this.data[this.period].net_income
								)}
							</p>
						</div>
					</div>

					${this.renderBox(Ticker.rows.slice(18, 24))}

					<div class="row-boxes">
						${this.renderBox(Ticker.rows.slice(24, 27))}
						${this.renderBox(Ticker.rows.slice(27, 30))}
					</div>
				</div>
			</div>

			<dialog-component
				?open=${this.openEdition}
				@dialog-closed=${this.handleDialog}
			>
				<form @submit=${this.handleEdit}>
					${this.renderEditableFields()}
					<button type="submit" ?disabled=${this.invalid}>
						${this.invalid
							? html`<svg width="20" height="20">${IconX}</svg>`
							: html`<svg width="20" height="20" class="rot-90">
									${IconArrow}
							  </svg>`}
					</button>
				</form>
			</dialog-component>

			<navigation-component
				.currentPage=${this.periods.indexOf(this.period)}
				.totalPages=${this.periods.length}
				@prev=${() =>
					(this.period = this.periods[this.periods.indexOf(this.period) - 1])}
				@next=${() =>
					(this.period = this.periods[this.periods.indexOf(this.period) + 1])}
			></navigation-component>
		`;
	}
}

customElements.define('ticker-component', Ticker);
