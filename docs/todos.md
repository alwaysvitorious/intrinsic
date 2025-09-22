## To-dos

- Use electron-builder and add app icon.
- Improve clients initialization error handling.
- Improve AI error handling + console.error on pipeline
- Avoid freezing UI when parsing HTML. Worker + linkedom?
- On quarters/semesters calculate P/E and score on TTM if available.
- Settings dialog: (sort a-z/last asc/desc), search, modify prompts, currently
  on portfolio, switch llm, modify config.json, delete DB (start from scratch).
- Submit multiple tickers while others are sent and await in background. Display
  spinner instead of ticker on grid while loading. Handle data races, same
  ticker submissions, existing ticker submissions, errors...
- Support insurance companies and banks.
- Add tests.
- Optimize cleaner string iterations.
- Keyboard navigation.
- Add RAG chat within PDFs / parsed text.
- Allow CSR URLs.
- Web-search for portfolio tickers news.
- Monte Carlo simulation with >=10 periods.
- Add ETFs, Index Funds. If ticker starts with 'FUND.'{ISIN} -> fetch KID ->
  return basic info.
- Add more LLM endpoints (Claude, Cloudflare, AWS Bedrock, Google AI, Groq,
  Deepseek...)
- Local LLMs options: embed fine-tuned small LLM, llama-cpp, Ollama...
- Integrate Alpha Vantage API or ticker price scraper for live-pricing.
