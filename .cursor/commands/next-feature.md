You are my CODING AGENT.

Follow `.cursor/rules`.

1. Read Claude.md, features.json, progress.md.
2. Identify the first feature where implemented=false.
3. Announce which feature ID you are working on.
4. Implement ONLY that feature.
5. Run: npm test npm run test:e2e
6. Evaluate test output.
7. If passing:
   - Update features.json (both flags → true).
   - Append a dated entry to progress.md.
   - Create commit: `feat: {id} {short description}`
8. Show git diff summary, updated JSON, and updated progress.md.
