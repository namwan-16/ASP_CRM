from django.shortcuts import render

# Create your views here.
from io import BytesIO
from zipfile import BadZipFile

from django.http import HttpResponse
from openpyxl import Workbook
from openpyxl.utils.exceptions import InvalidFileException
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .importer import import_students
from .permissions import IsAdminRole

from rest_framework import generics, status
from .models import Student
from .serializers import StudentSerializer

MAX_FILE_SIZE = 5 * 1024 * 1024


class StudentImportView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")

        if not uploaded_file:
            return Response(
                {
                    "detail": (
                        "Select an Excel file to upload."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not uploaded_file.name.lower().endswith(".xlsx"):
            return Response(
                {
                    "detail": (
                        "Only .xlsx Excel files are supported."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if uploaded_file.size > MAX_FILE_SIZE:
            return Response(
                {
                    "detail": (
                        "The Excel file must be 5 MB or smaller."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = import_students(uploaded_file)

        except (
            ValueError,
            InvalidFileException,
            BadZipFile,
        ) as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            result,
            status=status.HTTP_200_OK,
        )


class StudentImportTemplateView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        workbook = Workbook()
        worksheet = workbook.active

        worksheet.title = "Student Registrations"

        worksheet.append(
            [
                "Phone Number",
                "First Name",
                "Last Name",
                "Email",
                "Date of Birth",
                "School",
                "Year Level",
                "Guardian Name",
                "Guardian Phone",
                "Address",
                "Notes",
                "Active",
            ]
        )

        worksheet.append(
            [
                "0412345678",
                "Example",
                "Student",
                "student@example.com",
                "2012-05-18",
                "Example School",
                "Year 8",
                "Example Guardian",
                "0498765432",
                "Perth WA",
                "Delete this example row",
                "Yes",
            ]
        )

        worksheet.freeze_panes = "A2"

        worksheet.column_dimensions["A"].width = 18

        for column in "BCDEFGHIJKL":
            worksheet.column_dimensions[column].width = 20

        output = BytesIO()

        workbook.save(output)
        output.seek(0)

        response = HttpResponse(
            output.getvalue(),
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
        )

        response["Content-Disposition"] = (
            'attachment; '
            'filename="student-import-template.xlsx"'
        )


        return response

## import function 
class StudentListView(generics.ListAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAdminRole]

class Meta:
    ordering = ("last_name", "first_name")