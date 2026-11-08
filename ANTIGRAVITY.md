
# Flatmate Platform — Master Project Documentation

## 1. Project Overview

Build a premium Flatmate Matching and Rent Splitting Platform.

**Tagline:** Find your people. Share your space.

**Target market:** India initially, with future global expansion.

The platform helps people:
- Find compatible flatmates.
- Discover people based on lifestyle and preferences.
- Match with suitable flatmates.
- Chat with matched users.
- Create rent-sharing groups.
- Split rent and shared expenses.
- Verify user identities.

The initial MVP focuses on flatmate matching and rent splitting.

## 2. Mandatory Technology Stack

Do not replace the following technologies.

| Component | Technology |
|---|---|
| Mobile Application | Flutter + Dart |
| Public Website | Next.js + TypeScript |
| Admin Dashboard | Next.js + TypeScript |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| API | REST API |
| Real-time Communication | WebSockets |

## 3. Application Architecture

Use a modular monolithic backend architecture.

Required backend modules:

1. Authentication
2. User Management
3. User Profiles
4. Lifestyle Preferences
5. Discovery
6. Matching
7. Likes and Matches
8. Conversations
9. Messaging
10. Rent Groups
11. Expense Management
12. Payments
13. Notifications
14. Identity Verification
15. Reports
16. Admin Management
17. Analytics
18. Audit Logs

Keep business logic in the NestJS backend.

## 4. Core Features

### Authentication
- User registration
- Login and logout
- OTP verification
- JWT authentication
- Refresh token management

### User Profiles
- Profile photo
- Name and basic details
- City and locality
- Budget range
- Occupation
- Lifestyle preferences

### Flatmate Matching
- Discover flatmate profiles
- Like and pass
- Mutual matching
- Compatibility percentage
- Location compatibility
- Budget compatibility
- Lifestyle compatibility

### Chat
- Real-time messaging
- Match-based conversations
- Message timestamps
- Message status

### Rent Splitting
- Create rent groups
- Add group members
- Enter total rent
- Split rent equally or using custom amounts
- Track shared expenses
- Track individual contributions

### Admin Dashboard
- User management
- Identity verification management
- Reports and complaints
- Analytics
- Security monitoring
- Admin activity logs

## 5. Matching Algorithm

Calculate compatibility using actual user profile data.

Initial scoring weights:

- Budget compatibility: 20%
- Location compatibility: 15%
- Sleep schedule: 15%
- Cleanliness: 15%
- Social preferences: 10%
- Food preferences: 10%
- Work schedule: 5%
- Pets and smoking preferences: 5%
- Privacy preferences: 5%

Requirements:
- Calculate scores on the backend.
- Support configurable weights.
- Respect non-negotiable user preferences.
- Never display fake compatibility scores.

## 6. UI Design Guidelines

Create a premium, modern dark interface.

Color palette:

- Background: #080808
- Cards: #151515
- Neon Yellow: #D9FF43
- Pink: #FF4FA3
- Blue: #5A9CFF
- Mint: #65E6B5

Design requirements:
- Modern typography
- Rounded cards
- Smooth animations
- Consistent spacing
- Reusable components
- Responsive web design
- Mobile-first Flutter UI
- Loading, empty and error states

Maintain consistent design across mobile, website and admin applications.

## 7. Database Requirements

Use PostgreSQL with Prisma.

Design normalized database tables with:
- Primary keys
- Foreign keys
- Relationships
- Indexes
- Unique constraints
- Proper migrations

Refer to `docs/DATABASE_DESIGN.md` for the complete database requirements.

## 8. Security Requirements

All 20 security requirements in `docs/SECURITY_CHECKLIST.md` are mandatory.

Security must be implemented and tested, not just documented.

Never:
- Expose secrets in frontend code.
- Trust frontend calculations for sensitive operations.
- Allow unauthorized access to user information.
- Trust client-submitted payment status.
- Store passwords or tokens in logs.
- Allow unrestricted file uploads.

Implement authentication, authorization, validation, rate limiting, RBAC, audit logging and secure database access.

## 9. Development Workflow

Follow this development process:

1. Inspect the existing project.
2. Understand the requested feature.
3. Explain the implementation plan.
4. Identify affected files.
5. Identify database and API changes.
6. Identify security requirements.
7. Wait for approval before major implementation.
8. Implement only the requested feature.
9. Run relevant tests.
10. Report implementation results.
11. Update documentation.

## 10. Feature-by-Feature Development

Develop in this order:

1. Project Setup
2. Database Setup
3. Authentication
4. User Profiles
5. Lifestyle Preferences
6. Flatmate Discovery
7. Matching Algorithm
8. Likes and Matches
9. Real-time Chat
10. Rent Groups
11. Rent Splitting
12. Expense Management
13. Identity Verification
14. Notifications
15. Public Website
16. Admin Dashboard
17. Security Testing
18. Final Integration

## 11. Important Development Rules

- Work on one feature at a time.
- Keep UI and backend logic separate.
- Do not duplicate existing functionality.
- Do not modify unrelated files.
- Do not break completed features.
- Reuse existing components.
- Maintain consistent API contracts.
- Write maintainable and reusable code.
- Test every completed feature.
- Use Git commits after completed milestones.

## 12. AI Working Instructions

Act as a senior full-stack software architect and developer.

Before implementing any feature:
- Read this project documentation.
- Read AGENTS.md.
- Read the relevant documentation inside docs/.
- Inspect the existing source code.

Do not assume that a feature is already implemented.

Do not start multiple features simultaneously.

Only work on the task requested in the current conversation.

Wait for my approval before moving to the next feature.

The final goal is a production-ready, secure, scalable Flatmate Matching and Rent Splitting Platform.
