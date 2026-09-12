# NEXUS OS Engineering & Contribution Guide

## 1. Branch Strategy
- `main`: Production-ready releases.
- `develop`: Integration branch for active sprint features.
- `feature/<domain>-<short-description>`: E.g., `feature/auth-jwt-refresh`, `feature/kanban-dnd`, `feature/ai-task-decompose`.
- `hotfix/<issue-id>`: Critical patch branch merged into both main and develop.

## 2. Commit Standards
Follow Conventional Commits:
- `feat(scope): add task decomposition endpoint`
- `fix(auth): correct token expiration calculation`
- `perf(kanban): debounce status update batching`
- `test(ai): add unit tests for CSV statistics processor`

## 3. Code Quality Principles
- Zero unhandled exceptions: All error states must return structured JSON errors with appropriate HTTP status codes.
- No fake/mock data in production pathways.
- Strict input validation with Zod (frontend) and strict schema checks (backend).
- Always enforce role-based access control server-side.
