from django.db import connection


def lock_schedule():
    """Serialize API/admin booking writes, including restores, on PostgreSQL."""
    if connection.vendor == "postgresql":
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(%s)", [6202027])
