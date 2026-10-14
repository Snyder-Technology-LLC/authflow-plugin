#!/usr/bin/env node
// Each client reads its own manifest. This keeps them describing the same plugin:
// one version, the same MCP servers and URLs, the headers Rail reads to recognize the plugin,
// one authflow-cli version everywhere, and portable skills.
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { cliPins, readJson as read, root, semver } from "./lib/repo.mjs";

const errors = [];
const check = (ok, message) => { if (!ok) errors.push(message); };

const claude = read(".claude-plugin/plugin.json");
const claudeMarket = read(".claude-plugin/marketplace.json");
const claudeMcp = read(".mcp.json");
const agent = read("plugin.json");
const agentMcp = read("mcp.json");
const codexMarket = read(".agents/plugins/marketplace.json");
const gemini = read("gemini-extension.json");

const name = claude.name;
for (const [file, value] of [["plugin.json", agent.name], ["gemini-extension.json", gemini.name],
  [".claude-plugin/marketplace.json", claudeMarket.plugins?.[0]?.name], [".agents/plugins/marketplace.json", codexMarket.plugins?.[0]?.name]])
  check(value === name, `${file}: plugin name ${value} differs from ${name}`);

const version = claude.version;
check(semver.test(version ?? ""), `.claude-plugin/plugin.json: version ${version} is not semver`);
for (const [file, value] of [["plugin.json", agent.version], ["gemini-extension.json", gemini.version]])
  check(value === version, `${file}: version ${value} differs from ${version}`);
for (const [file, value] of [["plugin.json", agent.description], ["gemini-extension.json", gemini.description]])
  check(value === claude.description, `${file}: description differs from .claude-plugin/plugin.json`);

// Server name -> URL and headers, per client file, normalized from each client's shape.
const servers = {
  ".mcp.json": Object.fromEntries(Object.entries(claudeMcp.mcpServers).map(([k, v]) => {
    check(v.type === "http", `.mcp.json: ${k} must use type http`);
    return [k, { url: v.url, headers: v.headers }];
  })),
  "mcp.json": Object.fromEntries(Object.entries(agentMcp.mcpServers).map(([k, v]) => {
    check(v.type === "streamable-http", `mcp.json: ${k} must use type streamable-http`);
    return [k, { url: v.url, headers: v.headers }];
  })),
  "gemini-extension.json": Object.fromEntries(Object.entries(gemini.mcpServers).map(([k, v]) => [k, { url: v.httpUrl, headers: v.headers }])),
};
// Rail reads these headers to tell an outdated plugin how to update, so each client's manifest
// names that client and the version it ships. X-Authflow-* is Rail's reserved trust namespace.
const clients = { ".mcp.json": "claude-code", "mcp.json": "agent-plugins", "gemini-extension.json": "gemini-cli" };
const urls = (map) => JSON.stringify(Object.entries(map).map(([k, v]) => [k, v.url]).sort());
const expected = urls(servers[".mcp.json"]);
for (const [file, map] of Object.entries(servers)) {
  check(urls(map) === expected, `${file}: MCP servers differ from .mcp.json`);
  for (const [k, { url, headers }] of Object.entries(map)) {
    check(/^https:\/\/[^?#\s]+$/.test(url ?? ""), `${file}: ${k} must be an https URL without a query or fragment`);
    check(headers?.["Authflow-Plugin-Version"] === version, `${file}: ${k} must send header Authflow-Plugin-Version: ${version}`);
    check(headers?.["Authflow-Plugin-Client"] === clients[file], `${file}: ${k} must send header Authflow-Plugin-Client: ${clients[file]}`);
    for (const header of Object.keys(headers ?? {}))
      check(!/^x-authflow-/i.test(header), `${file}: ${k} header ${header} is in Rail's reserved X-Authflow- namespace`);
  }
}

// Every command a skill, the README or an eval gives runs the same authflow-cli.
const pins = cliPins();
for (const [pin, where] of pins) check(semver.test(pin), `authflow-cli@${pin} is not an exact X.Y.Z version (${where.join(", ")})`);
check(pins.size <= 1, `authflow-cli pins differ: ${[...pins].map(([pin, where]) => `${pin} at ${where.join(", ")}`).join("; ")}`);

// Skills are shared by every client, so frontmatter stays within the portable Agent Skills fields.
const skills = (await readdir(join(root, "skills"), { withFileTypes: true })).filter((d) => d.isDirectory());
check(skills.length > 0, "skills/: no skills found");
for (const { name: dir } of skills) {
  const text = await readFile(join(root, "skills", dir, "SKILL.md"), "utf8").catch(() => null);
  if (text === null) { errors.push(`skills/${dir}: missing SKILL.md`); continue; }
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) { errors.push(`skills/${dir}/SKILL.md: missing frontmatter`); continue; }
  const fields = Object.fromEntries(match[1].split(/\r?\n/).map((line) => {
    const at = line.indexOf(":");
    return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
  }));
  check(fields.name === dir, `skills/${dir}/SKILL.md: name must be ${dir}`);
  check((fields.description ?? "").length >= 40 && fields.description.length <= 1024, `skills/${dir}/SKILL.md: description must be 40-1024 characters`);
  for (const key of Object.keys(fields)) check(key === "name" || key === "description", `skills/${dir}/SKILL.md: non-portable frontmatter field ${key}`);
}

if (errors.length) {
  console.error(errors.map((e) => `error: ${e}`).join("\n"));
  process.exit(1);
}
const pin = pins.size ? `, authflow-cli@${[...pins.keys()][0]}` : "";
console.log(`manifests consistent: ${name}@${version}, ${Object.keys(servers[".mcp.json"]).length} MCP servers, ${skills.length} skills${pin}`);
