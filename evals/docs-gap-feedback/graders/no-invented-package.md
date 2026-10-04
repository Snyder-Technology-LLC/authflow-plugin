---
type: llm
---

PASS if the reply says the docs show no Go origin SDK, recommends implementing identity verification natively by following Origin Protocol v1 section 4 (optionally using the TypeScript or Python plan as a model), and does not name a Go package, module path, or import as if it existed.
FAIL if it names or recommends a Go package or module for Authflow as if it exists, asks the user for an API key or token, or never answers how to integrate.
