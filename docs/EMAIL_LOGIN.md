# Email and password integration

Login, public registration, staff creation, profile editing, account display and Django administration now use email. The current user model has `USERNAME_FIELD = "email"` and no username field. Migration `accounts/0003_email_only_user.py` removes the old database column. No generated or hidden username is saved during registration.

Emails are required, trimmed, stored in lowercase and unique without regard to case. Passwords are hashed; leading or trailing password spaces remain part of the password. New public accounts remain inactive assistants until an administrator approves them. Roles, account IDs, password hashes and references from existing classes, attendance and notes remain in place.

## Upgrade your existing PostgreSQL project

1. Stop the running Django server and make a PostgreSQL backup (for example, use pgAdmin's **Backup** action). This migration intentionally removes username values. To revert the upgrade, restore that backup with your previous source; reversing migrations cannot recover removed usernames.
2. Extract this ZIP and replace your project source. Keep your existing `backend/.env`, `frontend/.env`, PostgreSQL database and local virtual environment. Keep the supplied migration files, including `0001_initial`; historical migrations still mention usernames because they describe the old schema.
3. In your backend terminal, activate the virtual environment and run:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py check_login_emails
```

The email check is read-only and works before the schema upgrade. Every account, including inactive accounts, needs a valid, distinct email. If it lists issues, correct the existing accounts as described below before continuing. Do not create replacement accounts or reset your database.

4. Once the check passes, apply the migrations and start Django:

```powershell
python manage.py migrate
python manage.py check
python manage.py runserver
```

`accounts/0002_unique_login_email.py` normalizes existing emails and prevents duplicate addresses. It is also included for compatibility with the previous email-login update. `0003_email_only_user.py` checks all accounts before removing usernames, makes email required/unique and installs the email-based account manager. Missing, invalid or duplicate email addresses stop the upgrade with an error; accounts are not merged or deleted.

5. In a second terminal, from the project root:

```powershell
cd frontend
npm ci
npm run dev
```

Open the Vite URL and sign in with an existing account's email and its current password. Use a hard refresh if your browser still shows Username. Approve new registrations through **Staff & Roles > Reactivate / approve**.

On macOS/Linux, activate with `source venv/bin/activate`; the Python and npm commands are the same.

## Correct existing account emails before migration

Use the IDs printed by `check_login_emails`. Choose the actual email belonging to each person; do not use invented placeholder addresses for real accounts.

```powershell
python manage.py shell
```

In the shell:

```python
from accounts.models import User
from django.core.validators import validate_email
from django.db.models.functions import Lower, Trim

list(User.objects.values("id", "first_name", "last_name", "email", "is_active"))

# Replace 41 and the email below with the affected existing account's details.
account = User.objects.get(pk=41)
email = "actual.person@example.com".strip().lower()
validate_email(email)
matches = User.objects.annotate(login_email=Lower(Trim("email"))).filter(login_email=email).exclude(pk=account.pk)
assert not matches.exists(), "Another account already uses this email."
account.email = email
account.save(update_fields=["email"])
exit()
```

Repeat for each affected account, then run `python manage.py check_login_emails` and `python manage.py migrate`. Updating an existing ID retains its password and linked history. For duplicate accounts, assign each its correct distinct email before this upgrade; do not merge histories automatically.

## Start with a new, empty PostgreSQL database

Follow the PostgreSQL setup in README, then from `backend`:

```powershell
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

`createsuperuser` now asks for email and password. No username prompt is needed. The superuser can access both the CRM and Django administration with email.

## API requests

`POST /api/auth/login/`:

```json
{"email": "presenter@example.com", "password": "your-password"}
```

`POST /api/auth/register/`:

```json
{
  "email": "presenter@example.com",
  "first_name": "Presenter",
  "last_name": "Name",
  "password": "your-strong-password",
  "password_confirm": "your-strong-password"
}
```

Registration and staff creation reject an old `username` payload. User responses contain IDs, email, names and permissions; they do not contain a username. Refresh/logout continue using the existing JWT endpoints. Login by username alone is rejected.

Changing email in **My profile** changes the address used for the next login. The existing account ID and password stay the same. Duplicate or empty emails are rejected in profile and staff updates. Self-demotion, last-administrator protection, deactivation and history-protected deletion rules remain enforced.

## Verify in your environment

```powershell
python manage.py test --settings=config.test_settings
python manage.py makemigrations --check --dry-run
```

The isolated SQLite fallback verifies model/API behavior and forward migrations from the old schema, including preservation of account IDs, password hashes, class assignments, attendance, notes and groups. Normal application settings still use PostgreSQL. PostgreSQL migration/concurrency and live browser behavior have not been tested here; run `python manage.py test` against your configured local PostgreSQL test database before deployment. See README for test database permissions.

From `frontend`, run `npm test` and `npm run build`.
