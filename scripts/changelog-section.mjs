#!/usr/bin/env node
// Prints one version's CHANGELOG.md entry without its heading, for the GitHub Release notes.
// Usage: node scripts/changelog-section.mjs <X.Y.Z>
import { changelogSection, readText, semver } from "./lib/repo.mjs";

const version = process.argv[2] ?? "";
if (!semver.test(version)) {
  console.error("usage: node scripts/changelog-section.mjs <X.Y.Z>");
  process.exit(2);
}
const section = changelogSection(readText("CHANGELOG.md"), version);
if (!section) {
  console.error(`error: CHANGELOG.md has no "## ${version}" entry with notes`);
  process.exit(1);
}
console.log(section);
