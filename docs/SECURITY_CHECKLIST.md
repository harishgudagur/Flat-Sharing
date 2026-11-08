# Security Requirements — 20 Checks

Implement and test every requirement.

1. Never expose secret keys in frontend code.
2. Keep private configuration outside public directories.
3. Scan Git history for exposed secrets.
4. Rotate compromised credentials.
5. Authenticate and authorize protected requests.
6. Validate important operations on the server.
7. Prevent IDOR and unauthorized user data access.
8. Secure databases, storage and backups.
9. Protect admin actions using RBAC and audit logs.
10. Test account access boundaries.
11. Apply rate limits to sensitive endpoints.
12. Control AI usage and spending if AI is introduced.
13. Validate all incoming data.
14. Use safe Prisma queries and prevent SQL injection.
15. Prevent XSS and configure security headers.
16. Validate uploaded files by type, signature and size.
17. Verify payments and webhooks server-side.
18. Never log passwords, tokens or sensitive information.
19. Encrypt backups and test restoration.
20. Test unauthorized access and expected 401/403 responses.

For every requirement:
- Implement the protection.
- Identify affected files.
- Write relevant tests.
- Record the test results.

Do not mark a security requirement complete
without implementation and verification.