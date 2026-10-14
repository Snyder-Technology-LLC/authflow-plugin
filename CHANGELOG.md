# Changelog

## 0.4.0 - 2026-10-13

- New `feedback` skill. It picks the first `kind` that fits (`security`, `client_compat`, `bug`, `unclear_error`, `docs_gap`, `missing_capability`, `user_message`, `other`) and a `severity`, copies `request_id` from the Authflow error, sends without asking only when the report is about Authflow's own tools, errors, or docs, and asks first, showing the draft, when it would include the user's code, configuration, URLs, or words. It tells the user the returned `feedback_id` and does not resend when the status is `duplicate`. Without the MCP, it falls back to `authflow feedback` from `authflow-cli` 0.9.0, which works without signing in. `onboard`, `troubleshoot`, and `integrate-origin` point at it instead of repeating the rules, and `pricing`, `operate`, `origin-key`, and `test-as-consumer` gained the same one-line pointer.
- New `doctor` skill around Authflow's hosted `authflow_doctor`. It reads `overall` and `next_action`, acts by `fix.actor` (the agent fixes code and re-runs the affected groups; owner steps such as DNS, Stripe, and deploys go to the user word for word; an Authflow-side failure is reported once, not again), runs `local_checks_suggested`, and never publishes while a blocking check fails. `troubleshoot` starts with it, `onboard` runs it at `depth` `full` before verifying and again after publishing, `test-as-consumer` runs the `clients` group for the client in use, and `operate` has a health sweep.
- Update notices. Every MCP config sends `Authflow-Plugin-Version` and `Authflow-Plugin-Client` (`claude-code`, `agent-plugins`, `gemini-cli`), so Authflow can tell users of an outdated plugin, once, how to update. Skills relay `client_notice` and run update commands only when the user asks. The README turns on auto-update at install and has an Updating section for each client.
- `origin-key` uses the exact `login` and `rotate-key` commands from `authflow_integration_plan` instead of a hard-coded CLI version and issuer. Skills no longer say which Authflow environment they target, and publishing waits for a verification from the last 24 hours.
- Manifests: version 0.4.0. The Codex interface describes the one management MCP (which also serves docs after sign-in), the doctor, and feedback instead of a public docs MCP, adds the privacy policy and terms of service URLs, and names `onboard` as its onboarding skill.
- The README and the `feedback` skill pin `authflow-cli@0.9.0`.
- Release tooling: `scripts/check-refs.mjs`, `scripts/check-version-bump.mjs`, `scripts/check-npm-pin.mjs`, and `scripts/sync-tool-manifest.mjs` join the existing checks; `check-manifests.mjs` also checks the request headers and that every `authflow-cli` pin agrees, and `check-endpoints.mjs` follows each server's OAuth metadata. `.github/workflows/release.yml` tags every version bump merged to `main` as `vX.Y.Z` with a GitHub Release.
- Existing eval mocks were updated to the new feedback and doctor contracts.

## 0.3.0

- One MCP server. The anonymous `authflow-docs` server is gone: it pointed at an access-restricted docs host, so agents outside Authflow's network got 403s, and the `integrate-origin` skill depended on its tools. Docs now come from the management MCP after sign-in (`authflow_search_docs`, `authflow_get_doc` with a `section` anchor, `authflow_integration_plan`).
- `integrate-origin`, `onboard`, and `troubleshoot` point at those tools.
- `scripts/check-endpoints.mjs`, run in CI on every change and daily, sends an MCP `initialize` to every server URL in every manifest from a GitHub-hosted runner and fails on anything other than 200 or a 401 OAuth challenge.

## 0.2.0

- Skills report friction with `authflow_send_feedback`: tool errors that needed a workaround, documentation gaps (including docs searches with no results), missing tools, and client compatibility bugs. The `authflow-docs` server's `send_feedback` covers sessions without the management MCP.
- `origin-key` pins `authflow-cli@0.7.0` and states its actual requirement, Node.js 22.12 or later.
- New evals: `docs-gap-feedback` (no invented packages, no duplicate reports for a gap Authflow already recorded) and `requested-feedback`.
- Eval mocks carry the management MCP's real tool schemas (`evals/mocks/authflow/_tools.json`), so mocked runs see the same arguments a client does.

## 0.1.0

First preview, targeting Authflow staging.

- Claude Code, Codex, Cursor (Agent Plugins), and Gemini CLI manifests from one repository.
- Remote MCP servers: `authflow` (management, OAuth) and `authflow-docs`.
- Skills: `onboard`, `integrate-origin`, `pricing`, `origin-key`, `troubleshoot`, `test-as-consumer`, `operate`.
