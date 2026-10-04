---
name: onboard
description: Put an MCP server on Authflow end to end - create the resource, integrate the Origin Protocol, deploy, connect Stripe for paid access, verify, and publish. Use when the user wants to add sign-in, a paywall, subscriptions, or usage billing to their MCP server with Authflow, or wants to resume an Authflow setup that is partly done.
---

# Onboard an MCP server onto Authflow

Authflow sits in front of the user's MCP server (the **origin**). Consumers connect to an Authflow **gateway URL**, sign in once with OAuth, pay if the MCP is paid, and the gateway forwards each request to the origin with a signed identity header. The origin verifies that header and serves the request.

You drive this through the `authflow` MCP server (tools named `authflow_*`). The `authflow-docs` MCP server is public reference material.

## Before you start

- If no `authflow_*` tools are available, the management MCP is not connected or not authorized yet. Tell the user to authorize it in their client (Claude Code: `/mcp`, choose `authflow`, authenticate. Gemini CLI: `/mcp auth authflow`. Cursor and Codex: open the MCP settings and sign in to `authflow`). Sign-in uses Google or GitHub in the browser. On first connection they choose **Create your workspace and connect**. Do not continue without these tools.
- Never ask for, accept, print, or store an admin key, origin key, OAuth token, or Stripe secret in chat or in a tool argument. Authflow never needs one from the conversation.
- Writes are never retried automatically. If a write was interrupted or its result is unclear, read state with `authflow_get_resource` before doing anything again.

## The flow

Follow these steps in order. Report each tool result's `status`, `pending_requirements`, and `allowed_actions` as Rail returns them; do not paraphrase them into something else.

1. **Orient.** Call `authflow_list_workspaces` and use the returned workspace id as `workspace_id` everywhere. Then call `authflow_list_resources`. If a resource for this server already exists, this is a resume: call `authflow_get_resource` and continue from whatever it still needs instead of creating a duplicate.
2. **Inspect the repository.** Find the MCP server, its language and framework, its tools, and how it is deployed. Use the `integrate-origin` skill to choose `dotnet`, `typescript`, `python`, or `proxy`.
3. **Choose the offer with the user.** Free, or paid with a monthly price and credits. If paid, settle metering. Use the `pricing` skill. Confirm the slug (lowercase letters, digits, hyphens; at most 32 characters) and the display name.
4. **Create the draft.** Call `authflow_create_resource`. A draft is not reachable by consumers.
5. **Integrate.** Call `authflow_integration_plan` with the slug and framework. It returns the real issuer and resource values for this MCP. Implement it in the user's code with the `integrate-origin` skill. If the MCP is paid with `origin_reported` metering, the origin also needs its key: use the `origin-key` skill.
6. **Deploy.** The user deploys the origin wherever they host it. Help with their deployment config if asked, but the deploy is theirs.
7. **Set the origin.** Call `authflow_set_origin` with the deployed base URI. The origin serves MCP at `/mcp`; the base URI must **not** end in `/mcp`. Optionally call `authflow_set_custom_domain` and follow the DNS records it returns, then `authflow_refresh_domain`.
8. **Connect Stripe (paid only).** Call `authflow_stripe_status`. If it is not `ready`, call `authflow_stripe_action` with `kind` `onboard` (new Stripe account) or `connect_existing` (they already have one). Give the user the returned link. They sign in to Authflow and finish Stripe in the browser. When they say they are done, call `authflow_stripe_status` again.
9. **Verify.** Call `authflow_verify_resource`. It probes the deployed origin. If `origin_verification` remains in `pending_requirements`, read the verification report and use the `troubleshoot` skill.
10. **Publish, with permission.** When `publish` appears in `allowed_actions`, summarize what will go live (name, offer, price, metering, gateway URL) and ask the user to confirm. Only after an explicit yes, call `authflow_publish_resource`.
11. **Hand over.** Give the user the `gateway_url` from the receipt. That is the only URL consumers should ever use. Never publish or share the origin URL: the origin correctly rejects unsigned requests with `403 invalid_origin_identity`. Suggest the `test-as-consumer` skill.

## Rules that hold throughout

- Changing the offer, metering, origin, or domain invalidates verification and publication. Verify again, then ask before publishing again. Changing only the display name keeps verification.
- The custom hostname cannot change after the MCP first goes live.
- A paid MCP needs a Stripe account with charges enabled before it can publish. Authflow takes a 9% platform fee; the creator's Stripe account is the merchant of record.
- For detail, use `authflow_search_docs` and `authflow_get_doc`, or the `authflow-docs` tools (`get_protocol_section` for one Origin Protocol section). If the docs do not answer a question, say so instead of guessing, and report the gap with `authflow_send_feedback`.
- **Report friction.** When an Authflow tool error, doc, or missing capability makes you guess, retry with different arguments, work around something, or ask the user to do by hand what you expected a tool to do, call `authflow_send_feedback` once for that issue, then continue the task. Pick the `kind` that fits (`bug`, `docs_gap`, `missing_tool`, `confusing`, `workaround`, `feedback` for a suggestion, or `other`), give a one-line `summary`, and add the error text and your workaround when you have them. Never put keys, tokens, or the user's data in it. Nobody replies; it goes to the Authflow team, who fix the docs, errors, and tools behind it. It is not a substitute for telling the user what happened.
- This release targets Authflow staging (`https://staging.rails.authflow.ai`). Production Rail is not live yet.
