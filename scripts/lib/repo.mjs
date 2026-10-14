// Shared by the scripts in scripts/: the repository root, file and git helpers, the authflow-cli
// pins in the repository, semver ordering, and CHANGELOG entries.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../..", import.meta.url));
export const readText = (path) => readFileSync(join(root, path), "utf8");
export const readJson = (path) => JSON.parse(readText(path));
export const git = (args, cwd = root) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

// Exact X.Y.Z only: the plugin and the CLI never ship pre-release versions.
export const semver = /^(\d+)\.(\d+)\.(\d+)$/;

export function compareSemver(a, b) {
  const [x, y] = [a, b].map((version) => {
    const match = semver.exec(version ?? "");
    if (!match) throw new Error(`${version} is not an X.Y.Z version`);
    return match.slice(1).map(Number);
  });
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return Math.sign(x[i] - y[i]);
  return 0;
}

// The CHANGELOG records the CLI each past release pinned, so its history is not a pin.
const pinExempt = new Set(["CHANGELOG.md"]);

/**
 * Every authflow-cli@<version> in the repository's files (tracked, plus untracked files git does
 * not ignore, so a new file counts before it is committed), as version -> ["file:line", ...].
 */
export function cliPins() {
  const pins = new Map();
  const files = git(["ls-files", "-z", "--cached", "--others", "--exclude-standard"]).split("\0").filter(Boolean);
  for (const file of new Set(files)) {
    if (pinExempt.has(file) || /\.(png|jpe?g|gif|webp|ico)$/i.test(file)) continue;
    let text;
    try { text = readText(file); } catch { continue; } // deleted in the working tree
    text.split(/\r?\n/).forEach((line, index) => {
      for (const [, version] of line.matchAll(/authflow-cli@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)/g)) {
        if (!pins.has(version)) pins.set(version, []);
        pins.get(version).push(`${file}:${index + 1}`);
      }
    });
  }
  return pins;
}

/**
 * The body of CHANGELOG.md's entry for a version: the lines after its "## <version>" heading (which
 * may go on, as in "## 0.4.0 - 2026-10-13") up to the next "## " heading. Null when there is none.
 */
export function changelogSection(text, version) {
  if (!semver.test(version)) return null;
  const lines = text.split(/\r?\n/);
  const heading = new RegExp(`^## ${version.replaceAll(".", "\\.")}(?=\\s|$)`);
  const start = lines.findIndex((line) => heading.test(line));
  if (start < 0) return null;
  const next = lines.findIndex((line, index) => index > start && line.startsWith("## "));
  return lines.slice(start + 1, next < 0 ? undefined : next).join("\n").trim();
}
