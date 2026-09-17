from django.urls import path
from django.contrib.auth import views as auth_views

from . import views


urlpatterns = [

    path(
        'login/',
        auth_views.LoginView.as_view(
            template_name='accounts/login.html'
        ),
        name='login'
    ),

    path(
        'logout/',
        auth_views.LogoutView.as_view(),
        name='logout'
    ),

    path(
        'signup/',
        views.signup_view,
        name='signup'
    ),

    path(
        'dashboard/',
        views.dashboard_view,
        name='dashboard'
    ),

    path(
        'dashboard/admin/',
        views.admin_dashboard,
        name='admin_dashboard'
    ),

    path(
        'dashboard/presenter/',
        views.presenter_dashboard,
        name='presenter_dashboard'
    ),

    path(
        'dashboard/assistant/',
        views.assistant_dashboard,
        name='assistant_dashboard'
    ),

]