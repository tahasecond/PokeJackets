from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .models import FriendRequest

# Create your views here.


class SendFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token_str = request.data.get("friend_id")
        try:
            token = Token.objects.get(key=token_str)
            to_user = token.user
            from_user = request.user

            if to_user == from_user:
                return Response(
                    {"message": "You can't add yourself!"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if FriendRequest.objects.filter(
                from_user=from_user, to_user=to_user
            ).exists():
                return Response(
                    {"message": "Friend request already sent."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            FriendRequest.objects.create(from_user=from_user, to_user=to_user)
            return Response(
                {"message": "Friend request sent!"}, status=status.HTTP_201_CREATED
            )

        except Token.DoesNotExist:
            return Response(
                {"message": "Invalid friend ID"}, status=status.HTTP_404_NOT_FOUND
            )
