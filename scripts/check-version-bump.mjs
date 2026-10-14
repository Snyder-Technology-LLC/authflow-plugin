#!/usr/bin/env node
// Codex, Cursor and Claude Code install this repository from main, and Gemini CLI from its GitHub
// Releases, so every change to a shipped file is a release. A pull request that changes one must
// raise the version in .claude-plugin/plugin.json above the base branch's and add that version's
// CHANGELOG entry, which release.yml publishes as the release notes. check-manifests.mjs keeps the
// other manifests and the Authflow-Plugin-Version headers in step with it.
// BASE_REF (default origin/main) is the branch the pull request merges into; it needs full history.
import { changelogSection, compareSemver, git, readJson, readText, semver } from "./lib/repo.mjs";

const base = process.env.BASE_REF || "origin/main";

// Everything else in the repository reaches users' machines, so a new file counts as shipped.
const unshippedFiles = new Set([".gitignore", ".gitattributes", "LICENSE", "README.md", "CHANGELOG.md"]);
const unshippedDirs = ["evals/", "scripts/", ".github/"];
const shipped = (path) => !unshippedFiles.has(path) && !unshippedDirs.some((dir) => path.startsWith(dir));

let changed;
try {
  changed = git(["diff", "--name-only", "--no-renames", `${base}...HEAD`]).split("\n").filter(Boolean);
} catch (error) {
  console.error(`error: cannot compare with ${base} (${error.stderr?.trim() || error.message}). Fetch the base branch with full history.`);
  process.exit(1);
}
const changes = changed.filter(shipped);
if (changes.length === 0) {
  console.log(`no shipped files changed since ${base}; no version bump needed`);
  process.exit(0);
}

const errors = [];
const version = readJson(".claude-plugin/plugin.json").version;
let baseVersion = null;
try {
  baseVersion = JSON.parse(git(["show", `${base}:.claude-plugin/plugin.json`])).version;
} catch {
  // The base has no plugin manifest yet, so any version is a first release.
}
if (!semver.test(version ?? "")) {
  errors.push(`.claude-plugin/plugin.json: version ${version} is not an X.Y.Z version`);
} else {
  if (semver.test(baseVersion ?? "") && compareSemver(version, baseVersion) <= 0)
    errors.push(`.claude-plugin/plugin.json: version ${version} must be higher than ${baseVersion} on ${base}, because shipped files changed: ${changes.join(", ")}`);
  if (!changelogSection(readText("CHANGELOG.md"), version))
    errors.push(`CHANGELOG.md: add a "## ${version}" entry with this release's notes`);
}

if (errors.length) {
  console.error(errors.map((e) => `error: ${e}`).join("\n"));
  process.exit(1);
}
console.log(`version ${baseVersion ?? "(none)"} -> ${version} on ${base} covers ${changes.length} shipped file changes, with a CHANGELOG entry`);
