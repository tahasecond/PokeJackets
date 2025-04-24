from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path("register/", views.RegistrationView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path(
        "reset_password/",
        auth_views.PasswordResetView.as_view(template_name="reset_password.html"),
        name="password_reset",
    ),
    path(
        "reset_password_sent/",
        auth_views.PasswordResetDoneView.as_view(
            template_name="reset_password_sent.html"
        ),
        name="password_reset_done",
    ),
    path(
        "reset/<uidb64>/<token>/",
        auth_views.PasswordResetConfirmView.as_view(
            template_name="reset_password_confirm.html"
        ),
        name="password_reset_confirm",
    ),
    path(
        "reset_password_complete/",
        auth_views.PasswordResetCompleteView.as_view(
            template_name="reset_password_complete.html"
        ),
        name="password_reset_complete",
    ),
    path("user/profile/", views.user_profile, name="user_profile"),
    path("user/balance/", views.get_user_balance, name="get_user_balance"),
    path("user/id/", views.get_user_id, name="user_id"),
]
