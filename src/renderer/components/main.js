import { LitElement, html, css } from 'lit';
import './navigation.js';
import './submission.js';
import './settings.js';
import './ticker.js';
import { globalStyles } from './styles.js';
import { IconSpinner, iconStyles } from './icons.js';
import { labels } from '../utils/labels.js';

export class Tickers extends LitElement {
	static properties = {
		tickers: { type: Array },
		currentPage: { type: Number },
		totalPages: { type: Number },
		pageSize: { type: Number },
		loading: { type: Boolean },
		openedTicker: { type: String },
		lang: { type: String },
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

			#tickers-container {
				--cols: 4;
				--rows: 5;
				--gap: 10px;
				--pad: 26px;
				--cell: 38px;

				display: grid;
				place-items: center;
				width: 100%;
				max-width: 700px;
				margin: 0 auto;
				padding: var(--pad) 20px;

				height: calc(
					var(--rows) * var(--cell) + (var(--rows) - 1) * var(--gap) + 2 *
						var(--pad)
				);
				background: rgba(200, 200, 200, 0.15);
				backdrop-filter: blur(10px);
				-webkit-backdrop-filter: blur(10px);
				border-radius: 15px;
				box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
				-webkit-app-region: no-drag;
				z-index: 10;
			}

			#list {
				height: 100%;
				padding: 0;
				display: grid;
				grid-template-columns: repeat(var(--cols), 1fr);
				grid-template-rows: repeat(var(--rows), 1fr);
				gap: var(--gap);
				width: 100%;
			}

			#list li {
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 10px;
			}

			button {
				font-weight: 500;
				font-size: 15px;
				letter-spacing: 1.5px;
				height: 100%;
				width: 100%;
			}

			#empty {
				margin: 0 auto;
				text-align: center;
				letter-spacing: 1.5px;
			}
		`,
	];

	constructor() {
		super();
		this.tickers = [];
		this.currentPage = 0;
		this.totalPages = 1;
		this.pageSize = 20;
		this.loading = true;
		this.openedTicker = null;
		this.lang = 'EN';
	}

	connectedCallback() {
		super.connectedCallback();
		window.api.get().then((saved) => {
			if (saved.lang) this.lang = saved.lang;
		});

		this._langHandler = (e) => {
			this.lang = e.detail;
		};

		window.addEventListener('lang-changed', this._langHandler);
		this.loadComponentData();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		window.removeEventListener('lang-changed', this._langHandler);
	}

	async loadComponentData() {
		try {
			const count = await window.api.getTickersCount();
			if (!count) {
				this.tickers = [];
				this.totalPages = 1;
				this.loading = false;
				return;
			}
			this.totalPages = Math.max(1, Math.ceil(count / this.pageSize));
			this.currentPage = 0;
			await this.loadTickers(0, true);
		} catch (err) {
			console.error('Failed to load tickers:', err);
			this.tickers = [];
			this.totalPages = 1;
		} finally {
			this.loading = false;
		}
	}

	async loadTickers(index, firstLoad) {
		if (firstLoad) this.loading = true;
		this.currentPage = index;
		this.tickers = await window.api.getTickers(index, this.pageSize);
		this.loading = false;
	}

	render() {
		const t = labels[this.lang || 'EN'];

		if (this.loading) {
			return html` <div id="tickers-container">${IconSpinner}</div>`;
		} else if (this.openedTicker) {
			// ticker view
			return html`<ticker-component
				.ticker=${this.openedTicker}
				.lang=${this.lang}
				@close=${(e) => {
					this.openedTicker = null;
					if (e.detail?.deleted) {
						this.loadComponentData();
					}
				}}
			></ticker-component>`;
		} else {
			// main page
			return html`
				<submission-component
					@submission-success=${() => this.loadComponentData()}
				></submission-component>

				<div id="tickers-container">
					${this.tickers.length === 0
						? html`<p id="empty">${t.emptyMessage}</p>`
						: html`
								<ul id="list">
									${this.tickers.map(
										(tick) =>
											html`<li>
												<button @click=${() => (this.openedTicker = tick)}>
													${tick}
												</button>
											</li>`
									)}
								</ul>
						  `}
				</div>

				<navigation-component
					.currentPage=${this.currentPage}
					.totalPages=${this.totalPages}
					@prev=${() => this.loadTickers(this.currentPage - 1, false)}
					@next=${() => this.loadTickers(this.currentPage + 1, false)}
				></navigation-component>
			`;
		}
	}
}

customElements.define('tickers-component', Tickers);
