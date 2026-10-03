---
name: pricing
description: Choose an Authflow MCP's offer - free or paid, monthly price and credits, gateway metering versus origin-reported usage, and per-tool costs. Use when creating or changing an Authflow resource's access mode, price, credits, metering_mode, metering_default_units, or tool_units.
---

# Choose the offer and metering

Decide these with the user. They are business choices; do not pick a price for them.

## Free or paid

- **free**: consumers sign in and use the MCP. No Stripe account, no billing code, no origin key.
- **paid**: consumers subscribe monthly through Stripe Checkout during sign-in. Each subscription grants `credits_per_period` credits, and tool calls spend credits. The creator's Stripe account must have charges enabled before the MCP can publish. Authflow takes a 9% platform fee.

## Paid: price and credits

`authflow_create_resource` defaults to `currency` `usd`, `price_amount_minor` `900` ($9.00) and `credits_per_period` `12`. Amounts are in minor units (cents for USD). Price and credits must both be greater than zero.

## Paid: metering mode

| | `gateway_metered` (default) | `origin_reported` |
| --- | --- | --- |
| Who charges | The gateway, before forwarding each call | The origin, through the usage endpoint |
| Origin key | Not needed | Needed (see the `origin-key` skill) |
| Origin code | Identity verification only | Identity verification, plus debit before the provider call and a compensating credit on failure |
| Refund on failure | Only transport failures, or `isError` in a JSON response up to 256 KiB | Exact, as the origin reports it |

Recommend `gateway_metered` unless:
- the server streams responses (SSE or chunked) and failed calls must not be charged, because the gateway cannot detect those failures; or
- the charge depends on what a downstream provider actually completed.

Then use `origin_reported`. Never charge the same operation through both.

## Per-tool costs

- `metering_default_units` (default 1) is what a tool call costs when it has no override.
- `tool_units` maps tool names to costs; `0` makes a tool free. Costs are integers from 0 to 1,000,000, with at most 64 entries.
- A supplied `tool_units` map **replaces** the whole previous map. To change one tool, send the full map with the change.

## Changing the offer later

Use `authflow_update_resource`. Omitted fields are preserved. Any change to the offer or metering invalidates verification and publication: verify again with `authflow_verify_resource`, then ask the user before publishing again. Display-name-only changes keep verification.
