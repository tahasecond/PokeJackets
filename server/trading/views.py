from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .models import FriendRequest
from django.db.models import Q


# Create your views here.
class FriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        to_user_id = request.data.get("user_id")

        try:
            to_user = User.objects.get(id=to_user_id)
        except User.DoesNotExist:
            return Response(
                {"success": False, "error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.user == to_user:
            return Response(
                {"success": False, "error": "Cannot send request to yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if request already exists in any direction
        if FriendRequest.objects.filter(
            Q(from_user=request.user, to_user=to_user)
            | Q(from_user=to_user, to_user=request.user)
        ).exists():
            return Response(
                {"success": False, "error": "Friend request already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the request
        FriendRequest.objects.create(from_user=request.user, to_user=to_user)

        return Response(
            {"success": True, "message": "Friend request sent"},
            status=status.HTTP_201_CREATED,
        )


class FriendRequestResponseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        action = request.data.get("action")  # "accept" or "decline"

        try:
            friend_request = FriendRequest.objects.get(
                id=request_id, to_user=request.user, status="pending"
            )
        except FriendRequest.DoesNotExist:
            return Response(
                {"success": False, "error": "Request not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if action == "accept":
            friend_request.status = "accepted"
            friend_request.save()
            return Response({"success": True, "message": "Friend request accepted"})

        elif action == "decline":
            friend_request.status = "declined"
            friend_request.save()
            return Response({"success": True, "message": "Friend request declined"})

        return Response(
            {"success": False, "error": "Invalid action"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class FriendListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get accepted friends
        friends = FriendRequest.objects.filter(
            (Q(from_user=request.user) | Q(to_user=request.user)), status="accepted"
        ).select_related("from_user", "to_user")

        friend_list = []
        for friend_request in friends:
            # Determine which user is the friend (not the current user)
            if friend_request.from_user == request.user:
                friend = friend_request.to_user
            else:
                friend = friend_request.from_user

            friend_list.append(
                {"id": friend.id, "username": friend.username, "email": friend.email}
            )

        return Response({"success": True, "friends": friend_list})


class PendingFriendRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get incoming pending requests
        incoming = FriendRequest.objects.filter(
            to_user=request.user, status="pending"
        ).select_related("from_user")

        # Get outgoing pending requests
        outgoing = FriendRequest.objects.filter(
            from_user=request.user, status="pending"
        ).select_related("to_user")

        incoming_data = [
            {
                "id": req.id,
                "from_user": {
                    "id": req.from_user.id,
                    "username": req.from_user.username,
                    "email": req.from_user.email,
                },
                "created_at": req.created_at,
            }
            for req in incoming
        ]

        outgoing_data = [
            {
                "id": req.id,
                "to_user": {
                    "id": req.to_user.id,
                    "username": req.to_user.username,
                    "email": req.to_user.email,
                },
                "created_at": req.created_at,
            }
            for req in outgoing
        ]

        return Response(
            {
                "success": True,
                "incoming_requests": incoming_data,
                "outgoing_requests": outgoing_data,
            }
        )
