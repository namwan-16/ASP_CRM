from django.db import IntegrityError
from django.db.models.deletion import ProtectedError
from rest_framework.response import Response
from rest_framework.views import exception_handler


def crm_exception_handler(exc, context):
    if isinstance(exc, ProtectedError):
        return Response({"detail": "This record has class, attendance or note history. Deactivate it instead."}, status=409)
    if isinstance(exc, IntegrityError):
        return Response({"detail": "This change conflicts with an existing record. Refresh and try again."}, status=409)
    return exception_handler(exc, context)
