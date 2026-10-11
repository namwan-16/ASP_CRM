from rest_framework.exceptions import APIException


class HistoryConflict(APIException):
    status_code = 409
    default_code = "protected_history"


def student_has_history(student):
    return (student.registrations.exists() or student.attendance.exists()
            or student.progress_notes.exists() or student.class_sessions.exists())


def course_is_used(course):
    return course.sessions.exists() or course.registrations.exists() or course.subject_students.exists()


def staff_is_used(user):
    from classes.models import Attendance, ClassSession, NoteEvent, ProgressNote, SessionStatusEvent
    from django.db.models import Q
    from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
    return (user.last_login is not None or OutstandingToken.objects.filter(user=user).exists()
            or ClassSession.objects.filter(Q(presenter=user) | Q(assistant=user) | Q(status_changed_by=user)).exists()
            or ProgressNote.objects.filter(Q(author=user) | Q(deleted_by=user)).exists()
            or Attendance.objects.filter(marked_by=user).exists()
            or SessionStatusEvent.objects.filter(changed_by=user).exists()
            or NoteEvent.objects.filter(actor=user).exists())
