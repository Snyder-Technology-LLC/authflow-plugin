---
name: integrate-origin
description: Implement Authflow's Origin Protocol in an MCP server so it accepts requests forwarded by the Authflow gateway - pick the dotnet, typescript, python, or proxy integration, apply the resource-specific integration plan, and get the fail-closed rules right. Use when changing an MCP server's code for Authflow, or when an origin fails verification.
---

# Integrate the Origin Protocol

The gateway forwards each consumer request to the origin with a signed `X-Authflow-Identity` header. The origin must verify it on every request and refuse anything else. That is the whole integration for a free or gateway-metered MCP.

## 1. Choose the framework

| The server is... | Framework |
| --- | --- |
| .NET (`*.csproj`, ASP.NET Core) | `dotnet` |
| Node or TypeScript (`package.json`) | `typescript` |
| Python (`pyproject.toml`, `requirements.txt`) | `python` |
| Any other language | Implement verification natively. Follow the `typescript` or `python` plan as the closest model, plus Origin Protocol section 4 |
| Code the user cannot change | `proxy` (see the warning below) |

`proxy` puts Authflow's origin proxy in front of the unchanged server. The proxy verifies the identity and forwards it on. **In this preview the proxy container image is not publicly distributed**, and `authflow scaffold --receipt` cannot read current receipts. Tell the user this path is not self-serve yet, and prefer a native integration whenever the code can change.

Only the packages named in the plan exist. Call `list_integration_paths` from the `authflow-docs` tools before looking for an SDK in a package registry. Do not guess package names. If the user's language has no published SDK, or a plan step is unclear, report it with `authflow_send_feedback` (`kind` `missing_tool` or `docs_gap`) after you have chosen a path.

## 2. Get the plan for this resource

Call `authflow_integration_plan` with `workspace_id`, `slug`, and `framework`. It returns the real configuration values (issuer, resource) and the ordered steps for this MCP's access mode and metering. Implement those steps.

- Put configuration values in the app's normal configuration, not hard-coded in source.
- The plan never contains a secret. If the plan says the origin needs a key (paid `origin_reported` only), use the `origin-key` skill.
- If the resource does not exist yet, the `authflow-docs` tool `get_integration_plan` gives the generic steps. Switch to the resource-specific plan once the draft exists.

## 3. Rules every origin must follow

- Serve MCP at `/mcp`. The base URI given to `authflow_set_origin` must not end in `/mcp`, or requests go to `/mcp/mcp`.
- Verify the identity header on **every** MCP request, and fail closed. A missing or invalid header returns **403** with the exact body from Origin Protocol section 6.2 and **no** `WWW-Authenticate` header. Never return 401 from the origin, and never return the rejection as an MCP tool error.
- The header is not a JWT. Do not use a JWT library or the OAuth server's JWKS. Keys come from the issuer's origin-key endpoint, as the plan describes.
- Check the issuer, the resource, expiry, and nonce replay. Before running more than one instance, use a shared replay (nonce) cache.
- Never return payment or checkout URLs as tool output. Never cache credit balances.
- Give every tool a `title` and `readOnlyHint` / `destructiveHint` annotations.
- Lock ingress down so consumers can only reach the origin through the gateway.

For exact wording, use `get_protocol_section` from the `authflow-docs` tools. The useful anchors are `4-verification-algorithm`, `35-worked-example-test-vector`, `62-exact-origin-response`, and `7-usage-reporting-endpoint`. Test signature verification against the section 3.5 vector without applying expiry; test expiry separately.

## 4. Confirm with the rail

Deploy, call `authflow_set_origin`, then `authflow_verify_resource`. The rail's probe is the source of truth. Do not hand-roll signed requests to test the origin. If verification fails, use the `troubleshoot` skill.
