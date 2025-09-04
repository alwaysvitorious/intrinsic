import { svg, css } from 'lit';

export const IconX = svg`
  <svg width="20" height="20" viewBox="0 0 24 24">
    <line x1="5" y1="5" x2="19" y2="19"
      stroke="black" stroke-width="2" stroke-linecap="square"/>
    <line x1="19" y1="5" x2="5" y2="19"
      stroke="black" stroke-width="2" stroke-linecap="square"/>
  </svg>
`;

export const IconArrow = svg`
  <svg width="20" height="20" viewBox="0 0 24 24" stroke="black" fill="black" stroke-width="0.6">
    <path d="m12.499 1-6.5 6.5.707.707 5.293-5.293V24h1V2.914l5.295 5.294.707-.707L12.499 1z"/>
  </svg>
`;

export const IconFile = svg`
  <svg width="20" height="20" viewBox="0 0 640 640" stroke="black" fill="black" stroke-width="0.6">
    <path d="M304 112L192 112C183.2 112 176 119.2 176 128L176 512C176
                     520.8 183.2 528 192 528L448 528C456.8 528 464 520.8 464 512L464
                      272L376 272C336.2 272 304 239.8 304 200L304 112zM444.1 224L352
                       131.9L352 200C352 213.3 362.7 224 376 224L444.1 224zM128
                        128C128 92.7 156.7 64 192 64L325.5 64C342.5 64 358.8 70.7
                         370.8 82.7L493.3 205.3C505.3 217.3 512 233.6 512 250.6L512
                          512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3
                           128 512L128 128z"/>
  </svg>
`;

export const IconEdit = svg`
  <svg width="20" height="20" viewBox="0 0 512 512" stroke="black" fill="black" stroke-width="0.1">
    <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4
     24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5
      16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6
       100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487
        138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0
         152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0
          22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z"/>
  </svg>
`;

export const IconTrash = svg`
  <svg width="20" height="20" viewBox="0 0 448 512" stroke="black" fill="black" stroke-width="0.1">
    <path d="M170.5 51.6L151.5 80h145l-19-28.4c-1.5-2.2-4-3.6-6.7-3.6H177.1c-2.7
     0-5.2 1.3-6.7 3.6zm147-26.6L354.2 80H368h48 8c13.3 0 24 10.7 24 24s-10.7 24-24
      24h-8V432c0 44.2-35.8 80-80 80H112c-44.2 0-80-35.8-80-80V128H24c-13.3 0-24-10.7-24-24S10.7
       80 24 80h8H80 93.8l36.7-55.1C140.9 9.4 158.4 0 177.1 0h93.7c18.7 0 36.2 9.4 46.6 24.9zM80
        128V432c0 17.7 14.3 32 32 32H336c17.7 0 32-14.3 32-32V128H80zm80 64V400c0 8.8-7.2 16-16
         16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16zm80 0V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8
          7.2-16 16-16s16 7.2 16 16zm80 0V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16z"/>
  </svg>
`;

export const IconSpinner = svg`
  <svg class="spinner" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="3" r="2" fill="black"/>
    <circle cx="21" cy="12" r="2" fill="black"/>
    <circle cx="12" cy="21" r="2" fill="black"/>
    <circle cx="3" cy="12" r="2" fill="black"/>
  </svg>
`;

export const iconStyles = css`
	.spinner {
		animation: spinner-rotate 1.2s linear infinite;
		transform-origin: center center;
	}

	@keyframes spinner-rotate {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	svg {
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
	}

	.rot-45 {
		transform: rotate(45deg);
	}
	.rot-90 {
		transform: rotate(90deg);
	}
	.rot-270 {
		transform: rotate(270deg);
	}
`;
