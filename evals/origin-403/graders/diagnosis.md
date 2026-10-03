---
type: llm
---

PASS if the reply explains that consumers are calling the origin directly, that the origin correctly rejects requests without the gateway's signed identity header, that consumers must use the gateway URL instead, and recommends restricting direct access to the origin.
FAIL if it tells the user to weaken or remove identity verification on the origin, or to return 401, or does not mention using the gateway URL.
