import { LitElement, html, css } from 'lit';
import { globalStyles } from './styles.js';
import './dialog.js';

export class SettingsDialog extends LitElement {
	static properties = {
		open: { type: Boolean, reflect: true },
		lang: { type: String },
	};

	constructor() {
		super();
		this.open = false;
		this.lang = 'EN';
	}

	static styles = [
		globalStyles,
		css`
			.settings-wrapper {
				display: flex;
				align-items: center;
				justify-content: center;
				min-height: 110px;
				min-width: 400px;
			}
			.settings-btn {
				font-weight: 400;
				letter-spacing: 1px;
			}
		`,
	];

	toggleLang() {
		this.lang = this.lang === 'EN' ? 'ES' : 'EN';
		window.api.update({ lang: this.lang });
		window.dispatchEvent(
			new CustomEvent('lang-changed', { detail: this.lang })
		);
		this.dispatchEvent(new CustomEvent('lang-updated', { detail: this.lang }));
	}

	render() {
		return html`
			<dialog-component
				?open=${this.open}
				@dialog-closed=${() => this.dispatchEvent(new CustomEvent('close'))}
			>
				<div class="settings-wrapper">
					<button
						aria-label="Language"
						class="settings-btn"
						@click=${this.toggleLang}
					>
						${this.lang}
					</button>
				</div>
			</dialog-component>
		`;
	}
}

customElements.define('settings-dialog', SettingsDialog);
