#!/usr/bin/env node
// Every MCP server a user installs must answer from outside Authflow's network and lead a client to
// sign-in. This sends an MCP initialize, with the headers that manifest configures, to each server
// in each client manifest and accepts only a 2xx or the 401 OAuth challenge (with a
// WWW-Authenticate header). A 403 means an IP allowlist is blocking strangers. After a 401 it
// follows the challenge's resource_metadata: the protected resource metadata must answer 200 and
// name the manifest URL as its resource, and its first authorization server's metadata must answer
// 200 and offer dynamic client registration or client ID metadata documents.
import { readJson as read } from "./lib/repo.mjs";

const servers = [];
const add = (file, map, key) => {
  for (const [name, server] of Object.entries(map ?? {}))
    servers.push({ source: `${file}:${name}`, url: server[key], headers: server.headers ?? {} });
};
add(".mcp.json", read(".mcp.json").mcpServers, "url");
add("mcp.json", read("mcp.json").mcpServers, "url");
add("gemini-extension.json", read("gemini-extension.json").mcpServers, "httpUrl");

const initialize = JSON.stringify({
  jsonrpc: "2.0", id: 1, method: "initialize",
  params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "authflow-plugin-endpoint-check", version: "1" } },
});
const timeout = () => AbortSignal.timeout(20_000);
const noAnswer = (error) => `no answer: ${error.cause?.code ?? error.name}`;

// Manifests share discovery documents, so each is fetched once.
const documents = new Map();
const getJson = (url) => {
  if (!documents.has(url)) documents.set(url, (async () => {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" }, signal: timeout() });
      const body = await response.json().catch(() => null);
      return { status: `${response.status}`, ok: response.status === 200, body };
    } catch (error) {
      return { status: noAnswer(error), ok: false, body: null };
    }
  })());
  return documents.get(url);
};

// RFC 8414 puts the well-known segment between the host and any issuer path.
const authorizationServerMetadata = (issuer) => {
  const url = new URL(issuer);
  return `${url.origin}/.well-known/oauth-authorization-server${url.pathname.replace(/\/+$/, "")}`;
};

// The first problem with the discovery chain behind a 401 challenge, or null.
async function discovery(url, challenge) {
  const prmUrl = /resource_metadata="([^"]+)"/i.exec(challenge)?.[1];
  if (!prmUrl) return "the challenge has no resource_metadata";
  if (!/^https:\/\//.test(prmUrl)) return `resource_metadata ${prmUrl} is not an https URL`;
  const prm = await getJson(prmUrl);
  if (!prm.ok) return `${prmUrl} answered ${prm.status}`;
  if (prm.body?.resource !== url) return `${prmUrl} names resource ${prm.body?.resource}, not ${url}`;
  const issuer = prm.body.authorization_servers?.[0];
  if (typeof issuer !== "string" || !/^https:\/\//.test(issuer)) return `${prmUrl} names no https authorization server`;
  const asUrl = authorizationServerMetadata(issuer);
  const as = await getJson(asUrl);
  if (!as.ok) return `${asUrl} answered ${as.status}`;
  if (!as.body?.registration_endpoint && as.body?.client_id_metadata_document_supported !== true)
    return `${asUrl} offers neither a registration_endpoint nor client_id_metadata_document_supported`;
  return null;
}

const failures = [];
for (const { source, url, headers } of servers) {
  let result;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: initialize,
      signal: timeout(),
    });
    const challenge = response.headers.get("www-authenticate") ?? "";
    if (response.status >= 200 && response.status < 300) {
      result = `${response.status}`;
    } else if (response.status === 401 && /^Bearer\b/i.test(challenge)) {
      const problem = await discovery(url, challenge);
      result = `401 (OAuth challenge), ${problem ?? "resource and authorization server metadata OK"}`;
      if (problem) failures.push(`${url} (${source}): ${problem}`);
    } else {
      result = `${response.status}${response.status === 401 ? " (no WWW-Authenticate)" : ""}`;
      failures.push(`${url} answered ${result} (${source})`);
    }
  } catch (error) {
    result = noAnswer(error);
    failures.push(`${url} ${result} (${source})`);
  }
  console.log(`${source} ${url}: ${result}`);
}

if (failures.length) {
  console.error(failures.map((f) => `error: ${f}`).join("\n"));
  process.exit(1);
}
console.log(`all ${servers.length} MCP servers answer from outside and lead to sign-in`);
