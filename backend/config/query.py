from rest_framework.exceptions import ValidationError


def filter_id(qs, params, name, field=None):
    value = params.get(name)
    if value is not None:
        try:
            value = int(value)
            if value < 1:
                raise ValueError
        except (TypeError, ValueError):
            raise ValidationError({name: "Enter a positive integer ID."})
        qs = qs.filter(**{field or name: value})
    return qs
