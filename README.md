# ASP CRM starter

A full-stack starter using:

- Django + Django REST Framework for the API
- Simple JWT for authentication
- React + Vite for the frontend
- SQLite for local development
- CORS configuration for communication between React and Django

## Project structure

```text
asp-crm-starter/
├── backend/
│   ├── accounts/
│   ├── config/
│   ├── .env.example
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    ├── .env.example
    └── package.json
```

## Requirements

- Python 3.11 or newer
- Node.js 20.19 or newer (Node.js 22 LTS is recommended)

## 1. Start the Django backend (Windows)

Open Command Prompt or PowerShell in the `asp-crm-starter` folder:

```powershell
cd backend
py -m venv venv
venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API will run at `http://127.0.0.1:8000/`.

If PowerShell blocks activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

## 2. Start the React frontend

Open a second terminal in the `asp-crm-starter` folder:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173/`.

## 3. Test the application

1. Select **Create account** in the React app.
2. Register a test account.
3. Sign in with the username and password.
4. The dashboard will display the account returned by Django.
5. Visit `http://127.0.0.1:8000/admin/` and sign in with the superuser account.
6. Open **Users** to change a user's role to `admin`, `presenter`, or `assistant`.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health/` | Check that the API is running |
| POST | `/api/auth/register/` | Register an assistant account |
| POST | `/api/auth/login/` | Obtain access and refresh tokens |
| POST | `/api/auth/refresh/` | Refresh an expired access token |
| GET | `/api/auth/me/` | Return the authenticated user |
| POST | `/api/auth/logout/` | Blacklist a refresh token |
| GET | `/admin/` | Django administration |

## Example login request

```json
POST /api/auth/login/
{
  "username": "namgyal",
  "password": "your-password"
}
```

## Important production changes

Before deployment:

- Generate a new secret key and set `DEBUG=False`.
- Set exact `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`.
- Replace SQLite with PostgreSQL.
- Serve the site over HTTPS.
- Store secrets in the hosting platform, not in Git.
- Review role permissions for every CRM endpoint.

## Suggested next apps for the ASP CRM

After this starter is working, add separate Django apps for:

- students and guardians
- presenters and class schedules
- attendance and late notifications
- progress notes and uploaded documents
- payments, refund requests, and approvals
- dashboard reports and CSV imports

