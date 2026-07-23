# Real Session Report Implementation Plan

1. Add database support for updating a stored session report.
2. Add a retry-scoring route for database and local fallback sessions.
3. Add a client helper that retries scoring and persists local reports.
4. Replace illustrative report constants with `session.report` rendering.
5. Add loading, not-found, unscored, retrying, and retry-error states.
6. Run contract, type, and production checks.
7. Commit and push the completed fix to `main`.
