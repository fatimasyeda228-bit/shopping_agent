import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import "dotenv/config";
import { ShoppingAgent } from "./agent.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";
const GRAY = "\x1b[90m";
const GREEN = "\x1b[32m";

function printBanner() {
  console.log(`${BOLD}${CYAN}🛒 Shopping Agent${RESET}`);
  console.log(
    `${GRAY}Ask me to find, compare, or recommend products. Type "exit" to quit.${RESET}\n`
  );
}

function printSources(sources) {
  if (!sources.length) return;
  console.log(`\n${BOLD}Sources:${RESET}`);
  sources.forEach((s, i) => {
    console.log(`${GRAY}  [${i + 1}] ${s.title ?? s.url}${RESET}`);
    console.log(`${GRAY}      ${s.url}${RESET}`);
  });
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

  let agent;
  try {
    agent = new ShoppingAgent({ apiKey, model });
  } catch (err) {
    console.error(`${BOLD}Error:${RESET} ${err.message}`);
    process.exit(1);
  }
//
  const argQuery = process.argv.slice(2).join(" ").trim();

  printBanner();

  if (argQuery) {
    // Single-shot mode: node src/index.js "find me wireless earbuds under $100"
    await handleTurn(agent, argQuery);
    return;
  }

  // Interactive mode
  const rl = readline.createInterface({ input, output });
  while (true) {
    const query = await rl.question(`${GREEN}You:${RESET} `);
    if (!query.trim()) continue;
    if (["exit", "quit", "q"].includes(query.trim().toLowerCase())) {
      console.log(`${GRAY}Goodbye!${RESET}`);
      break;
    }
    await handleTurn(agent, query);
  }
  rl.close();
}

async function handleTurn(agent, query) {
  process.stdout.write(`${GRAY}Thinking...${RESET}\r`);
  try {
    const { text, sources } = await agent.ask(query, {
      onStatus: (msg) => process.stdout.write(`${GRAY}${msg}...${RESET}\n`),
    });
    console.log(`\n${BOLD}${CYAN}Agent:${RESET} ${text}`);
    printSources(sources);
    console.log();
  } catch (err) {
    console.error(`\n${BOLD}Error:${RESET} ${err.message}\n`);
  }
}

main();
