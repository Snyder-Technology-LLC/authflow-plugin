---
name: operate
description: Run a live Authflow MCP - read usage and earnings, rename the workspace or MCP, change price or metering and republish, and disable an MCP. Use for day-to-day management of MCPs already on Authflow.
---

# Operate live MCPs

Begin with `authflow_list_workspaces`, then `authflow_workspace_overview` for recent activity, and `authflow_list_resources` for status.

## Read

- `authflow_get_usage`: charged work and compensated failures from the last 30 days. This is the credit ledger, not all traffic: free requests and unpaid failures are excluded.
- `authflow_get_earnings`: recent Stripe payments with per-currency totals. Never add totals across currencies. If `history_complete` is false, describe the totals as covering the displayed history only.

## Change

- **Rename.** `authflow_rename_workspace` renames the workspace. `authflow_update_resource` with only `display_name` renames an MCP and keeps it verified and live.
- **Price, credits, or metering.** Use the `pricing` skill and `authflow_update_resource`. This **takes the MCP out of live** until it is verified and published again. Tell the user that before making the change. Then call `authflow_verify_resource`, and call `authflow_publish_resource` only after they confirm.
- **Origin or domain.** These also invalidate verification. Verify and ask before republishing. The custom hostname cannot change after the MCP first went live.
- **Disable.** `authflow_disable_resource` stops the gateway from serving the MCP to every consumer. It is destructive: state the impact, and call it only after the user explicitly confirms.

Writes are never retried automatically. After an error or interruption, read `authflow_get_resource` before trying again.
