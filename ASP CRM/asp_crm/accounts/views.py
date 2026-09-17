from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required

from .forms import SignUpForm


def signup_view(request):

    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':

        form = SignUpForm(request.POST)

        if form.is_valid():

            user = form.save()

            login(request, user)

            return redirect('dashboard')

    else:

        form = SignUpForm()

    return render(
        request,
        'accounts/signup.html',
        {'form': form}
    )


@login_required
def dashboard_view(request):

    if request.user.is_superuser:
        return redirect('admin_dashboard')

    if request.user.role == 'ADMIN':
        return redirect('admin_dashboard')

    elif request.user.role == 'PRESENTER':
        return redirect('presenter_dashboard')

    elif request.user.role == 'ASSISTANT':
        return redirect('assistant_dashboard')

    return render(request, 'dashboard/dashboard.html')


@login_required
def admin_dashboard(request):

    return render(
        request,
        'dashboard/admin_dashboard.html'
    )


@login_required
def presenter_dashboard(request):

    return render(
        request,
        'dashboard/presenter_dashboard.html'
    )


@login_required
def assistant_dashboard(request):

    return render(
        request,
        'dashboard/assistant_dashboard.html'
    )