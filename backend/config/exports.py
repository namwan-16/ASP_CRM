import csv

from django.http import HttpResponse


def safe_cell(value):
    value = "" if value is None else str(value)
    return "'" + value if value.lstrip().startswith(("=", "+", "-", "@", "\t", "\r")) else value


def csv_response(filename, columns, rows):
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response.write("\ufeff")
    writer = csv.writer(response)
    writer.writerow([column["label"] for column in columns])
    for row in rows:
        writer.writerow([safe_cell(row.get(column["key"])) for column in columns])
    return response
