# Authflow plugin

Put your MCP server on [Authflow](https://authflow.ai). Consumers get one OAuth sign-in, free or paid access, and Stripe subscriptions. Your coding agent does the setup.

The plugin connects two remote MCP servers and adds onboarding skills:

| MCP server | URL | Auth |
| --- | --- | --- |
| `authflow` (management) | `https://staging.rails.authflow.ai/management/mcp` | Sign in with Google or GitHub in the browser |
| `authflow-docs` | `https://docs.authflow.ai/mcp` | None |

| Skill | What it does |
| --- | --- |
| `onboard` | Create, integrate, deploy, connect Stripe, verify, and publish, in order |
| `integrate-origin` | Implement the Origin Protocol in your server (.NET, TypeScript, Python) |
| `pricing` | Free or paid, price and credits, gateway or origin-reported metering |
| `origin-key` | Deliver an origin key to a secret store (paid `origin_reported` only) |
| `troubleshoot` | Pending requirements, verification failures, `invalid_origin_identity` |
| `test-as-consumer` | Connect through the gateway URL like a real consumer |
| `operate` | Usage, earnings, offer changes, disabling |

> **Preview.** This release targets Authflow **staging**. Production Rail is not live yet.

## Install

### Claude Code

```text
/plugin marketplace add Snyder-Technology-LLC/authflow-plugin
/plugin install authflow@authflow
```

Then run `/mcp`, select `authflow`, and authenticate.

### Codex

```bash
codex plugin marketplace add Snyder-Technology-LLC/authflow-plugin
```

Then install `authflow` from `/plugins`, and sign in to the `authflow` MCP server when prompted.

### Gemini CLI

```bash
gemini extensions install https://github.com/Snyder-Technology-LLC/authflow-plugin
```

Then run `/mcp auth authflow`.

### Cursor

Teams and Enterprise workspaces can import this repository as a team marketplace (**Dashboard → Plugins & MCPs → Import from Repo**). Cursor reads the root `plugin.json` and `mcp.json`.

On other plans, add the two servers to `~/.cursor/mcp.json` until the plugin is listed in the Cursor Marketplace:

```json
{
  "mcpServers": {
    "authflow": { "url": "https://staging.rails.authflow.ai/management/mcp" },
    "authflow-docs": { "url": "https://docs.authflow.ai/mcp" }
  }
}
```

## Use it

Open the repository that contains your MCP server and ask:

> Put this MCP server on Authflow as a free MCP named "My MCP" with slug `my-mcp`. Show me the result before publishing.

The agent never needs a key or token from you. You complete sign-in, consent, and Stripe in the browser. Publishing always waits for your confirmation.

## Feedback

When an Authflow error, doc, or missing tool makes the agent guess or work around something, the skills have it report that once with `authflow_send_feedback` (or `send_feedback` on `authflow-docs`), then carry on. Reports go to the Authflow team, never include keys or your data, and are attributed to your workspace when you are signed in. You can send one yourself with `npx -y -p authflow-cli@0.7.0 authflow feedback --kind feedback --summary "..."`.

## Repository layout

One repository serves every client; each reads its own manifest, and all of them share `skills/`.

| Client | Manifest | MCP config |
| --- | --- | --- |
| Claude Code, claude.ai | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | `.mcp.json` |
| Cursor, Codex | `plugin.json` ([Agent Plugins 1.0](https://agent-plugins.org)), `.agents/plugins/marketplace.json` (Codex) | `mcp.json` |
| Gemini CLI | `gemini-extension.json` | inline |

`node scripts/check-manifests.mjs` keeps the version, the MCP servers, and skill frontmatter consistent across them. CI also runs Claude's and Gemini's validators.

## Docs

- [Onboard with your agent](https://docs.authflow.ai/docs/onboarding/agent)
- [Origin Protocol v1](https://docs.authflow.ai/docs/protocol/v1)
- [CLI](https://docs.authflow.ai/docs/tools/cli)

## License

Apache-2.0
