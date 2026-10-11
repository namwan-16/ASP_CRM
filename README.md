# ASP CRM


<<<<<<< HEAD
## Implemented

- Student creation, search, viewing, editing, deactivation and deletion when there is no protected history.
- Guardian management, multiple student links, primary/emergency contact flags and emergency lookup.
- Courses, enrolments and class sessions with presenter/assistant assignments and session rosters.
- Attendance: present, absent, late or excused; atomic bulk saves and updates per session.
- Progress notes with author tracking; presenters can edit visible notes and delete/restore their own; administrators manage all notes. Deletions are recoverable and audited.
- JWT login, token refresh/logout, account approval and backend-enforced role permissions.
- Excel `.xlsx` and UTF-8 CSV import, downloadable template, dry-run preview and row-level errors.
- Live dashboard and attendance, late-arrival, session-enrolment and progress-note reports with CSV export.

Payment/refund, SharePoint integration, emails and document uploads are not included. Class lists can be printed or saved as PDF using your browser; a server PDF engine is not included.

## Requirements

Python 3.11+, Node.js 20.19+ and PostgreSQL 14+.
=======

## Implemented

- Student creation, search, viewing, editing, deactivation and deletion when there is no protected history.
- Guardian management, multiple student links, primary/emergency contact flags and emergency lookup.
- Courses, enrolments and class sessions with presenter/assistant assignments and session rosters.
- Attendance: present, absent, late or excused; atomic bulk saves and updates per session.
- Progress notes with author tracking; staff can edit their own notes, admins can manage all notes.
- JWT login, token refresh/logout, account approval and backend-enforced role permissions.
- Excel `.xlsx` and UTF-8 CSV import, downloadable template, dry-run preview and row-level errors.
- Live dashboard and attendance, late-arrival, session-enrolment and progress-note reports with CSV export.

Payment/refund, SharePoint integration, emails, document uploads and PDF reports are not included in this version.

## Requirements

Python 3.11+, Node.js 20.19+ and PostgreSQL 14+ (tested on PostgreSQL 16).
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
Docker Desktop is optional: it can run just the database while Python and Node run normally.

## 1. Configure PostgreSQL

In the project root, copy `backend/.env.example` to `backend/.env`. Keep an existing `.env` if you already have one, and add the new PostgreSQL variables instead of overwriting your credentials.

Set `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST` and `POSTGRES_PORT` to your database credentials. Set a new `DJANGO_SECRET_KEY` as well.

Option A: use the included database-only Docker Compose configuration:

```powershell
copy backend\.env.example backend\.env
# Edit backend/.env and replace the example password and secret key first.
docker compose --env-file backend/.env up -d db
```

The database listens at `127.0.0.1:5432`. If that port is occupied, use your existing PostgreSQL server, or change both the Compose host port and `POSTGRES_PORT` in `.env`.

Option B: in pgAdmin's Query Tool, connected to the `postgres` database as a PostgreSQL administrator, run these statements individually:

```sql
CREATE USER asp_crm WITH PASSWORD 'replace-with-your-own-password';
CREATE DATABASE asp_crm OWNER asp_crm;
```

Use the same password in `backend/.env`. `CREATE DATABASE` must not run inside a transaction. Application startup does not automatically create your database.

## 2. Start the Backend

Windows PowerShell, from the project root:

```powershell
cd backend
py -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

If activation is blocked, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` before activating.

Linux/macOS:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API: [http://127.0.0.1:8000/api/health/](http://127.0.0.1:8000/api/health/).
Django administration: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/).

## 3. Start the Frontend

Open a second terminal in the project root:

```powershell
cd frontend
npm ci
copy .env.example .env
npm run dev
```

On Linux/macOS use `cp .env.example .env` instead of `copy`. `VITE_API_URL` defaults to `http://127.0.0.1:8000/api`.

Open [http://localhost:5173](http://localhost:5173). Sign in with the superuser you created. Superusers have full CRM access regardless of the role label; there are no bundled default passwords.

## 4. Use the CRM

1. In **Staff & Roles**, create presenter/assistant accounts or approve inactive self-registered accounts.
2. Add guardians and students, or use **Registrations > Download template > Preview > Import**.
3. Add courses in **Registrations**.
4. Create a session in **Classes**, assign a presenter/assistant and select its students.
5. Sign in as assigned staff to mark attendance and add progress notes.
6. Use **Emergency Lookup** to search a student and call their emergency contacts.

<<<<<<< HEAD
Course enrolment and a session roster are separate. Creating a session or assigning new roster students enrols those students in that course; ordinary session edits preserve paused enrolments; creating a course enrolment alone does not assign the student to every session.
=======
Course enrolment and a session roster are separate. Creating/updating a session enrols its selected students in that course; creating a course enrolment alone does not assign the student to every session.
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b

## Role Permissions

| Action | Admin / Superuser | Presenter / Assistant |
| --- | --- | --- |
| Student/guardian records | Manage all | View assigned students and their contacts |
| Courses/enrolments/sessions | Manage all | View assigned classes |
| Attendance | Manage all | Record/update assigned session rosters |
<<<<<<< HEAD
| Progress notes | Manage all, including restore | Presenters edit visible notes; delete/restore own. Assistants edit/delete/restore own visible notes |
=======
| Progress notes | Manage all | View assigned students; edit/delete own notes |
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
| Emergency lookup/reports | All records | Assigned student/class records |
| Import and staff/role changes | Yes | No |

New public sign-ups are inactive assistants until approved. They cannot choose an elevated role or sign in before approval. Deactivating staff blocks API access and token refresh. Staff assignment scope includes both past and future assigned sessions.

<<<<<<< HEAD
All session deletion is blocked: use Cancel or Archive in Classes > View. Cancelled and archived sessions retain their roster, attendance, notes and status audit history, release their schedule booking, and become read-only. Restore rechecks conflicts. A session with attendance/notes cannot change its original date, time, room or subject, or remove students with history. Student deletion is blocked if attendance or progress-note history exists. Student deletion is also blocked when course registrations exist. Deactivate records instead. Removing students from a session with recorded attendance/notes is blocked.
=======
Student/session deletion is blocked if attendance or progress-note history exists. Student deletion is also blocked when course registrations exist. Deactivate records instead. Removing students from a session with recorded attendance/notes is blocked.
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b

## Excel / CSV Import

See [docs/API.md](docs/API.md) for headers, matching rules, requests and examples. Phone numbers must be stored as text in Excel so leading zeroes are retained. The generated template includes an example row: replace it with your actual data before importing.

The entire file is validated transactionally. One invalid row rolls back all changes, including guardian updates. A preview returns counts but saves nothing; previews may consume PostgreSQL sequence values, which is normal and does not create records.

## Existing SQLite Data

The application now uses PostgreSQL, not your old `db.sqlite3`. Existing Django migration files are retained, but switching database settings does not copy old database records automatically. Back up your old database before replacing project files. Export your old data using the original backend/settings, then import students with the template or plan a separate database migration. Do not delete your old database until its records are verified in PostgreSQL.

If an existing database has multiple primary guardians for one student, the new constraint migration stops with a clear error. Resolve the duplicate primary flags first; it does not silently choose a guardian for you.

## Tests

From `backend`, with `.env` configured:

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

PostgreSQL tests create a separate `test_asp_crm` database. The development test user needs database-creation permission; grant it only to your local development role with `ALTER ROLE asp_crm CREATEDB;`, or use a separate test database user. Do not grant `CREATEDB` to the production application role.

For a fast unit-test fallback without PostgreSQL:

```bash
python manage.py test --settings=config.test_settings
```

This fallback applies only to tests. Normal application settings always use PostgreSQL.

<<<<<<< HEAD
From `frontend`, run `npm test` for component workflow tests and `npm run build` for the production build.

## Before Deployment
=======
From `frontend`, run `npm run build` to verify the frontend production build.

## Before Deployment

- Set a strong secret, `DJANGO_DEBUG=False` and exact allowed hosts/CORS origins.
- Use HTTPS and a production WSGI/ASGI server, not Django's development server.
- Keep secrets, database files, dependency folders and real student data out of Git.
- Configure database backups, restore testing and an approved retention policy.
- Use a shared cache for throttling if deploying multiple workers; the default cache is process-local.
- Restrict Django administration to trusted superusers. Its direct model forms do not use API serializer validation.
- Review the permission matrix with your client/supervisor before using real student data.

Reference documentation: [Django PostgreSQL](https://docs.djangoproject.com/en/5.2/ref/databases/#postgresql-notes), [DRF permissions](https://www.django-rest-framework.org/api-guide/permissions/), [openpyxl](https://openpyxl.readthedocs.io/en/stable/tutorial.html).
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b

- Set a strong secret, `DJANGO_DEBUG=False` and exact allowed hosts/CORS origins.
- Use HTTPS and a production WSGI/ASGI server, not Django's development server.
- Keep secrets, database files, dependency folders and real student data out of Git.
- Configure database backups, restore testing and an approved retention policy.
- Use a shared cache for throttling if deploying multiple workers; the default cache is process-local.
- Restrict Django administration to trusted superusers. Its class-session forms use the same schedule validation as the API. Attendance, progress notes and status events are view-only there; edit attendance/notes through the CRM.
- Review the permission matrix with your client/supervisor before using real student data.

Reference documentation: [Django PostgreSQL](https://docs.djangoproject.com/en/5.2/ref/databases/#postgresql-notes), [DRF permissions](https://www.django-rest-framework.org/api-guide/permissions/), [openpyxl](https://openpyxl.readthedocs.io/en/stable/tutorial.html).


## Update from the previous project (9 October 2026)

Keep your existing `backend/.env` and `frontend/.env`. Back up your database, then replace the source files with this updated project. Do not copy `node_modules`, virtual environments, or a test database from another computer.

In your backend terminal, with the existing virtual environment activated:

```powershell
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

In the frontend terminal:

```powershell
cd frontend
npm ci
npm run dev
```

The new `classes/0002` migration adds session status and audit fields. Existing sessions default to `scheduled`; their assignments, roster and history remain in place. Re-sign in after upgrading because password-aware JWT validation is now enabled.

If Vite opens port 5174, include both `http://localhost:5174` and `http://127.0.0.1:5174` in the existing backend `.env` CORS/CSRF origins, then restart Django. The example/default settings allow both 5173 and 5174.

### New workflows

1. **Subjects**: create an active subject. **Staff & Roles**: create/approve active presenters and assistants.
2. **Classes > Create class**: select subject, date, room, times, presenter, optional assistant, capacity and student roster. Both frontend and backend reject overlapping bookings for rooms, staff (across presenter/assistant roles) and students. Adjacent sessions are allowed.
3. **Classes > View**: take attendance, print/export the presenter class list, or cancel/archive with an optional reason. Restore is available for closed sessions; it may fail if the slot is booked again. Status history records the administrator, time and reason of each transition.
4. **Attendance**: save present/absent/late/excused marks for the assigned roster. Closed sessions show saved marks read-only. Unmarked students stay unmarked; saving an empty value does not delete a recorded mark.
5. **Progress notes**: optionally link a new note to a scheduled session on the selected student's roster. Existing general notes remain supported. Session-linked notes cannot be moved to a different student/session; closed-session notes are read-only.
6. **Emergency Lookup**: search by name or exact `ASP-<id>`. Results are paginated and scoped to assigned students for presenters/assistants. Selecting a student fetches emergency-enabled guardians, with the primary contact first, phone links and recorded medical information. No contact details are loaded before selecting a student.
7. **Reports**: choose attendance, late arrivals, enrolment or progress notes and filter by date/subject. CSV exports include all filtered rows, not only the visible page. Printable class lists include each student's latest prior progress note, and can be saved as PDF in the print dialog.
8. **My profile**: save first name, last name and email. Email is also your sign-in address; roles are managed by administrators. Change password with the current password and confirmation; old access/refresh tokens are revoked and the user signs in again.

Report definitions: present includes late; attendance percentage divides present/late by all recorded marks, including excused. Unmarked roster places are reported separately and never counted as absent. Cancelled sessions are excluded from attendance/enrolment; archived records stay in these historical reports. Progress reports include current notes, including notes on closed sessions. Recoverably deleted notes remain in audit history and are excluded from report totals and printed latest-note summaries. Enrolment counts roster places per session, not unique students. Date/subject filters exclude general notes when a subject is selected.

PostgreSQL schedule writes use a shared transaction lock so concurrent API/admin saves cannot bypass the overlap check. SQLite is only the unit-test fallback; its concurrency behavior is not suitable as a replacement for this PostgreSQL deployment.


## Guardian, lifecycle and dynamic-subject update — 10 October 2026

Keep your existing PostgreSQL database and both `.env` files. The upgrade commands above still apply: install backend requirements, run `python manage.py migrate`, then run `npm ci` in `frontend` and restart both servers.

The new `classes/0003` migration adds recoverable note deletion and note audit events, and protects staff references. `students/0005` adds a stable subject reference and protects linked guardians. `students/0006` maps existing student subject names to Subjects; unmatched historical names become subject records so old choices are retained. These migrations keep student, guardian, enrolment, session, attendance and note records in place. Only the source project is supplied; your PostgreSQL data stays in your database.

- **Guardians:** database phone numbers and student links now display correctly. Edit the existing guardian to change details, relationships, primary/emergency flags or remove one student's contact link. Other students' links remain. Permanent deletion is disabled and rejected by the backend while any link exists. The form contains the fields that are actually saved by this backend.
- **Students:** the table starts with active students. Use **View > Deactivate** to stop current work. Choose the **Inactive** filter to find returning students, then **View > Reactivate**. Enrolment, class, attendance and note history remains. Permanent deletion is available only for unused records and requires confirmation.
- **Classes:** **View > Archive session** pauses a session; find it with the Archived status filter and use **Unarchive / resume session** when appropriate. The same roster and history remain. Resuming requires active staff/subject and a conflict-free booking. Existing scheduled classes retain an archived subject, while new classes cannot choose it.
- **Registrations:** the new **Course enrolments** table supports **Pause** and **Resume** on the same enrolment. Reactivate the student and subject first if necessary. Enrolments are retained instead of deleted. Pausing enrolment preserves existing session rosters; cancel/archive a scheduled session separately when its booking must stop.
- **Subjects:** choices in student, class and enrolment forms load from `/courses/`. Student records use `subject_id`, so a subject rename updates its displayed name. Archived subjects are excluded from new choices and kept on existing records. Presenters can browse subjects used by their assigned classes and cannot manage them. Import subject names must match an active subject in Subjects; the template uses an active database subject.
- **Progress notes:** presenters can correct notes they can access, but can delete/restore only their own. Administrators can manage all notes. **Show recoverable deleted notes** exposes the restore action. Content and prior edited versions are kept in backend audit events. Closed-session notes remain read-only until the session is resumed.
- **Staff:** Deactivate/Reactivate preserves class/note history. Permanent deletion is limited to unused accounts; logged-in accounts and referenced accounts are protected. Role changes require an administrator; self-demotion/self-deactivation and removal of the last active administrator are blocked, including in Django administration.
- **Pagination:** student, guardian, subject, staff, attendance, enrolment, report and progress-note lists show five records per page. Search/filter or selected-table changes reset to page one; deletion clamps the page to remaining records. **Next** is at the bottom right. Attendance keeps edits on other pages when saving. Reports and emergency search request five rows per page from the server; exports still include all filtered rows.
- **Notifications:** action success/error messages can be dismissed; permanent-deletion confirmations explain what is retained and what cannot be undone.

See `docs/VERIFICATION.md` for the tests completed for this update and the PostgreSQL/browser checks still needed in your environment.
