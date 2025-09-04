## To-dos

- On quarters/semesters calculate P/E and score on TTM if available.
- Submit multiple tickers while others are sent and await inbackground. Display
  spinner instead of ticker on grid while loading.
- Use worker when parsing HTML to avoid freezing UI.
- Settings dialog: (sort a-z/last asc/desc), search, modify prompts, change
  model, modify config.json.
- Delete full ticker. Delete full DB (start from scratch).
- Add dev_mode to config.json. If !dev_mode -> disable devtools.
- Add support for insurance companies and banks.
- App icon -> desktop icon.
- ASAR distribution.
- Add tests.
- Optimize cleaner string iterations.
- Improve clients initialization error handling.
- Improve AI error handling.
- Keyboard navigation.
- Add RAG chat within PDFs / parsed text.
- Allow CSR URLs.
- Mark tickers currently in portfolio and add web-search for tickers-related
  news.
- Monte Carlo simulation with >=10 periods.
- Add ETFs, Index Funds. If ticker starts with 'FUND.'{NAME} -> fetch KID ->
  return basic info.
- Add more LLM endpoints (Claude, Cloudflare, AWS Bedrock, Google AI, Groq,
  Deepseek...)
- Local LLMs options: embed fine-tuned small LLM, llama-cpp, Ollama...
- Integrate Alpha Vantage API or ticker price scraper for live-pricing.
