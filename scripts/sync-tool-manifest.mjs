#!/usr/bin/env node
// Copies the hosted management MCP's tool list from an Authflow checkout into the eval mocks, so
// mocked runs see the tool names, descriptions and input schemas a client does, and check-refs.mjs
// knows which tools exist. _tools.source.json records the commit it came from; dirty means the
// manifest had uncommitted changes in that checkout, so the commit alone does not reproduce it.
// Usage: node scripts/sync-tool-manifest.mjs <path-to-Authflow-checkout>
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { git, root } from "./lib/repo.mjs";

const source = "rail/docs/api/management-mcp-tools.v1.json";
if (!process.argv[2]) {
  console.error("usage: node scripts/sync-tool-manifest.mjs <path-to-Authflow-checkout>");
  process.exit(2);
}
const checkout = resolve(process.argv[2]);

const { tools } = JSON.parse(readFileSync(join(checkout, source), "utf8"));
if (!Array.isArray(tools) || tools.length === 0 || tools.some((tool) => typeof tool?.name !== "string")) {
  console.error(`error: ${join(checkout, source)} has no tools array of named tools`);
  process.exit(1);
}
const commit = git(["rev-parse", "HEAD"], checkout).trim();
const dirty = git(["status", "--porcelain", "--", source], checkout).trim().length > 0;

const write = (path, value) => writeFileSync(join(root, path), JSON.stringify(value, null, 2) + "\n");
write("evals/mocks/authflow/_tools.json", { tools });
write("evals/mocks/authflow/_tools.source.json", { path: source, commit, dirty });
console.log(`wrote ${tools.length} tools from ${source} at ${commit}${dirty ? " with uncommitted changes" : ""}`);
