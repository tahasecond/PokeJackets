import statistics
from django.http import JsonResponse
from mysite.settings import API_KEY
import requests
from django.contrib.auth.decorators import login_required
from .models import UserCard
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from django.db import transaction
from marketplace.models import User_wallet
import json
from decimal import Decimal
from django.urls import reverse
from django.shortcuts import redirect
from django.core.cache import cache
import hashlib
from rest_framework.response import Response
from rest_framework import status

# Create your views here.


def pokemon_list(request):
    # Get page and page size from query parameters
    page = request.GET.get("page", "1")
    page_size = request.GET.get("pageSize", "20")
    query = request.GET.get("q", "")

    # Create a cache key based on the request parameters
    cache_key = f"pokemon_list_{page}_{page_size}_{query}"
    cache_key = hashlib.md5(cache_key.encode()).hexdigest()

    # Try to get data from cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse(cached_data, safe=False)

    url = "https://api.pokemontcg.io/v2/cards"
    headers = {"X-Api-Key": API_KEY}

    # Prepare query parameters for the TCG API
    params = {
        "page": page,
        "pageSize": page_size,
    }

    # Add search term if provided
    if query:
        params["q"] = f"name:*{query}*"

    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            # Cache the response for 1 hour (3600 seconds)
            data = response.json()
            cache.set(cache_key, data, 3600)
            return JsonResponse(data, safe=False)
        else:
            return JsonResponse(
                {"error": "Failed to fetch Pokémon data"}, status=response.status_code
            )
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": str(e)}, status=500)


# New function to get user's card collection
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_collection(request):
    """
    API endpoint to retrieve a user's card collection.
    """
    # Get the authenticated user
    user = request.user

    # Get the user's cards
    user_cards = UserCard.objects.filter(user=user)
    cards_data = []
    headers = {"X-Api-Key": API_KEY}

    for card in user_cards:
        try:
            pokemon_id = card.pokemon_id

            # Check if this is an AI-generated card
            if pokemon_id.startswith("ai-"):
                # For AI-generated cards, fetch from our local endpoint
                ai_response = requests.get(
                    f"http://localhost:8000/api/aigen/cards/{pokemon_id}/",
                    headers=headers,
                )
                if ai_response.status_code == 200:
                    card_data = ai_response.json()
                    cards_data.append(card_data["data"])
            else:
                # For regular Pokemon TCG API cards
                url = f"https://api.pokemontcg.io/v2/cards/{pokemon_id}"
                response = requests.get(url, headers=headers)
                if response.status_code == 200:
                    card_data = response.json()
                    cards_data.append(card_data["data"])
        except Exception as e:
            # Log error but continue with the next card
            print(f"Error fetching card {card.pokemon_id}: {str(e)}")
            continue

    return JsonResponse({"data": cards_data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def purchase_card(request):
    """
    Endpoint to purchase a card and add it to user's collection.

    Required POST data:
    - card_id: The unique ID of the Pokemon card (from Pokemon TCG API)
    - price: The price of the card in PokeDollars

    Process:
    1. Verify the user has sufficient funds
    2. Deduct the price from the user's wallet
    3. Add the card to the user's collection
    4. Return success/failure response
    """
    try:
        data = json.loads(request.body)
        card_id = data.get("card_id")
        price = Decimal(str(data.get("price", "0")))

        if not card_id:
            return JsonResponse(
                {"success": False, "message": "Card ID is required"}, status=400
            )

        user = request.user

        # Get or create user wallet
        wallet, created = User_wallet.objects.get_or_create(user=user)

        # Check if user has enough funds
        if wallet.balance < price:
            return JsonResponse(
                {"success": False, "message": "Insufficient funds"}, status=400
            )

        # Check if user already owns this card
        if UserCard.objects.filter(user=user, pokemon_id=card_id).exists():
            return JsonResponse(
                {"success": False, "message": "You already own this card"}, status=400
            )

        # Perform the transaction
        with transaction.atomic():
            # Deduct balance
            wallet.balance -= price
            wallet.save()

            # Add card to collection
            UserCard.objects.create(user=user, pokemon_id=card_id)

        # Get updated balance
        updated_balance = wallet.balance

        return JsonResponse(
            {
                "success": True,
                "message": "Card purchased successfully!",
                "balance": float(updated_balance),
            }
        )

    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)


# Add a new function to handle both regular and AI cards
def pokemon_detail(request, card_id):
    """
    Get details for a specific Pokemon card by ID
    """
    # Create a cache key for this specific card
    cache_key = f"pokemon_detail_{card_id}"
    cache_key = hashlib.md5(cache_key.encode()).hexdigest()

    # Try to get card data from cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse(cached_data, safe=False)

    # If not in cache, fetch from API
    url = f"https://api.pokemontcg.io/v2/cards/{card_id}"
    headers = {"X-Api-Key": API_KEY}

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            # Cache the response for 1 day (86400 seconds)
            cache.set(cache_key, data, 86400)
            return JsonResponse(data, safe=False)
        else:
            return JsonResponse(
                {"error": "Card not found"}, status=response.status_code
            )
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_to_collection(request):
    try:
        user_id = request.data.get("user_id")
        pokemon_id = request.data.get("pokemon_id")

        if not user_id or not pokemon_id:
            return Response({"error": "Missing data"}, status=400)

        user = User.objects.get(id=user_id)

        existing = UserCard.objects.filter(user=user, pokemon_id=pokemon_id).exists()
        if existing:
            return Response({"error": "Card already in collection"}, status=400)

        UserCard.objects.create(user=user, pokemon_id=pokemon_id)

        return Response(
            {"success": f"Card {pokemon_id} added to {user.username}'s collection"},
            status=201,
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_card_from_collection(request):
    user_id = request.data.get("user_id")
    pokemon_id = request.data.get("pokemon_id")

    try:
        if not user_id or not pokemon_id:
            return Response({"error": "Missing user_id or pokemon_id"}, status=400)

        user = User.objects.get(id=user_id)

        card_to_delete = UserCard.objects.filter(
            user=user, pokemon_id=pokemon_id
        ).first()
        if not card_to_delete:
            return Response({"error": "Card not found in collection"}, status=404)

        card_to_delete.delete()
        return Response(
            {"message": f"Card {pokemon_id} deleted from {user.username}'s collection"}
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)
