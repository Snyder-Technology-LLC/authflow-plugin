# Authflow plugin

Put your MCP server on [Authflow](https://authflow.ai). Consumers get one OAuth sign-in, free or paid access, and Stripe subscriptions. Your coding agent does the setup.

The plugin connects one remote MCP server and adds skills:

| MCP server | URL | Auth |
| --- | --- | --- |
| `authflow` (management) | `https://staging.rails.authflow.ai/management/mcp` | Sign in with Google or GitHub in the browser |

| Skill | What it does |
| --- | --- |
| `onboard` | Create, integrate, deploy, connect Stripe, verify, and publish, in order |
| `integrate-origin` | Implement the Origin Protocol in your server (.NET, TypeScript, Python) |
| `pricing` | Free or paid, price and credits, gateway or origin-reported metering |
| `origin-key` | Deliver an origin key to a secret store (paid `origin_reported` only) |
| `doctor` | Run Authflow's hosted health check and act on what it finds |
| `troubleshoot` | Pending requirements, verification failures, `invalid_origin_identity` |
| `test-as-consumer` | Connect through the gateway URL like a real consumer |
| `operate` | Usage, earnings, offer changes, disabling, health sweeps |
| `feedback` | Report a bug, docs gap, missing tool, or your own message to the Authflow team |

> **Preview.** This release targets Authflow **staging**. Production Rail is not live yet.

## Install

Turn on auto-update where your client offers it, so skill fixes reach you without asking. [Updating](#updating) covers updating by hand.

### Claude Code

```text
/plugin marketplace add Snyder-Technology-LLC/authflow-plugin
/plugin install authflow@authflow
```

Then run `/mcp`, select `authflow`, and authenticate.

Turn on auto-update with `/plugin`, **Marketplaces**, `authflow`, **Enable auto-update**. Or declare the marketplace in `~/.claude/settings.json` with auto-update on:

```json
{
  "extraKnownMarketplaces": {
    "authflow": {
      "source": { "source": "github", "repo": "Snyder-Technology-LLC/authflow-plugin" },
      "autoUpdate": true
    }
  }
}
```

### Codex

```bash
codex plugin marketplace add Snyder-Technology-LLC/authflow-plugin
```

Then install `authflow` from `/plugins`, and sign in to the `authflow` MCP server when prompted.

### Gemini CLI

```bash
gemini extensions install https://github.com/Snyder-Technology-LLC/authflow-plugin --auto-update
```

Then run `/mcp auth authflow`.

### Cursor

Teams and Enterprise workspaces can import this repository as a team marketplace (**Dashboard → Plugins & MCPs → Import from Repo**). Cursor reads the root `plugin.json` and `mcp.json`.

On other plans, add the server to `~/.cursor/mcp.json` until the plugin is listed in the Cursor Marketplace:

```json
{
  "mcpServers": {
    "authflow": { "url": "https://staging.rails.authflow.ai/management/mcp" }
  }
}
```

## Use it

Open the repository that contains your MCP server and ask:

> Put this MCP server on Authflow as a free MCP named "My MCP" with slug `my-mcp`. Show me the result before publishing.

The agent never needs a key or token from you. You complete sign-in, consent, and Stripe in the browser. Publishing always waits for your confirmation.

Ask "Is my Authflow MCP healthy?" at any time. The `doctor` skill runs Authflow's hosted checks and tells you what to fix and who has to fix it: the agent, you (DNS, Stripe, deploys), or Authflow.

## Updating

The plugin's MCP configs send two request headers, `Authflow-Plugin-Version` and `Authflow-Plugin-Client`, so Authflow can tell users when an update exists. When your plugin is out of date, the management MCP tells your agent once, and the agent passes on how to update. Updates apply in a new session.

### Claude Code

```bash
claude plugin update authflow@authflow
```

Or `/plugin`, **Installed**, `authflow`, **Update**. Then start a new session. With auto-update on, Claude Code fetches new versions itself; they still apply in a new session.

### Codex

1. Quit Codex.
2. Run `codex plugin marketplace upgrade authflow`, then `codex plugin add authflow@authflow`.
3. Start a new thread.

`codex mcp list` should then show one `authflow` row with the management MCP URL.

### Gemini CLI

```bash
gemini extensions update authflow
```

Then restart Gemini CLI. Extensions installed with `--auto-update` update themselves; the new version also applies after a restart.

### Cursor

A team admin refreshes the Authflow team marketplace in the Cursor dashboard. Then reload the Cursor window. A server added by hand to `~/.cursor/mcp.json` has no plugin to update.

## Feedback

When an Authflow error, doc, or missing tool makes the agent guess or work around something, or you ask it to tell Authflow something, the `feedback` skill sends one report with `authflow_send_feedback` and gives you its `feedback_id`. Reports go to the Authflow team, never include keys, tokens, or anyone's personal data, and are attributed to your workspace when you are signed in. The agent asks you before a report includes your code, configuration, URLs, or words. Nobody replies.

You can send one yourself, signed in or not:

```bash
npx -y -p authflow-cli@0.10.0 authflow feedback --issuer https://staging.rails.authflow.ai --kind docs_gap --summary "..."
```

`--kind` is one of `bug`, `client_compat`, `unclear_error`, `docs_gap`, `missing_capability`, `security`, `user_message`, or `other`.

## Repository layout

One repository serves every client; each reads its own manifest, and all of them share `skills/`.

| Client | Manifest | MCP config |
| --- | --- | --- |
| Claude Code, claude.ai | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | `.mcp.json` |
| Cursor, Codex | `plugin.json` ([Agent Plugins 1.0](https://agent-plugins.org)), `.agents/plugins/marketplace.json` (Codex) | `mcp.json` |
| Gemini CLI | `gemini-extension.json` | inline |

Each MCP config sends `Authflow-Plugin-Version` (this plugin's version) and `Authflow-Plugin-Client` (`claude-code`, `agent-plugins`, or `gemini-cli`), so Authflow can tell users when an update exists. They carry nothing else.

| Script | What it does |
| --- | --- |
| `scripts/check-manifests.mjs` | Keeps the name, version, description, MCP servers, request headers, `authflow-cli` pin, and skill frontmatter consistent across the manifests |
| `scripts/check-refs.mjs` | Checks that every management MCP tool the skills, evals, and README name exists |
| `scripts/check-version-bump.mjs` | Checks that a change to what ships comes with a higher version and a CHANGELOG entry |
| `scripts/check-npm-pin.mjs` | Checks that the pinned `authflow-cli` version is on npm (and, daily, that it is the latest) |
| `scripts/check-endpoints.mjs` | Checks, from outside any allowlist, that every MCP URL in every manifest answers with an OAuth challenge and its metadata |
| `scripts/sync-tool-manifest.mjs` | Refreshes the eval mocks' copy of the management MCP's tool schemas from an Authflow checkout |

CI runs these checks, Claude's and Gemini's validators, and the Agent Plugins schemas on every change (the version check on pull requests only), and again daily. `.github/workflows/release.yml` tags every version bump merged to `main` as `vX.Y.Z` and publishes a GitHub Release with that version's CHANGELOG entry.

After that GitHub Release `vX.Y.Z` exists, open an Authflow pull request that sets `ManagementMcp:Releases:PluginCurrent` in `rail/src/Rail.Host/appsettings.json` to `X.Y.Z`. Rail compares the `Authflow-Plugin-Version` header with that setting to tell users of an older plugin to update, and the doctor reports it as `versions.plugin_current`. Never bump it before the release exists: staging Rail deploys from Authflow's `main`, so it would tell every user to update to a version `claude plugin update` and `gemini extensions update` cannot install yet. If the setting lags, older plugins simply get no update notice; a release users need not hear about may skip the bump.

## Docs

During the preview, Authflow's documentation is served to signed-in agents by the management MCP (`authflow_search_docs`, `authflow_get_doc`, and the resource-specific `authflow_integration_plan`). Once you are signed in, ask your agent for any page, for example the onboarding guide, Origin Protocol v1, the doctor's checks, or the CLI reference.

## License

Apache-2.0
