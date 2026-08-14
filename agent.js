import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a helpful, sharp shopping assistant.

Your job:
- Understand what the user is trying to buy, and their constraints (budget, use case, brand preferences, must-have features).
- Use web search to find real, current products, prices, and reviews. Never invent product names, prices, or specs — only report what you find.
- Compare options clearly: highlight trade-offs (price vs. quality, features vs. simplicity), not just a single "best" pick.
- Be concise. Use short product summaries, not walls of text. Use bullet points for specs/comparisons.
- Always include the source link when you mention a specific price or product listing, so the user can verify and buy.
- If the request is ambiguous (e.g. "find me headphones"), ask ONE short clarifying question before searching — budget, primary use, or key preference — unless the user already gave enough detail.
- Prices and availability change fast — always prefer the most recent search results over prior knowledge.
- Do not recommend a purchase decision as if it's fact; present the trade-offs and let the user decide, especially for anything expensive.
- Never fabricate reviews, ratings, or stock status.

Formatting:
- Use markdown: headers for categories, bullets for specs, and a short "Recommendation" line at the end when appropriate.
- Keep responses focused — the user wants answers, not essays.`;

export class ShoppingAgent {
  constructor({ apiKey, model = "claude-sonnet-4-6", maxTokens = 2000 } = {}) {
    if (!apiKey) {
      throw new Error(
        "Missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key."
      );
    }
    this.client = new Anthropic({ apiKey });
    this.model = model;
    this.maxTokens = maxTokens;
    this.history = [];
  }

  reset() {
    this.history = [];
  }

  /**
   * Send a user message to the agent, allowing Claude to use the
   * server-side web_search tool as many times as it needs before
   * returning a final answer.
   */
  async ask(userMessage, { onStatus } = {}) {
    this.history.push({ role: "user", content: userMessage });

    let finalText = "";
    let sources = [];

    // Loop in case Claude wants to run multiple searches / tool calls
    // before giving a final answer. stop_reason "tool_use" for server
    // tools like web_search is handled internally by the API, but we
    // still loop defensively in case max_tokens is hit mid-search.
    for (let turn = 0; turn < 6; turn++) {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: SYSTEM_PROMPT,
        messages: this.history,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
          },
        ],
      });

      // Collect any text + citations from this response
      const textParts = [];
      for (const block of response.content) {
        if (block.type === "text") {
          textParts.push(block.text);
          if (block.citations) {
            for (const c of block.citations) {
              if (c.url) sources.push({ title: c.title, url: c.url });
            }
          }
        } else if (block.type === "server_tool_use" && onStatus) {
          onStatus(`Searching: ${block.input?.query ?? "..."}`);
        }
      }
      finalText += textParts.join("\n");

      // Save assistant turn to history for context continuity
      this.history.push({ role: "assistant", content: response.content });

      if (response.stop_reason !== "tool_use" && response.stop_reason !== "pause_turn") {
        break;
      }
      // If it paused mid tool-use turn, loop again to let it continue.
      // (The API handles the actual search server-side; this just
      // guards against truncation.)
      if (response.stop_reason !== "pause_turn") break;
    }

    // De-dupe sources by URL
    const seen = new Set();
    const uniqueSources = sources.filter((s) => {
      if (!s.url || seen.has(s.url)) return false;
      seen.add(s.url);
      return true;
    });

    return { text: finalText, sources: uniqueSources };
  }
}
