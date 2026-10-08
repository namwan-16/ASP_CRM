# Verification

Verified on 8 October 2026 using Python 3.12.14, Django 5.2.18, Django REST Framework 3.18.3, PostgreSQL 16.15 and Node.js 24.19.0.

## Automated Checks

- PostgreSQL migration application: passed.
- Django system checks: no issues.
- Migration drift check: no changes detected.
- Backend regression suite: 36 tests passed on PostgreSQL.
- The same 36 tests passed with the explicit SQLite-only test settings.
- Frontend production build: passed.

Backend tests cover authentication/approval, role changes, scoped student/guardian visibility, emergency contacts, CRUD, date/phone validation, atomic guardian links, attendance validation and upserts, progress-note ownership, protected history, report filtering and formula-safe CSV export, import preview/rollback, repeated imports, siblings, Excel dates/booleans, numeric Excel phone rejection and import throttling.

## Browser Checks

Headless Chromium with Playwright, against the running React app and PostgreSQL-backed Django API:

- Guardian creation.
- Student creation, guardian linking, editing and persistence after page reload.
- Course creation and class creation with staff assignments and student roster.
- CSV import preview and commit through the frontend.
- Assistant access limited to assigned students; admin controls hidden for assistants.
- Saving attendance and reviewing the resulting late-arrival report.
- Progress-note creation and persistence after reload.
- Emergency contact lookup.
- Desktop view at 1440px and mobile page-overflow checks at 390px.
- Mobile checks for the admin import and staff pages.
- No browser JavaScript runtime errors during these flows.

## Remaining Scope

This is a tested development implementation, not a deployed production service. Real client datasets, SharePoint integration, email delivery, document uploads, PDF generation, deployment, distributed-load tests and production backup/restore were not tested or implemented.

The build reports a non-blocking JavaScript bundle-size warning, largely from the existing UI dependencies. The existing global header search remains a placeholder; the actual student, guardian, class, note and report searches/filters are connected to live records.

No test accounts, test database contents, real credentials, local `.env` files, dependency folders or build folders are bundled in the source archive. Setup steps are in the root README.
