---
name: origin-key
description: Deliver an Authflow origin API key into a secret store with the authflow CLI, for paid MCPs that use origin_reported metering. Only use when the resource is paid with metering_mode origin_reported and the origin needs AUTHFLOW_ORIGIN_API_KEY; free and gateway-metered MCPs never need a key.
---

# Deliver the origin key

Only a paid resource with `metering_mode` `origin_reported` needs an origin key. The origin uses it to report usage. For every other resource, the CLI reports `origin_key_delivery: not_required` and rotates nothing.

The key never passes through the conversation. The `authflow` CLI writes it straight into a secret store. Do not ask the user to paste a key, do not print one, and do not put one in a tool argument, a committed file, or a log.

This needs a shell on a machine that can reach the secret destination, and Node.js 22.12 or later.

## 1. Get the commands from the plan

Call `authflow_integration_plan` with `workspace_id`, `slug`, and the framework. For a paid `origin_reported` resource, one of its steps gives the exact `login` and `resource rotate-key` commands for this resource, with the CLI version, issuer, and workspace already filled in. Use them as returned; do not write them from memory or change the version or issuer. If the plan has no such step, the resource needs no key.

If the `authflow` MCP is not connected yet, explain the steps by name (sign in with `authflow login`, then `authflow resource rotate-key <slug>` with a secret destination, as below), and get the exact commands from the plan once it is.

## 2. Authorize the CLI

Run the plan's `login` command. It opens the browser for sign-in and consent and stores the login in the operating system's credential store. Add `--no-browser` to print the sign-in URL instead of opening it. Either way, the browser's callback must reach this machine.

## 3. Choose the destination with the user

| `--write-secrets` | `--secret-destination` | Use for |
| --- | --- | --- |
| `keyvault` | Azure Key Vault **name** (not a URL) | Deployed origins on Azure |
| `user-secrets` | Path to the .NET project (`.csproj`) | Local .NET development |
| `env-file` | Path to an env file that is not tracked by git | Local development only; the file is plaintext |

For `env-file`, confirm the file is in `.gitignore` before writing it.

## 4. Rotate and deliver

Run the plan's `rotate-key` command, keeping its `npx` prefix, `--issuer`, and `--workspace` exactly as given, and add the destination the user chose:

```text
authflow resource rotate-key <slug> --issuer <plan issuer> --workspace <workspace-id> --write-secrets <keyvault|user-secrets|env-file> --secret-destination <destination>
```

The destination is validated before a key is issued. Key Vault secret names include the resource identity, so two resources do not overwrite each other.

## 5. Afterwards

- A successful delivery reports `deployment_updated: false`. The app still has to read the secret (configuration key `Authflow:OriginApiKey` or environment variable `AUTHFLOW_ORIGIN_API_KEY`) and be redeployed. Help wire the secret reference into the deployment, then verify again with `authflow_verify_resource`.
- If delivery fails, the previous key may already be revoked. Fix the destination, check the resource with `authflow_get_resource`, and only then ask the user before rotating again. The CLI never retries rotation on its own.
- `authflow logout` revokes the CLI's authorization and removes its stored credential. `--local-only` clears this device only.
- When a plan step, CLI error, or doc made this harder than it should have been, report it once with the `feedback` skill, then continue.
