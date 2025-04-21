from django.contrib.auth.hashers import check_password
from django.http import JsonResponse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.contrib.auth.models import User

class RegistrationView(APIView):
    def post(self, request):
        try:
            username = request.data.get("username")
            email = request.data.get("email")
            password = request.data.get("password")

            if User.objects.filter(email=email).exists():
                return JsonResponse({
                        "success": False, 
                        "message": "Email already exists"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if User.objects.filter(username=username).exists():
                return JsonResponse({
                        "success": False, 
                        "message": "Username already exists"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = User.objects.create_user(
                username=username, email=email, password=password
            )
            token = Token.objects.create(user=user)

            return JsonResponse({
                    "success": True,
                    "message": "You are now registered!",
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return JsonResponse({
                    "success": False,
                    "message": "An unexpected error occurred. Please try again later.",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class LoginView(APIView):
    def post(self, request):
        try:
            username = request.data.get("username")
            password = request.data.get("password")

            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return JsonResponse({
                        "success": False, 
                        "message": "User not found"
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            if check_password(password, user.password):
                token = Token.objects.get(user=user)
                return JsonResponse({
                        "success": True,
                        "message": "You are now logged in!",
                        "token": token.key
                    },
                    status=status.HTTP_200_OK,
                )
            else: 
                return JsonResponse({
                        "success": False, 
                        "message": "Invalid Login Credentials"
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        except Exception as e:
            return JsonResponse({
                    "success": False,
                    "message": "An unexpected error occurred. Please try again later.",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

# class ResetPassword(APIView):
# will set up later w/ a password reset email