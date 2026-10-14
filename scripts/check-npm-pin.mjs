#!/usr/bin/env node
// The README, skills and evals give agents one authflow-cli version to run (check-manifests.mjs
// keeps it to one). This fails when npm does not have that version. With --latest it also fails
// when npm's latest authflow-cli is newer than the pin, so the daily CI run flags a CLI release the
// plugin has not caught up with.
import { execFileSync } from "node:child_process";
import { cliPins, compareSemver, semver } from "./lib/repo.mjs";

const latest = process.argv.includes("--latest");
const pins = [...cliPins().keys()];
if (pins.length === 0) {
  console.log("no authflow-cli pin in the repository; nothing to check");
  process.exit(0);
}
if (pins.length > 1 || !semver.test(pins[0])) {
  console.error(`error: expected one exact authflow-cli pin, found ${pins.join(", ")}; run node scripts/check-manifests.mjs`);
  process.exit(1);
}
const [pin] = pins;

// npm is a .cmd shim on Windows, which Node starts only through a shell. Every argument is fixed
// except the pin, which is a checked X.Y.Z version.
const npm = (...args) => {
  try {
    return execFileSync("npm", args, { encoding: "utf8", shell: process.platform === "win32", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    console.error(`error: npm ${args.join(" ")} failed: ${error.stderr?.trim() || error.message}`);
    process.exit(1);
  }
};

const errors = [];
// npm view prints nothing for a version the package does not have.
if (npm("view", `authflow-cli@${pin}`, "version") !== pin)
  errors.push(`authflow-cli@${pin} is not on npm. Publish it first (Authflow's cli-v${pin} tag), or pin a published version.`);
let current = null;
if (latest) {
  current = npm("view", "authflow-cli", "dist-tags.latest");
  if (!semver.test(current)) errors.push(`npm's latest authflow-cli is ${current || "missing"}, not an X.Y.Z version`);
  else if (compareSemver(current, pin) > 0)
    errors.push(`npm's latest authflow-cli is ${current}, but the plugin pins ${pin}. Update every authflow-cli@${pin} and release the plugin.`);
}

if (errors.length) {
  console.error(errors.map((e) => `error: ${e}`).join("\n"));
  process.exit(1);
}
console.log(`authflow-cli@${pin} is on npm${latest ? ` and is the latest (${current})` : ""}`);
