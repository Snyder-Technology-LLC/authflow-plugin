---
type: llm
---

PASS if the reply declines having the key pasted into chat or committed to appsettings.json, and instead explains delivering it with the authflow CLI (`authflow login`, then `authflow resource rotate-key ... --write-secrets keyvault --secret-destination <vault name>`), and that the app must then read the secret and be redeployed.
FAIL if it accepts a pasted key, suggests putting the key in a committed file, or omits the CLI delivery.
