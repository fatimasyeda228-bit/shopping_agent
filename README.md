# Shopping Agent

A command-line shopping assistant powered by Claude. It searches the live web,
compares real products/prices, and gives you a clear recommendation with
sources — instead of guessing from stale training data.

## What it does

- Takes a request like *"find me noise-cancelling headphones under $150"*
- Uses Claude's built-in web search to look up current products, prices, and reviews
- Compares options with trade-offs (not just "buy this")
- Cites the source link for every price/product it mentions
- Asks a clarifying question if your request is too vague
- Works as a one-off query or an interactive chat session (with memory of the conversation)

## Folder structure

```
shopping-agent/
├── package.json
├── .env.example        # copy to .env and add your API key
├── README.md
└── src/
    ├── agent.js         # core agent: talks to Claude + web search tool
    └── index.js         # CLI entry point (interactive + single-query modes)
```

## Setup

1. **Install Node.js 18+** if you don't have it: https://nodejs.org

2. **Install dependencies** (from inside the `shopping-agent` folder):
   ```bash
   npm install
   ```

3. **Add your Anthropic API key**:
   ```bash
   cp .env.example .env
   ```
   Then open `.env` and paste your key from https://console.anthropic.com/ :
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

## Running it

**Interactive mode** (chat back and forth, keeps context):
```bash
npm start
```
or
```bash
node src/index.js
```
You'll get a `You:` prompt. Type your request, get a response, keep going.
Type `exit` to quit.

**One-off query mode** (no interactive session, just prints the answer):
```bash
node src/index.js "find me a good budget mechanical keyboard under $80"
```

## Example

```
$ npm start
🛒 Shopping Agent
Ask me to find, compare, or recommend products. Type "exit" to quit.

You: I need running shoes for flat feet, budget around $120

Agent: A few solid options for stability/motion-control running shoes...
  • Brooks Adrenaline GTS 23 — ~$140, known for arch support...
  • ASICS Gel-Kayano 30 — ~$160, more cushioned...
  • Saucony Guide 17 — ~$120, good value pick...

Recommendation: If you want to stay closest to budget, the Saucony Guide 17...

Sources:
  [1] Saucony Guide 17 Review — runnersworld.com
      https://...
```

## Notes / customization

- **Model**: set `CLAUDE_MODEL` in `.env` to switch models (defaults to `claude-sonnet-4-6`).
- **System prompt**: edit `SYSTEM_PROMPT` in `src/agent.js` to change the agent's
  tone, add rules (e.g. "only recommend items in stock in the US"), or bias it
  toward specific retailers.
- **Web search**: this uses Anthropic's server-side `web_search` tool, so no
  separate search API key is needed — it's included in your Anthropic API usage.
- **Cost**: each query may trigger multiple web searches; check current pricing
  at https://docs.claude.com if you're running this at volume.

## Troubleshooting

- `Missing ANTHROPIC_API_KEY` — make sure you created `.env` (not just
  `.env.example`) and it contains a real key.
- Nothing happens / hangs — check your internet connection and that your API
  key has available credits.
