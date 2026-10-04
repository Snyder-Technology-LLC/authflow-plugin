# Changelog

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
