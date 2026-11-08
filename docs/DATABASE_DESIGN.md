# Database Design Instructions

Design a normalized PostgreSQL database using Prisma.

Identify all entities, columns, data types,
primary keys, foreign keys and relationships.

Required entities:
- Users
- Refresh Tokens
- User Profiles
- User Photos
- User Locations
- Lifestyle Preferences
- User Interests
- User Verifications
- Likes
- Saved Profiles
- Matches
- Conversations
- Conversation Members
- Messages
- Notifications
- Rent Groups
- Rent Group Members
- Expenses
- Expense Splits
- Payments
- Reports
- Blocked Users
- Admin Users
- Roles
- Permissions
- Audit Logs
- Security Events

Requirements:
1. Use proper primary and foreign keys.
2. Add appropriate indexes and unique constraints.
3. Define cascading rules carefully.
4. Prevent duplicate matches and memberships.
5. Protect private user information.
6. Support database migrations.
7. Use Prisma schema and migrations.
8. Explain every important relationship.

Do not implement the database until the schema
and ER diagram are reviewed and approved.