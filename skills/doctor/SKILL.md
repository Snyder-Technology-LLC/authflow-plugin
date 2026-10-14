---
name: doctor
description: Check an Authflow MCP's health with Authflow's hosted doctor (authflow_doctor) and act on what it finds - origin reachability and conformance, verification freshness, custom domain DNS and TLS, Stripe readiness, and consumer client sign-in. Use when something looks broken, before verifying or publishing, after DNS or deploy changes, or when the user asks whether their MCP is healthy.
---

# Check health with the Authflow doctor

`authflow_doctor` runs read-only checks on the signed-in workspace's MCPs, and on the Authflow endpoints they depend on, and returns one report. It changes nothing: it does not record a verification, refresh a domain, register clients, or call Stripe. It only sees this workspace's own resources.

## 1. Run it

Get `workspace_id` from `authflow_list_workspaces`, then call `authflow_doctor`:

| Argument | When |
| --- | --- |
| `workspace_id` | Always |
| `slug` | When you know which MCP. Without it, the doctor gives every MCP in the workspace a quick check, up to 20, and its `summary` says when it stopped early |
| `depth` | `quick` (default) for a fast look. `full` before `authflow_verify_resource` or publishing; it adds the Origin Protocol conformance probe and needs a `slug` |
| `groups` | Re-run only what changed: `origin` after a deploy, `domain` after DNS changes, `billing` after Stripe, `resource` after verifying. The others are `rail` and `clients` |
| `client` | `claude`, `chatgpt`, `codex`, `cursor`, or `all`: checks that consumers using that client can register and sign in (the `clients` group) |

The doctor is rate-limited per workspace. On a 429, wait as long as the error says instead of calling again in a loop.

## 2. Read the report

- `overall`: `healthy`; `action_needed` (warnings, or failures that do not block); `blocked` (a blocking check fails, so the MCP cannot work or publish); or `authflow_issue` (a failure on Authflow's side).
- `summary`: one line for the user.
- `next_action`: the first thing to fix, with its `check_id`, `slug`, and `actor`. Start there.
- `checks`: each has an `id`, a `status` (`pass`, `warn`, `fail`, `skip`), `blocking`, `observed`, `expected`, and a `fix`. A `skip` says why in `observed`.

Report `overall`, `summary`, and each failing check's `observed` and `expected` as returned; do not paraphrase them into something else. Do not call an MCP healthy unless `overall` is `healthy`.

## 3. Act on `fix.actor`

- `agent`: you can fix it. Change the code or configuration as `fix.summary` says, or call `fix.tool` with `fix.arguments` when it names one (the usual rules still apply: ask before publishing, and read state after an unclear write). After a code change, the origin has to be redeployed; the deploy is the user's unless they ask you to do it. Then re-run `authflow_doctor` with only the affected `groups`.
- `owner`: only the user can do it, such as DNS records, Stripe requirements, a deploy, or hosting settings. Give them the steps from `fix.summary` word for word, including record names and values, and re-run once they say it is done.
- `authflow`: the problem is on Authflow's side and there is nothing for the user to change. Tell them so, and do not keep re-running. `fix.tool` is a ready `authflow_send_feedback` report: send it once with `fix.arguments` (the `feedback` skill covers the reply), and do not file it again on later runs.

`fix.docs` is a docs path with an anchor, such as `/docs/onboarding/doctor#resource-prm`. When a fix needs more context, read it with `authflow_get_doc`: the part before `#` as `path`, the anchor as `section`.

## 4. Local checks

When `local_checks_suggested` is present, run that command in a shell, exactly as given, and read its JSON the same way: `hosted` is the same report, and `local` adds the checks only this machine can run. It needs Node.js 22.12 or later and the CLI's own sign-in; if its `local.login` check fails, give the user the sign-in command it names, or skip the local checks. Without a shell, give the user the command instead.

## 5. Before verify and publish

- Run with the `slug` and `depth` `full` before `authflow_verify_resource`, and fix every `agent` failure first.
- Publishing needs a passing verification from the last 24 hours. If `resource.verification_fresh` does not pass, verify again before asking to publish.
- Never publish while a check with `blocking` `true` fails, even if `publish` appears in `allowed_actions`. Publishing still waits for the user's explicit yes.

## Plugin and CLI updates

A tool result, usually from `authflow_list_workspaces`, may contain `client_notice`. When it will not interrupt the task, tell the user once, in one sentence, using `for_user` and `how_to_update`. Run the update command only if the user asks. Updates apply in a new session (a new thread in Codex), so finish the current task first. Do not repeat the notice in the same session.
