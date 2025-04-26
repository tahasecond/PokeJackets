import logging
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import FriendRequest
from django.db.models import Q
from pokemon.models import UserCard
from .models import Trade
from rest_framework.decorators import api_view, permission_classes
from django.utils.timezone import now


# Create your views here.
class FriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        to_user_id = request.data.get("user_id")

        if not to_user_id:
            return Response(
                {"success": False, "error": "User ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            to_user = User.objects.get(id=to_user_id)
        except User.DoesNotExist:
            return Response(
                {"success": False, "error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except ValueError:
            return Response(
                {"success": False, "error": "Invalid user ID"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user == to_user:
            return Response(
                {"success": False, "error": "Cannot send request to yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if request already exists
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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_trade(request):
    try:
        recipient_id = request.data.get("recipient_id")
        card_id = request.data.get("card_id")

        if not recipient_id or not card_id:
            return Response(
                {"error": "Recipient ID and Card ID are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        recipient = User.objects.get(id=recipient_id)

        # Verify sender owns the card
        if not UserCard.objects.filter(user=request.user, pokemon_id=card_id).exists():
            return Response(
                {"error": "You don't own this card"}, status=status.HTTP_400_BAD_REQUEST
            )

        trade = Trade.objects.create(
            sender=request.user,
            recipient=recipient,
            sender_card=card_id,
            status="pending",
        )

        return Response(
            {
                "success": True,
                "message": "Trade request sent",
                "trade_id": trade.id,
                "recipient_username": recipient.username,
            },
            status=status.HTTP_201_CREATED,
        )

    except User.DoesNotExist:
        return Response(
            {"error": "Recipient not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pending_trades(request):
    try:
        received = Trade.objects.filter(
            recipient=request.user, status="pending"
        ).select_related("sender", "recipient")

        sent = Trade.objects.filter(
            sender=request.user, status="pending"
        ).select_related("sender", "recipient")

        return Response(
            {
                "received": [
                    {
                        "id": t.id,
                        "sender": t.sender.username,
                        "sender_id": t.sender.id,
                        "recipient": t.recipient.username,
                        "recipient_id": t.recipient.id,
                        "card_id": t.sender_card,
                        "created_at": t.created_at,
                    }
                    for t in received
                ],
                "sent": [
                    {
                        "id": t.id,
                        "sender": t.sender.username,
                        "sender_id": t.sender.id,
                        "recipient": t.recipient.username,
                        "recipient_id": t.recipient.id,
                        "card_id": t.sender_card,
                        "created_at": t.created_at,
                    }
                    for t in sent
                ],
            }
        )
    except Exception as e:
        return Response({"error": str(e)}, status=500)


logger = logging.getLogger(__name__)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def respond_to_trade(request, trade_id):
    logger.info(f"Received {request.method} request for trade ID: {trade_id}")
    try:
        trade = get_object_or_404(Trade, id=trade_id)

        # GET request - view trade details
        if request.method == "GET":
            return Response(
                {
                    "id": trade.id,
                    "sender": trade.sender.username,
                    "recipient": trade.recipient.username,
                    "sender_card": trade.sender_card,
                    "status": trade.status,
                    "created_at": trade.created_at,
                }
            )

        # POST request - respond to trade
        elif request.method == "POST":
            # Verify request user is the recipient
            if request.user != trade.recipient:
                return Response(
                    {"error": "Only the recipient can respond to this trade"},
                    status=403,
                )

            action = request.data.get("action")
            card_id = request.data.get("card_id")

            if action == "accept":
                if not card_id:
                    return Response(
                        {"error": "Please select a card to trade"}, status=400
                    )

                # Verify card ownership
                if not UserCard.objects.filter(
                    user=request.user, pokemon_id=card_id
                ).exists():
                    return Response({"error": "You do not own this card"}, status=400)

                # Update trade status
                trade.recipient_card = card_id
                trade.status = "completed"
                trade.save()

                return Response(
                    {"status": "completed", "message": "Trade completed successfully"}
                )

            elif action == "decline":
                trade.status = "declined"
                trade.save()
                return Response({"status": "declined", "message": "Trade declined"})

            return Response({"error": "Invalid action"}, status=400)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def swap_cards(request):
    try:
        sender_card_id = request.data.get("sender_card_id")
        receiver_card_id = request.data.get("receiver_card_id")
        receiver_id = request.data.get("receiver_id")

        if not sender_card_id or not receiver_card_id or not receiver_id:
            return Response(
                {"error": "Sender card, receiver card, and receiver ID are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the sender owns the sender card
        sender_card = UserCard.objects.filter(
            user=request.user, id=sender_card_id
        ).first()
        if not sender_card:
            return Response(
                {"error": "Sender does not own the sender card."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the receiver exists
        receiver = User.objects.filter(id=receiver_id).first()
        if not receiver:
            return Response(
                {"error": "Receiver not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # Add the receiver's card to the sender's collection
        UserCard.objects.create(user=request.user, pokemon_id=receiver_card_id)

        # Remove the sender's card from the receiver's collection
        UserCard.objects.filter(user=receiver, pokemon_id=sender_card_id).delete()

        # Add the sender's card to the receiver's collection
        UserCard.objects.create(user=receiver, pokemon_id=sender_card_id)

        # Remove the receiver's card from the sender's collection
        sender_card.delete()

        return Response(
            {"message": "Cards swapped successfully!"}, status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_trade(request):
    trade_id = request.data.get("trade_id")
    recipient_card = request.data.get("recipient_card")

    try:
        trade = Trade.objects.get(id=trade_id)

        UserCard.objects.filter(
            user=trade.sender, pokemon_id=trade.sender_card
        ).first().delete()

        UserCard.objects.filter(
            user=trade.recipient, pokemon_id=recipient_card
        ).first().delete()

        trade.recipient_card = recipient_card
        trade.status = "completed"
        trade.completed_at = now()
        trade.save()

        return Response({"message": "Trade completed successfully."})

    except Trade.DoesNotExist:
        return Response({"error": "Trade not found."}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_trade(request):
    trade_id = request.data.get("trade_id")
    try:
        trade = Trade.objects.get(id=trade_id)

        # Delete the trade record
        trade.delete()

        return Response({"message": "Trade deleted successfully."})
    except Trade.DoesNotExist:
        return Response({"error": "Trade not found."}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)