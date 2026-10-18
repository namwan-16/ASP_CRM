import json

from django.db.models import Q
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from accounts.permissions import assigned_sessions, visible_students
from config.exports import csv_response
from config.pagination import CrmPagination
from config.query import filter_id
from .models import Attendance, ClassSession, ProgressNote


def column(key, label, bar=False):
    return {"key": key, "label": label, "bar": bar}


def note_text(text):
    """Present the structured notes already used by the React page as readable text."""
    prefix = "ASP_PROGRESS_NOTE_V1:"
    if text.startswith(prefix):
        try:
            note = json.loads(text[len(prefix):])
            if isinstance(note, dict) and note.get("version") == 1:
                parts = [f"Answers checked: {note.get('answersChecked', '')}"]
                for label, key in (("Achievement", "achievement"), ("Feedback", "studentFeedback"), ("Comments", "comments")):
                    if note.get(key):
                        parts.append(f"{label}: {note[key]}")
                return "; ".join(parts)
        except (ValueError, TypeError):
            pass
    return text


def report_dates(params):
    dates = {key: serializers.DateField().run_validation(params[key]) for key in ("date_from", "date_to") if params.get(key)}
    if dates.get("date_from") and dates.get("date_to") and dates["date_from"] > dates["date_to"]:
        raise serializers.ValidationError({"date_to": "The end date must be on or after the start date."})
    return dates


def date_filter(qs, field, dates):
    for key, suffix in (("date_from", "gte"), ("date_to", "lte")):
        if key in dates:
            qs = qs.filter(**{f"{field}__{suffix}": dates[key]})
    return qs


def rate(present, total):
    return round(100 * present / total, 1) if total else None


@api_view(["GET"])
def summary_report(request):
    kind = serializers.ChoiceField(choices=["attendance", "late-arrivals", "enrolment", "progress-notes"]).run_validation(request.query_params.get("kind", "attendance"))
    dates = report_dates(request.query_params)
    scoped = assigned_sessions(request.user)
    scoped = filter_id(scoped, request.query_params, "course")
    scoped = filter_id(scoped, request.query_params, "presenter")
    sessions = date_filter(scoped, "date", dates).exclude(status=ClassSession.Status.CANCELLED)
    rows, stats = [], []
    if kind == "attendance":
        columns = [column("course", "Class"), column("sessions", "Sessions"), column("present", "Present / late"),
                   column("absent", "Absent"), column("excused", "Excused"), column("unmarked", "Unmarked"), column("rate", "Recorded attendance %", True)]
        groups = {}
        for session in sessions.select_related("course").prefetch_related("students", "attendance"):
            row = groups.setdefault(session.course_id, {"course": session.course.name, "sessions": 0, "present": 0,
                                                       "absent": 0, "excused": 0, "unmarked": 0, "marked": 0, "late": 0})
            marks = list(session.attendance.all())
            row["sessions"] += 1
            row["marked"] += len(marks)
            row["unmarked"] += max(0, len(session.students.all()) - len(marks))
            for mark in marks:
                if mark.status in (Attendance.Status.PRESENT, Attendance.Status.LATE):
                    row["present"] += 1
                else:
                    row[mark.status] += 1
                if mark.status == Attendance.Status.LATE:
                    row["late"] += 1
        rows = sorted(groups.values(), key=lambda row: row["course"])
        for row in rows:
            row["rate"] = rate(row["present"], row["marked"])
        present = sum(row["present"] for row in rows)
        marked = sum(row["marked"] for row in rows)
        percent = rate(present, marked)
        stats = [{"label": "Recorded attendance", "value": f"{percent}%" if percent is not None else "—"},
                 {"label": "Student check-ins", "value": present},
                 {"label": "Unmarked roster places", "value": sum(row["unmarked"] for row in rows)}]
    elif kind == "late-arrivals":
        columns = [column("student", "Student"), column("student_id", "Student ID"), column("course", "Class"),
                   column("date", "Date"), column("notes", "Notes")]
        marks = Attendance.objects.filter(session__in=sessions, status=Attendance.Status.LATE).select_related("student", "session__course")
        rows = [{"student": str(mark.student), "student_id": f"ASP-{mark.student_id}", "course": mark.session.course.name,
                 "date": str(mark.session.date), "notes": mark.notes} for mark in marks]
        stats = [{"label": "Late arrivals", "value": len(rows)},
                 {"label": "Students affected", "value": len({row["student_id"] for row in rows})}]
    elif kind == "enrolment":
        columns = [column("course", "Class"), column("date", "Date"), column("presenter", "Presenter"),
                   column("status", "Session status"), column("enrolled", "Enrolled"), column("capacity", "Capacity"), column("rate", "Filled %", True)]
        rows = [{"session_id": session.pk, "course": session.course.name, "date": str(session.date), "presenter": str(session.presenter),
                 "status": session.status, "enrolled": len(session.students.all()), "capacity": session.capacity,
                 "rate": rate(len(session.students.all()), session.capacity)}
                for session in sessions.select_related("course", "presenter").prefetch_related("students")]
        enrolled, capacity = sum(row["enrolled"] for row in rows), sum(row["capacity"] for row in rows)
        stats = [{"label": "Session places filled", "value": enrolled}, {"label": "Spots available", "value": capacity - enrolled},
                 {"label": "Capacity filled", "value": f"{rate(enrolled, capacity)}%" if capacity else "—"}]
    else:
        columns = [column("date", "Date"), column("student", "Student"), column("course", "Class"),
                   column("author", "Author"), column("text", "Progress note")]
        notes = ProgressNote.objects.filter(is_deleted=False, student__in=visible_students(request.user)).filter(Q(session__isnull=True) | Q(session__in=scoped))
        if request.query_params.get("course") or request.query_params.get("presenter"):
            notes = notes.filter(session__in=scoped)
        notes = date_filter(notes, "date", dates).select_related("student", "session__course", "author")
        author_ids = set()
        for note in notes:
            author_ids.add(note.author_id)
            rows.append({"date": str(note.date), "student": str(note.student), "student_id": f"ASP-{note.student_id}",
                         "course": note.session.course.name if note.session else "General student note",
                         "author": str(note.author) if note.author else "Former staff", "text": note_text(note.text)})
        stats = [{"label": "Progress notes", "value": len(rows)}, {"label": "Note authors", "value": len(author_ids)},
                 {"label": "Latest note", "value": rows[0]["date"] if rows else "—"}]
    if request.query_params.get("export") == "csv":
        return csv_response(f"{kind}-report.csv", columns, rows)
    paginator = CrmPagination()
    page = paginator.paginate_queryset(rows, request)
    response = paginator.get_paginated_response(page)
    response.data.update({"kind": kind, "columns": columns, "stats": stats,
        "definition": "Attendance % = present plus late / all recorded marks (including excused). Unmarked places are shown separately. Cancelled sessions are excluded from attendance/enrolment; archived history remains included."})
    return response


def class_list_report(request, session):
    from django.db.models import OuterRef, Subquery
    latest = ProgressNote.objects.filter(is_deleted=False, student_id=OuterRef("pk"), date__lte=session.date).filter(
        Q(session__isnull=True) | Q(session__in=assigned_sessions(request.user))).order_by("-date", "-created_at", "-id")
    students = session.students.order_by("last_name", "first_name").annotate(
        latest_text=Subquery(latest.values("text")[:1]), latest_date=Subquery(latest.values("date")[:1]))
    marks = {mark.student_id: mark.status for mark in session.attendance.all()}
    rows = [{"student_id": f"ASP-{student.pk}", "student": str(student), "year_level": student.year_level,
             "attendance": marks.get(student.pk, "unmarked"), "note_date": str(student.latest_date or ""),
             "latest_note": note_text(student.latest_text or "")} for student in students]
    columns = [column("student_id", "Student ID"), column("student", "Student"), column("year_level", "Year"),
               column("attendance", "Attendance"), column("note_date", "Last note date"), column("latest_note", "Latest progress note")]
    if request.query_params.get("export") == "csv":
        return csv_response(f"class-{session.pk}-list.csv", columns, rows)
    from .serializers import ClassSessionSerializer
    return Response({"session": ClassSessionSerializer(session).data, "columns": columns, "results": rows})
