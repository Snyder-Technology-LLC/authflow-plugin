#!/usr/bin/env node
// Skills, evals and the README name management MCP tools. This checks each name against the tool
// list vendored from Rail (evals/mocks/authflow/_tools.json, written by sync-tool-manifest.mjs), so
// a renamed or removed tool fails here instead of in an agent's session: authflow_* names in text,
// mcp__plugin_authflow_<server>__<tool> names in graders, and the tool each mock file answers.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { readJson, readText, root } from "./lib/repo.mjs";

const tools = new Set(readJson("evals/mocks/authflow/_tools.json").tools.map((tool) => tool.name));
// authflow_* words that are values, not tools: the doctor report's overall status for a failure on
// Authflow's side.
const notTools = new Set(["authflow_issue"]);
const servers = new Set(Object.keys(readJson(".mcp.json").mcpServers));
const errors = [];

// Every file under a directory, as repository-relative paths with forward slashes.
const walk = (dir) => readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? walk(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);

// _tools.json is the list itself; results/ is local run output.
const evals = walk("evals").filter((path) => !path.startsWith("evals/results/") && !/\/_tools(\.source)?\.json$/.test(path));
const files = [...walk("skills"), ...evals, "README.md"].filter((path) => !/\.(png|jpe?g|gif|webp|ico)$/i.test(path));

let names = 0;
for (const file of files) {
  readText(file).split(/\r?\n/).forEach((line, index) => {
    const at = `${file}:${index + 1}`;
    // A bare name, not the tail of a namespaced one such as mcp__plugin_authflow_authflow__<tool>.
    for (const [name] of line.matchAll(/(?<![A-Za-z0-9_])authflow_[a-z_]*[a-z]/g)) {
      if (notTools.has(name)) continue;
      names++;
      if (!tools.has(name)) errors.push(`${at}: ${name} is not a management MCP tool`);
    }
    for (const [, server, tool] of line.matchAll(/mcp__plugin_authflow_([A-Za-z0-9-]+)__([A-Za-z0-9_]+)/g)) {
      names++;
      if (!servers.has(server)) errors.push(`${at}: ${server} is not an MCP server in .mcp.json`);
      else if (server === "authflow" && !tools.has(tool)) errors.push(`${at}: ${tool} is not a management MCP tool`);
    }
  });
}

// Mocks live at evals/mocks/<server>/<tool>.md (suite) and evals/<case>/mocks/<server>/<tool>.md.
// _server.md, _tools.json, fixtures/ and .replay/ are not tool files.
let mocks = 0;
for (const file of evals) {
  const server = /^evals\/(?:.+\/)?mocks\/([^/]+)\//.exec(file)?.[1];
  if (server === undefined) continue;
  if (server !== ".replay" && !servers.has(server)) { errors.push(`${file}: ${server} is not an MCP server in .mcp.json`); continue; }
  const tool = /^evals\/(?:.+\/)?mocks\/[^/]+\/([^/]+)\.md$/.exec(file)?.[1];
  if (server !== "authflow" || tool === undefined || tool.startsWith("_")) continue;
  mocks++;
  if (!tools.has(tool)) errors.push(`${file}: mocks ${tool}, which is not a management MCP tool`);
}

if (errors.length) {
  console.error([...new Set(errors)].map((e) => `error: ${e}`).join("\n"));
  console.error("If Rail added or renamed a tool, run node scripts/sync-tool-manifest.mjs <path-to-Authflow-checkout> first.");
  process.exit(1);
}
console.log(`tool references consistent: ${names} names in ${files.length} files and ${mocks} mocks match ${tools.size} tools`);
