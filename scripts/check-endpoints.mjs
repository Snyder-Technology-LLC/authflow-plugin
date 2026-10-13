#!/usr/bin/env node
// Every MCP server a user installs must answer from outside Authflow's network. This sends an
// MCP initialize to each URL in each client manifest and accepts only a 2xx or the 401 OAuth
// challenge (with a WWW-Authenticate header). A 403 means an IP allowlist is blocking strangers.
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const read = async (path) => JSON.parse(await readFile(join(root, path), "utf8"));

const urls = new Map();
const add = (file, servers, key) => {
  for (const [name, server] of Object.entries(servers ?? {})) {
    const url = server[key];
    if (!urls.has(url)) urls.set(url, []);
    urls.get(url).push(`${file}:${name}`);
  }
};
add(".mcp.json", (await read(".mcp.json")).mcpServers, "url");
add("mcp.json", (await read("mcp.json")).mcpServers, "url");
add("gemini-extension.json", (await read("gemini-extension.json")).mcpServers, "httpUrl");

const initialize = JSON.stringify({
  jsonrpc: "2.0", id: 1, method: "initialize",
  params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "authflow-plugin-endpoint-check", version: "1" } },
});

const failures = [];
for (const [url, sources] of urls) {
  let result;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: initialize,
      signal: AbortSignal.timeout(20_000),
    });
    const challenge = response.headers.get("www-authenticate") ?? "";
    const ok = (response.status >= 200 && response.status < 300) || (response.status === 401 && /^Bearer\b/i.test(challenge));
    result = `${response.status}${response.status === 401 ? ` (${challenge ? "OAuth challenge" : "no WWW-Authenticate"})` : ""}`;
    if (!ok) failures.push(`${url} answered ${result} (used by ${sources.join(", ")})`);
  } catch (error) {
    result = `no answer: ${error.cause?.code ?? error.name}`;
    failures.push(`${url} ${result} (used by ${sources.join(", ")})`);
  }
  console.log(`${url}: ${result}`);
}

if (failures.length) {
  console.error(failures.map((f) => `error: ${f}`).join("\n"));
  process.exit(1);
}
console.log(`all ${urls.size} MCP endpoints answer from outside`);
