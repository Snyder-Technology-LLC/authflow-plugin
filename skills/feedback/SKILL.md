---
name: feedback
description: Send a report to the Authflow team with authflow_send_feedback - a bug, a client compatibility failure, an unclear error, a docs gap, a missing capability, a security concern, or something the user wants passed on. Use when the user says "tell Authflow" or asks to report a bug, a feature request, or a docs problem to Authflow, and after you work around any Authflow error, documentation gap, or missing tool.
---

# Send feedback to Authflow

`authflow_send_feedback` puts a report in front of the Authflow team, who fix the tools, errors, and docs behind it. Nobody replies, and a report never replaces telling the user what happened.

## When to send

- The user asks you to tell Authflow something, or to report a bug, a feature request, or a docs problem.
- An Authflow error says the problem is on Authflow's side and asks you to report it.
- You resolved or worked around something that an Authflow tool error, doc, or missing capability made harder than it should have been: you had to guess, retry with different arguments, work around it, or ask the user to do by hand what you expected a tool to do.
- The docs are missing something, or contradict a tool. That is a docs gap to report, not a hint to guess. An `authflow_search_docs` search that finds nothing is reported to Authflow automatically, so send at most one report for it, and only to add what you were trying to do.

Send one report per distinct issue, once you know what happened, then continue the task. Do not report problems in the user's own code, a validation error you fixed by correcting your own arguments, or checks the `doctor` skill says the owner has to fix.

## Choose the kind

Take the first that fits:

1. `security`: a key, token, or another workspace's data was exposed, or access was wrong. Tell the user right away as well, and never repeat the exposed value in the report.
2. `client_compat`: sign-in, connection, or tool listing failed in a specific MCP client. Name the client and its version.
3. `bug`: an Authflow tool or endpoint failed or returned something wrong.
4. `unclear_error`: the error was legitimate but did not say what to do next.
5. `docs_gap`: docs or tool descriptions are missing, wrong, or contradictory.
6. `missing_capability`: a tool, argument, or feature you needed does not exist. A feature the user asks for is this kind too.
7. `user_message`: the user asked you to pass on something that fits none of the above.
8. `other`.

`severity`: `blocked` (you could not finish), `worked_around` (you finished another way), or `minor` (an annoyance). Omit it for `user_message`.

## Write it

- `summary`: one line, at most 200 characters, saying what happened.
- `goal`: what you were trying to do. `details`: what you tried and what you expected instead.
- `tool_name` and `error_text` (word for word). Copy `request_id` from the Authflow error when there was one.
- `workaround` and `suggested_fix` when you have them, and `resource_slug` when one MCP was involved.
- `user_requested`: `true` when the user asked you to send it.

Leave out client, plugin, and version details; Authflow attaches them itself.

## Consent and privacy

- Send without asking when the report only describes Authflow's tools, errors, or docs.
- Ask the user first, showing the draft, when it would include their code, configuration values, URLs, or words. If they decline, send it without those parts, or not at all. When the user asked you to pass something on, that request is their consent; still show the draft if you reworded it.
- Never include keys, tokens, secrets, or anyone's personal data, even if the user offers them.

## After sending

The reply has a `feedback_id`, a `status`, and a `next` line to follow. Tell the user the `feedback_id` in one line, then continue your task.

- `recorded`: the report was filed.
- `duplicate`: the same report arrived recently, so Authflow counted it instead of filing it again. Give the user the id, and do not send it again.

Never promise a reply, a fix, or a date. Nobody replies here.

## When the MCP is not connected

If the `authflow` MCP is not connected, or sign-in failed (which may be what you are reporting), send the report from a shell. It works without signing in:

```bash
npx -y -p authflow-cli@0.9.0 authflow feedback --issuer https://staging.rails.authflow.ai --kind <kind> --summary "<one line>"
```

The optional flags match the fields above: `--severity`, `--goal`, `--details`, `--tool`, `--request-id`, `--error`, `--workaround`, `--suggested-fix`, `--slug`, and `--user-requested`. It prints the same `feedback_id`, `status`, and `next`. It needs Node.js 22.12 or later. The same consent and privacy rules apply.
