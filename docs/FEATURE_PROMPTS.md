# Feature-by-Feature Development Prompts

## Prompt 1: Project Setup

Read AGENTS.md and all project documentation.

Inspect the workspace and prepare the project structure
for Flutter, Next.js, NestJS and PostgreSQL.

Do not write application code yet.
Show the implementation plan and wait for approval.

## Prompt 2: Backend Logic

Read all relevant documentation.

Implement only the backend logic for the feature
I specify.

Before coding:
1. Inspect existing code.
2. Explain the implementation plan.
3. Identify database changes.
4. Identify required APIs.
5. Identify security requirements.

Wait for approval before implementation.

After coding, run tests and report results.

## Prompt 3: Mobile UI

Read AGENTS.md and UI_DESIGN.md.

Implement only the Flutter UI for the requested feature.

Inspect existing components and backend API contracts.

Create reusable components and connect the UI
to existing backend APIs.

Do not modify backend logic without approval.

Run relevant tests after implementation.

## Prompt 4: Website UI

Read all project documentation.

Implement only the requested Next.js website feature.

Use TypeScript, reusable components and responsive design.

Connect to existing backend APIs.

Do not duplicate backend business logic.

## Prompt 5: Admin Dashboard

Implement only the requested admin feature
using Next.js and TypeScript.

Apply role-based access control.
Use existing backend APIs.
Follow the project design system.

## Prompt 6: Testing

Test only the feature currently being implemented.

Check:
- Successful scenarios
- Validation failures
- Unauthorized access
- Invalid inputs
- Error handling
- Database consistency
- UI behavior
- API integration

Report passed and failed test cases.

## Prompt 7: Code Review

Review the completed feature.

Check:
- Code quality
- Architecture
- Security
- Performance
- Duplicate code
- Error handling
- Test coverage

Do not modify files until I approve the proposed changes.

## Prompt 8: Feature Completion

Summarize:
- Implemented functionality
- Files created or modified
- Database changes
- APIs created
- Tests executed
- Security checks completed
- Known issues
- Remaining work

Wait for my approval before starting another feature.