<<<<<<< HEAD
# Verification — 10 October 2026 email-only integration

## Completed checks

- Backend: **99 tests passed** using `config.test_settings` (isolated SQLite test databases).
- Frontend: **29 tests passed** with Vitest/jsdom and mocked API responses.
- Django system checks: no issues.
- Migration drift check: no changes detected.
- Production frontend build: passed, with the existing non-blocking large-bundle warning.
- Upgrade smoke check: migrated a database at `students/0004` and `classes/0002` to the latest schema. Existing subjects mapped to stable references, unmatched historical subjects became subject records, guardian links and original note contents/authors remained, and linked guardian deletion was protected.

The inherited lifecycle smoke-check result above records the earlier update. This integration adds six executable migration checks that create isolated legacy/fresh databases and run the complete current migration graph. They verify that the username column is removed and existing IDs, password hashes, roles, presenter assignments, session rosters, attendance markers, note authors/content and group memberships remain. Missing emails (including inactive accounts), invalid emails and case-insensitive duplicates block the migration before username removal; correcting the same existing account IDs permits a retry. The audit command is verified to work before migration and leave records unchanged.

Email tests verify account-manager validation/normalization, database uniqueness and required email, email-only `createsuperuser`, Django admin creation/edit forms, case-insensitive login, JWT refresh identity, inactive-account rejection, generic credential errors, the existing login rate limit, signup approval/role protection, password strength/confirmation and exact password whitespace. Staff creation and profile editing require distinct valid emails. Changing a profile email preserves the account ID/password and moves login to the new address. Old username registration/staff payloads are rejected, and user responses contain no username. Frontend tests exercise the real AuthProvider with mocked HTTP responses for email login, signup, staff creation, name/email searches, API errors and profile updates.

The tests cover allowed and blocked Administrator/Presenter actions; unused student/guardian/subject/staff deletion; protection by enrolments, attendance, notes and class references; student/staff reactivation; guardian fetch/update/unlink while preserving other students; emergency flags and primary-contact constraints; subject archive/rename/dynamic IDs and assignment scope; pause/resume of the same enrolment; maintaining paused enrolments during ordinary session edits; session archive/resume, conflict rejection and history retention; presenter editing of another visible author's note, own-note deletion/restore and unassigned-note denial; recoverable notes, prior-text audit events and exclusion from reports; account-use checks, deactivation of token access, self-access/last-admin guards and Django admin role restrictions.

Frontend workflow tests verify five-row pages and filter resets for students, guardians, subjects, staff and notes; guardian phone/link mapping and per-student link preservation; dynamic subject choices and subject-ID submission; deactivate/reactivate controls; read-only presenter subject management; confirmation cancellation, backend deletion error handling and dismissible notifications; attendance edits retained across pages and saved together; report requests for five rows with page reset; presenter edit/delete/restore controls; and resuming an existing enrolment. Existing profile, class-conflict, cancellation, archived-attendance, emergency-contact and report-export tests also pass.

## Limits

**PostgreSQL migration application/concurrency and real-browser layout/printing/networking were not verified in this environment.** Normal application settings still use PostgreSQL. SQLite is only the explicit test fallback; it does not exercise PostgreSQL advisory locks. Run the checks below against your configured PostgreSQL test database before deployment.

Component tests use jsdom and mocked API responses; they do not establish that the real browser layout or networking has passed. Earlier verification in the uploaded source described PostgreSQL/browser testing of an older version and is not evidence for this update.

No real client data, production backups/load, deployment, emails, SharePoint or document uploads were tested. Browser printing/Save as PDF is available; a server PDF engine is not included. No test database, credentials, dependency folders or build output is included in the ZIP.

## Reproduce

From `backend`, with your PostgreSQL `.env` and virtual environment:

```bash
python manage.py check_login_emails
python manage.py migrate
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test accounts students classes
```

For the SQLite test fallback used here:

```bash
python manage.py test accounts students classes --settings=config.test_settings
```

From `frontend`:

```bash
npm ci
npm test
npm run build
```

See README for PostgreSQL test-database permissions and upgrade/startup commands.
=======
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
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
