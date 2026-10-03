---
name: troubleshoot
description: Diagnose why an Authflow MCP will not verify, publish, connect, or bill - pending_requirements, resource_not_ready, 403 invalid_origin_identity, usage endpoint errors, management sign-in failures, and Stripe readiness. Use when an Authflow tool returns an error or a requirement will not clear.
---

# Troubleshoot Authflow

Start from state, not memory: call `authflow_get_resource` (and `authflow_stripe_status` for paid MCPs). Report `pending_requirements` and `allowed_actions` exactly as returned.

## pending_requirements

| Code | Meaning | Fix |
| --- | --- | --- |
| `origin_base_uri` | No origin set | Deploy, then `authflow_set_origin` with the base URI (not ending in `/mcp`) |
| `custom_domain_dns` | Custom hostname not ready | Create the DNS records from the receipt's `custom_domain.records`, then `authflow_refresh_domain` |
| `origin_verification` | No passing probe for the current configuration | `authflow_verify_resource`; if it fails, see the next section |
| `connected_account_id` | Paid, no Stripe account | `authflow_stripe_action` with `onboard` or `connect_existing` |
| `stripe_onboarding_complete` | Paid, Stripe charges not enabled yet | The user finishes Stripe's requirements in the browser; recheck `authflow_stripe_status` |
| `paid_offer` | Paid, but price or credits are zero | `authflow_update_resource` with a positive price and credits |

`409 resource_not_ready` from `authflow_publish_resource` means one of these is still pending. Resolve them; do not keep retrying publish.

## Custom domain states

`awaiting_ownership`: create the TXT record, then refresh. `provisioning`: wait, and add the certificate CNAME. `awaiting_traffic`: set the traffic CNAME. `moved`: restore the traffic CNAME. `removed`: refresh to prove ownership again. `blocked`: read `last_error`; Authflow support may be needed. `ready`: done.

## Verification fails

Read the verification report from `authflow_verify_resource`. Common causes:

- The base URI ends in `/mcp`, so the probe hits `/mcp/mcp`.
- The origin returns 401, or adds `WWW-Authenticate`, or reports the rejection as an MCP tool error. It must return 403 with the exact Origin Protocol section 6.2 body.
- Wrong configuration: the issuer or resource does not match `authflow_integration_plan`.
- The origin is not reachable from the internet, or the deploy did not pick up the change.

## 403 invalid_origin_identity

The origin rejected a request's identity header. If a consumer or client sees this, it is calling the **origin** directly instead of the `gateway_url`. That is the origin behaving correctly; give the client the gateway URL and lock down ingress. If the probe sees it, the `error_code` says why:

| error_code | Likely cause |
| --- | --- |
| `missing_identity`, `unsupported_version`, `malformed_identity` | Header missing or altered, often by a proxy or load balancer in front of the origin |
| `bad_signature`, `unknown_key`, `keys_unavailable` | Wrong verification code, or the origin cannot fetch or refresh the issuer's origin keys |
| `expired`, `not_yet_valid` | Clock skew on the origin host, or expiry checked wrongly |
| `replayed_nonce`, `replay_cache_unavailable` | Replay cache misused, or not shared across instances |
| `iss_mismatch`, `resource_mismatch` | Issuer or resource configuration differs from the integration plan |
| `forbidden_claim` | The header carries a member the protocol forbids, such as a credit balance. The origin is right to reject it: the header did not come from the gateway unchanged |

## Usage endpoint errors (origin_reported only)

`401 invalid_origin_credentials`: the origin key is wrong or was rotated; redeliver with the `origin-key` skill. `403 origin_resource_mismatch`: the key belongs to another resource. `409 insufficient_credits`: the consumer is out of credits; the origin must refuse the work. `409 resource_not_live`: publish first.

## Management MCP errors

- `401`/`403` with "Reconnect the management client": the sign-in expired, was revoked, or was granted read-only. Re-authorize the `authflow` MCP in the client, approving read and write access for the right workspace.
- `invalid_scope` during sign-in: the client asked for scopes other than `management:read`, `management:write`, and `offline_access`. Report it as a client compatibility bug.
- `validation_failed`: fix the arguments against the tool description; nothing changed.

## Stripe status

`ready` is the only state that lets a paid MCP publish. `not_connected`: start `authflow_stripe_action`. `action_required`, `pending_verification`, `pending`, `restricted`: the user has Stripe requirements to finish in the browser. `revoked`: connect an account again.

If none of this explains it, search the docs with `authflow_search_docs`. A search with no results is a documentation gap worth reporting to Authflow, not a reason to guess.
