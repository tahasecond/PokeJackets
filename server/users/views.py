from django.contrib.auth.hashers import check_password
from django.http import JsonResponse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from marketplace.models import User_wallet


class RegistrationView(APIView):
    def post(self, request):
        try:
            username = request.data.get("username")
            email = request.data.get("email")
            password = request.data.get("password")

            if User.objects.filter(email=email).exists():
                return JsonResponse(
                    {"success": False, "message": "Email already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if User.objects.filter(username=username).exists():
                return JsonResponse(
                    {"success": False, "message": "Username already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = User.objects.create_user(
                username=username, email=email, password=password
            )

            return JsonResponse(
                {
                    "success": True,
                    "message": "You are now registered!",
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return JsonResponse(
                {
                    "success": False,
                    "message": "An unexpected error occurred. Please try again later.",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LoginView(APIView):
    def post(self, request):
        try:
            username = request.data.get("username")
            password = request.data.get("password")

            user = authenticate(request, username=username, password=password)
            if user is not None:
                token, _ = Token.objects.get_or_create(user=user)
                return JsonResponse(
                    {
                        "success": True,
                        "message": "Login successful",
                        "token": token.key,
                    },
                    status=status.HTTP_200_OK,
                )

            return JsonResponse(
                {"success": False, "message": "Invalid username or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        except Exception as e:
            return JsonResponse(
                {
                    "success": False,
                    "message": "An unexpected error occurred. Please try again later.",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# class ResetPassword(APIView):
# will set up later w/ a password reset email


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Endpoint to get the current user's profile information.
    """
    user = request.user

    return JsonResponse({"id": user.id, "username": user.username, "email": user.email})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_balance(request):
    """
    Endpoint to get the current user's balance.
    """
    user = request.user
    wallet, created = User_wallet.objects.get_or_create(
        user=user, defaults={"balance": 2500}
    )

    return JsonResponse({"balance": float(wallet.balance)})
