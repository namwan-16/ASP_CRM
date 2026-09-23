from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Guardian, Student, StudentGuardian
from .serializers import (
    GuardianSerializer,
    StudentGuardianSerializer,
    StudentSerializer,
)


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all().order_by("last_name", "first_name")
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]


class GuardianViewSet(viewsets.ModelViewSet):
    queryset = Guardian.objects.all().order_by("last_name", "first_name")
    serializer_class = GuardianSerializer
    permission_classes = [IsAuthenticated]


class StudentGuardianViewSet(viewsets.ModelViewSet):
    queryset = StudentGuardian.objects.select_related(
        "student",
        "guardian",
    ).all()
    serializer_class = StudentGuardianSerializer
    permission_classes = [IsAuthenticated]