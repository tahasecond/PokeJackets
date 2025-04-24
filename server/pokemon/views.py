from django.http import JsonResponse
from mysite.settings import API_KEY
import requests
from django.contrib.auth.decorators import login_required
from .models import UserCard
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token

# Create your views here.


def pokemon_list(request):
    url = "https://api.pokemontcg.io/v2/cards"
    headers = {"X-Api-Key": API_KEY}  # Access API key from settings

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            pokemon_data = response.json()
            return JsonResponse(pokemon_data, safe=False)
        else:
            return JsonResponse(
                {"error": "Failed to fetch Pokémon data"}, status=response.status_code
            )

    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": str(e)}, status=500)

# New function to get user's card collection
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_collection(request):
    # Get the authenticated user
    user = request.user
    
    # Get the user's cards
    user_cards = UserCard.objects.filter(user=user)
    card_ids = [card.pokemon_id for card in user_cards]
    
    # Get details for each card from Pokemon TCG API
    cards_data = []
    headers = {"X-Api-Key": API_KEY}
    
    for card_id in card_ids:
        try:
            url = f"https://api.pokemontcg.io/v2/cards/{card_id}"
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                card_data = response.json()
                cards_data.append(card_data['data'])
        except requests.exceptions.RequestException as e:
            # Continue even if one card fails
            continue
    
    return JsonResponse({"data": cards_data})
