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

@api_view(['POST'])
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
        card_id = data.get('card_id')
        price = Decimal(str(data.get('price', '0')))
        
        if not card_id:
            return JsonResponse({'success': False, 'message': 'Card ID is required'}, status=400)
            
        user = request.user
        
        # Get or create user wallet
        wallet, created = User_wallet.objects.get_or_create(user=user)
        
        # Check if user has enough funds
        if wallet.balance < price:
            return JsonResponse({
                'success': False, 
                'message': 'Insufficient funds'
            }, status=400)
            
        # Check if user already owns this card
        if UserCard.objects.filter(user=user, pokemon_id=card_id).exists():
            return JsonResponse({
                'success': False, 
                'message': 'You already own this card'
            }, status=400)
        
        # Perform the transaction
        with transaction.atomic():
            # Deduct balance
            wallet.balance -= price
            wallet.save()
            
            # Add card to collection
            UserCard.objects.create(
                user=user,
                pokemon_id=card_id
            )
        
        # Get updated balance
        updated_balance = wallet.balance
        
        return JsonResponse({
            'success': True,
            'message': 'Card purchased successfully!',
            'balance': float(updated_balance)
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)
