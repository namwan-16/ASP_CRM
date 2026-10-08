# API Reference

Base URL: `http://127.0.0.1:8000/api`. All CRM endpoints require `Authorization: Bearer <access token>`. Login, public sign-up, token refresh and health check are the exceptions.

## Authentication and Staff

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register/` | Create an inactive assistant account requiring approval |
| POST | `/auth/login/` | Obtain access/refresh tokens |
| POST | `/auth/refresh/` | Rotate an unexpired refresh token |
| GET | `/auth/me/` | Current user including `can_manage` |
| POST | `/auth/logout/` | Blacklist the authenticated user's refresh token |
| GET, POST | `/auth/users/` | List staff / admin creates an account |
| GET, PATCH | `/auth/users/{id}/` | View / admin changes role, profile, password or active status |

Registration accepts `username`, `first_name`, `last_name`, `email`, `password`, `password_confirm`. Staff creation accepts the same fields except `password_confirm`, plus `role` and `is_active`. Roles are `admin`, `presenter`, `assistant`; superusers are managed through Django, not through an API privilege flag.

Staff cannot change their own role or deactivate themselves. A non-superuser admin cannot modify a superuser. Passwords are hashed and never returned. Logout revokes refresh tokens; an already-issued access token remains valid until its 15-minute expiry unless the account is deactivated.

## CRUD Resources

Collection paths support GET/list and POST/create. Detail paths support GET, PUT, PATCH and DELETE unless noted for staff above.

| Resource | Path | Important fields |
| --- | --- | --- |
| Students | `/students/` | `first_name`, `last_name`, `date_of_birth`, `school`, `year_level`, `subject`, `email`, `phone`, `medical_information`, `special_circumstances`, `permission_to_travel_alone`, `is_active` |
| Guardians | `/guardians/` | `first_name`, `last_name`, `phone`, `email`, optional writable `links` |
| Student/guardian links | `/student-guardians/` | `student`, `guardian`, `relationship`, `is_primary_contact`, `is_emergency_contact` |
| Courses | `/courses/` | `name`, `description`, `is_active` |
| Registrations | `/registrations/` | `student`, `course`, `is_active` |
| Class sessions | `/sessions/` | `course`, `date`, `start_time`, `end_time`, `room`, `capacity`, `presenter`, `assistant`, `students` |
| Attendance | `/attendance/` | `session`, `student`, `status`, `notes` |
| Progress notes | `/progress-notes/` | `student`, optional `session`, `text`, optional `date` |

Foreign keys use numeric database IDs, not display IDs such as `ASP-1`. Response-only fields include contact/student details, author/marker information and timestamps.

Student creates/updates also accept `guardian_id` and `guardian_relationship`. Setting a guardian makes it the primary and emergency contact and demotes any previous primary contact. `guardian_id: null` on update removes the primary flag but retains existing guardian links.

Guardian `links` is an optional array. When supplied it replaces this guardian's links atomically; omit it to leave links unchanged. An empty array unlinks all students. Example:

```json
{
  "first_name": "Sarah",
  "last_name": "Example",
  "phone": "0400000001",
  "links": [{"student": 1, "relationship": "Mother", "is_primary_contact": true, "is_emergency_contact": true}]
}
```

The API allows one primary guardian per student. Creating a session validates positive capacity, distinct active students, appropriate active staff roles, non-overlapping room/staff assignments and end time after start time. It also creates/reactivates course registrations for its roster.

Pagination returns `count`, `next`, `previous`, `results`. Use `?page=2&page_size=100`; maximum page size is 500. Supported collections expose `?search=...`. Students accept `?is_active=true`; links accept `?student=1&guardian=2`; registrations accept `?student=1&course=2`; sessions accept `?course=2`; attendance accepts `?session=1&student=2`; notes accept `?student=1`.

## Attendance and Emergency Lookup

`GET /sessions/{id}/roster/` returns the class session and all roster students with their existing status/notes. An unmarked student's status is empty, not automatically absent.

`POST /sessions/{id}/attendance/` saves or updates a batch atomically:

```json
{
  "records": [
    {"student": 1, "status": "present", "notes": ""},
    {"student": 2, "status": "late", "notes": "Bus delay"}
  ]
}
```

Statuses: `present`, `absent`, `late`, `excused`. At most 500 records per request. Duplicate students or students outside the session roster cause the whole batch to fail. The authenticated user becomes `marked_by`. Omitted students remain unchanged. Single-record POST rejects duplicates; use PATCH or this batch endpoint to update.

`GET /students/{id}/emergency-contacts/` returns the student and emergency-enabled guardian links, primary contact first.

## Import

`GET /students/import-template/`: download the Excel template (admin only).

`POST /students/import/`: multipart form data with `file` and optional `dry_run=true`. Accepts `.xlsx` or UTF-8 `.csv`, at most 10 MB and 5,000 rows. Only the active Excel worksheet is imported. Legacy `.xls`, formulas, duplicate headers, unknown columns and oversized expanded workbooks are rejected.

Required headers:

```text
first_name,last_name,date_of_birth,guardian_first_name,guardian_last_name,guardian_phone
```

Optional headers:

```text
student_id,school,year_level,subject,email,phone,permission_to_travel_alone,is_active,medical_information,special_circumstances,guardian_email,relationship,is_primary_contact,is_emergency_contact
```

Header names are case-insensitive; spaces and hyphens normalize to underscores. Use `YYYY-MM-DD`, `DD/MM/YYYY`, or a native Excel date. Boolean values accept Yes/No, True/False, 1/0. Numeric Excel phone cells are rejected because their leading zeroes may already be lost; use text cells instead. Blank optional student/guardian profile cells preserve existing values on update; use the regular PATCH API to explicitly clear a field.

Matching:

1. Guardians are matched by normalized phone. Australian `+61` and equivalent `61` formats normalize to leading `0`. Conflicting names, multiple existing guardians sharing a phone, or inconsistent guardian details inside the file are rejected for review.
2. A supplied `student_id` targets that existing student. Unknown IDs are errors.
3. Without an ID, match the linked guardian plus student first name, last name and birth date. Different siblings sharing a guardian phone remain separate students.
4. To change a student's name, birth date or guardian phone reliably, supply their existing `student_id`.

One row per student per file. A student can have further guardians through the link API. Imports create emergency contacts by default; they select a primary contact only if no other primary guardian exists. Explicitly conflicting primary flags are rejected.

Successful response:

```json
{"dry_run": true, "rows": 10, "created": 6, "updated": 4}
```

Failed files return HTTP 400 with `detail` and an `errors` array containing each row number and field errors; no rows or guardian changes persist. Preview counts are recalculated at commit time, since other admins can change the database between preview and import.

## Dashboard and Reports

- `GET /dashboard/`: counts scoped to the current user's visible students and sessions.
- `GET /reports/attendance/`: paginated attendance records, scoped to assigned sessions for staff.
- Report filters: `session`, `date_from`, `date_to`, `status`.
- `GET /reports/attendance/?export=csv`: CSV export; formula-leading cells are neutralized.
- The frontend also summarizes live sessions, attendance and progress notes and exports the selected summary to CSV. Session-enrolment figures count places across sessions, not unique students. Attendance rates use marked attendance records; late counts as attended. Progress-note reports are not a full audit log.

Errors: HTTP 401 for unauthenticated access, 403 for forbidden actions, 404 for records outside the user's assignment scope, 400 for validation, 409 for protected history/conflicting records, 429 for throttling.
