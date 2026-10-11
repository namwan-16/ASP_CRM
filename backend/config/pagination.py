from rest_framework.pagination import PageNumberPagination


class CrmPagination(PageNumberPagination):
<<<<<<< HEAD
    page_size = 5
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
    page_size_query_param = "page_size"
    max_page_size = 500
