# Deletion and deactivation checklist

Implemented in the API and frontend. Backend tests cover Administrator and Presenter permissions and both allowed and blocked actions; frontend tests verify action controls, confirmations, notifications and paging. PostgreSQL/browser verification remains pending as described in VERIFICATION.md.

## Students

- [x] Deactivate is the normal removal action; inactive filter and Reactivate support returning students.
- [x] Attendance, enrolment, class roster and progress-note history remain.
- [x] Administrator-only permanent deletion for unused records; backend blocks enrolments, attendance, notes (including recoverable notes) and class references.
- [x] Clear permanent-deletion confirmation; dismissible success/error feedback.

## Guardians

- [x] Fetch/display database phone and student links; edit the existing guardian record.
- [x] Remove one student link and edit its relationship/primary/emergency flags; keep other links and the guardian record.
- [x] Administrator-only deletion after all links are removed; backend checks and database protection block linked deletion.
- [x] Confirm removal of contact links and permanent deletion; dismissible feedback.

## Progress notes

- [x] Edit corrections rather than recreating notes; original author remains.
- [x] Administrators manage all notes; presenters view/edit visible assigned notes and delete/restore only their own. Existing assistant permissions remain limited to their own notes for edits/deletions.
- [x] Recoverable deletion, restore control and read-only backend audit history with actor/time/text snapshots.
- [x] Confirmation and dismissible feedback. Deleted notes continue protecting student/session/staff history.

## Staff and permissions

- [x] Administrator-controlled Deactivate/Reactivate keeps class/note history and blocks inactive access.
- [x] Delete only unused accounts without login/token use or class/note/audit references.
- [x] Administrator-only role changes.
- [x] Block self-demotion/self-deactivation/self-deletion and removing the last active administrator.
- [x] Backend/API and Django-admin checks; PostgreSQL admin-count changes use a shared transaction advisory lock.

## Subjects

- [x] Archive excludes new choices; existing class/student records keep their references.
- [x] Reactivate archived subjects.
- [x] Presenters browse subjects used by their own classes without management controls.
- [x] Administrator-only unused-subject deletion; backend/database protect sessions, enrolments and student subject references.
- [x] Dynamic database subject choices; stable IDs keep renamed subjects current.

## Classes, enrolments and shared checks

- [x] Archive and Unarchive/resume sessions while retaining roster/history; resume checks booking conflicts.
- [x] Pause/Resume the same course enrolment; preserve enrolment history.
- [x] Five records per page, bottom-right Next, filter/table resets and clamping after deletion. Attendance edits persist across pages.
- [x] Backend permissions/reference checks are authoritative; UI flags do not authorize deletion.
- [x] Clear destructive confirmations and dismissible success/error messages.
- [x] Administrator and Presenter allowed/blocked tests.
