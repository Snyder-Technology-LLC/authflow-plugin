#!/usr/bin/env node
// Each client reads its own manifest. This keeps them describing the same plugin:
// one version, the same MCP servers and URLs, and portable skills.
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const errors = [];
const read = async (path) => JSON.parse(await readFile(join(root, path), "utf8"));
const check = (ok, message) => { if (!ok) errors.push(message); };

const claude = await read(".claude-plugin/plugin.json");
const claudeMarket = await read(".claude-plugin/marketplace.json");
const claudeMcp = await read(".mcp.json");
const agent = await read("plugin.json");
const agentMcp = await read("mcp.json");
const codexMarket = await read(".agents/plugins/marketplace.json");
const gemini = await read("gemini-extension.json");

const name = claude.name;
for (const [file, value] of [["plugin.json", agent.name], ["gemini-extension.json", gemini.name],
  [".claude-plugin/marketplace.json", claudeMarket.plugins?.[0]?.name], [".agents/plugins/marketplace.json", codexMarket.plugins?.[0]?.name]])
  check(value === name, `${file}: plugin name ${value} differs from ${name}`);

const version = claude.version;
check(/^\d+\.\d+\.\d+$/.test(version ?? ""), `.claude-plugin/plugin.json: version ${version} is not semver`);
for (const [file, value] of [["plugin.json", agent.version], ["gemini-extension.json", gemini.version]])
  check(value === version, `${file}: version ${value} differs from ${version}`);
for (const [file, value] of [["plugin.json", agent.description], ["gemini-extension.json", gemini.description]])
  check(value === claude.description, `${file}: description differs from .claude-plugin/plugin.json`);

// Server name -> URL, per client file, normalized from each client's shape.
const servers = {
  ".mcp.json": Object.fromEntries(Object.entries(claudeMcp.mcpServers).map(([k, v]) => {
    check(v.type === "http", `.mcp.json: ${k} must use type http`);
    return [k, v.url];
  })),
  "mcp.json": Object.fromEntries(Object.entries(agentMcp.mcpServers).map(([k, v]) => {
    check(v.type === "streamable-http", `mcp.json: ${k} must use type streamable-http`);
    return [k, v.url];
  })),
  "gemini-extension.json": Object.fromEntries(Object.entries(gemini.mcpServers).map(([k, v]) => [k, v.httpUrl])),
};
const expected = JSON.stringify(Object.entries(servers[".mcp.json"]).sort());
for (const [file, map] of Object.entries(servers)) {
  check(JSON.stringify(Object.entries(map).sort()) === expected, `${file}: MCP servers differ from .mcp.json`);
  for (const [k, url] of Object.entries(map)) check(/^https:\/\//.test(url ?? ""), `${file}: ${k} must be an https URL`);
}

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
console.log(`manifests consistent: ${name}@${version}, ${Object.keys(servers[".mcp.json"]).length} MCP servers, ${skills.length} skills`);
