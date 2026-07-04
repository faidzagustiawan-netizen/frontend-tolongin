# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: backend-health.spec.ts >> Backend merespons dengan benar
- Location: e2e\backend-health.spec.ts:3:5

# Error details

```
Error: apiRequestContext.get: connect ECONNREFUSED ::1:3001
Call log:
  - → GET http://localhost:3001/api/v1
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br

```