from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, ClassSessionViewSet, CourseViewSet, ProgressNoteViewSet, RegistrationViewSet, attendance_report, dashboard

router = DefaultRouter()
router.register("courses", CourseViewSet, basename="course")
router.register("sessions", ClassSessionViewSet, basename="session")
router.register("registrations", RegistrationViewSet, basename="registration")
router.register("attendance", AttendanceViewSet, basename="attendance")
router.register("progress-notes", ProgressNoteViewSet, basename="progress-note")
urlpatterns = [path("dashboard/", dashboard), path("reports/attendance/", attendance_report)] + router.urls
