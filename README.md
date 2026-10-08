# ASP CRM

Your existing React/Vite frontend, connected to a Django REST API using PostgreSQL.

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

Course enrolment and a session roster are separate. Creating/updating a session enrols its selected students in that course; creating a course enrolment alone does not assign the student to every session.

## Role Permissions

| Action | Admin / Superuser | Presenter / Assistant |
| --- | --- | --- |
| Student/guardian records | Manage all | View assigned students and their contacts |
| Courses/enrolments/sessions | Manage all | View assigned classes |
| Attendance | Manage all | Record/update assigned session rosters |
| Progress notes | Manage all | View assigned students; edit/delete own notes |
| Emergency lookup/reports | All records | Assigned student/class records |
| Import and staff/role changes | Yes | No |

New public sign-ups are inactive assistants until approved. They cannot choose an elevated role or sign in before approval. Deactivating staff blocks API access and token refresh. Staff assignment scope includes both past and future assigned sessions.

Student/session deletion is blocked if attendance or progress-note history exists. Student deletion is also blocked when course registrations exist. Deactivate records instead. Removing students from a session with recorded attendance/notes is blocked.

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

