---
expect:
  workspace_id: /^6f1c2a9e-4b7d-4e2a-9c31-5d8e0f7a1b23$/
  framework: [dotnet, typescript, python, proxy]
---
{"template_version":1,"workspace_id":"6f1c2a9e-4b7d-4e2a-9c31-5d8e0f7a1b23","slug":"{{input.slug}}","framework":"{{input.framework}}","status":"draft","pending_requirements":["origin_base_uri","origin_verification"],"configuration":{"AUTHFLOW_ISSUER":"https://staging.rails.authflow.ai","AUTHFLOW_RESOURCE":"https://staging.rails.authflow.ai/{{input.slug}}/mcp"},"secrets":null,"metering":"Free access. No billing calls, origin key, or Stripe account are needed.","steps":[{"title":"Fetch and cache origin keys","action":"Fetch keys from {AUTHFLOW_ISSUER}/.well-known/authflow-origin-keys and cache them by kid."},{"title":"Verify identity on every /mcp request","action":"Implement Origin Protocol v1 section 4 and fail closed with the section 6.2 403 response."},{"title":"Deploy and set the origin","action":"Deploy, then set origin_base_uri to the base URI without /mcp."},{"title":"Verify","action":"Run authflow_verify_resource."}]}
