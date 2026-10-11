from django.urls import path
from rest_framework.routers import DefaultRouter
<<<<<<< HEAD
from .reports import summary_report
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
from .views import AttendanceViewSet, ClassSessionViewSet, CourseViewSet, ProgressNoteViewSet, RegistrationViewSet, attendance_report, dashboard

router = DefaultRouter()
router.register("courses", CourseViewSet, basename="course")
router.register("sessions", ClassSessionViewSet, basename="session")
router.register("registrations", RegistrationViewSet, basename="registration")
router.register("attendance", AttendanceViewSet, basename="attendance")
router.register("progress-notes", ProgressNoteViewSet, basename="progress-note")
<<<<<<< HEAD
urlpatterns = [path("dashboard/", dashboard), path("reports/attendance/", attendance_report), path("reports/summary/", summary_report)] + router.urls
=======
urlpatterns = [path("dashboard/", dashboard), path("reports/attendance/", attendance_report)] + router.urls
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
