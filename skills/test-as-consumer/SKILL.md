---
name: test-as-consumer
description: Test a published Authflow MCP the way a consumer will - connect a separate MCP client to the gateway URL, sign in, complete sandbox checkout for paid MCPs, call tools, and check usage and earnings. Use after publishing, or when the user wants to confirm an Authflow MCP works end to end.
---

# Test as a consumer

Test through the **gateway URL** only. Get it from `authflow_get_resource` (`gateway_url`). Never test against the origin: it rejects unsigned requests with `403 invalid_origin_identity`, by design.

## 1. Check the client first

Run `authflow_doctor` with the `slug` and `client` set to the client you will test with (`claude`, `chatgpt`, `codex`, or `cursor`; `all` for every one). Its `clients` group checks that the client can register and sign in. Fix any failure first, with the `doctor` skill.

## 2. Connect a separate client

Add the gateway URL as a remote (Streamable HTTP) MCP server in a client the creator is not using for management, or in a separate profile. Use a different sign-in than the creator's when possible, so the test reflects a real consumer.

The client gets a `401` and starts OAuth. The consumer signs in with Google or GitHub.

## 3. Expected result

- **Free MCP:** sign-in completes with no paywall, and the tools list loads.
- **Paid MCP:** sign-in shows Stripe Checkout for the subscription. The person testing completes checkout in the browser themselves; with a Stripe sandbox account, they use one of Stripe's published test cards. Do not enter payment details for them.

## 4. Call tools and check the ledger (paid)

Call a few tools from the consumer client. Then, from the management side:

- `authflow_get_usage`: charged calls and compensated failures from the last 30 days. Each paid call should appear with its configured cost. Failed calls should show compensation where the metering mode supports it.
- `authflow_get_earnings`: the payment and the application fee, with separate totals per currency. If `history_complete` is false, the totals cover only the history shown; do not call them all-time earnings.

## 5. If something is off

- The client never prompts for sign-in, or gets `403 invalid_origin_identity`: it is pointed at the origin, not the gateway URL.
- A `404` on the gateway URL: the resource is still a draft or is disabled. Check `authflow_get_resource`.
- The client cannot sign in or list tools although the doctor's `clients` checks pass: report it once with the `feedback` skill as `client_compat`, naming the client and its version.
- For anything else, use the `troubleshoot` skill.
