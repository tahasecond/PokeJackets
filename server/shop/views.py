from django.shortcuts import render
from django.http import JsonResponse
from .models import ShopItem, UserDailyShop
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
import datetime
import requests
from mysite.settings import API_KEY
from pokemon.models import UserCard
from marketplace.models import User_wallet
from django.db import transaction
from decimal import Decimal

# Create your views here.

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_shop_items(request):
    """Get all current shop items for the authenticated user"""
    user = request.user
    
    # Check if shop needs refresh or it's empty
    user_shop = UserDailyShop.objects.filter(user=user)
    if not user_shop.exists() or user_shop.first().is_expired():
        UserDailyShop.refresh_user_shop(user)
        user_shop = UserDailyShop.objects.filter(user=user)
    
    # Format the shop items for the frontend
    items_data = []
    for item in user_shop:
        items_data.append({
            'id': item.id,
            'pokemon_id': item.pokemon_id,
            'pokemon_name': item.pokemon_name,
            'price': float(item.price),
            'rarity': item.rarity,
            'expires_at': item.expires_at.isoformat()
        })
    
    # Calculate time until next refresh
    if user_shop.exists():
        expires_at = user_shop.first().expires_at
        now = timezone.now()
        time_left = max(0, int((expires_at - now).total_seconds()))
    else:
        time_left = 0
    
    return JsonResponse({
        'shop_items': items_data,
        'next_refresh_in_seconds': time_left
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_admin_shop_item(request):
    """Admin endpoint to add a new item to the shop pool"""
    if not request.user.is_staff:
        return JsonResponse({'error': 'Admin access required'}, status=403)
    
    try:
        data = request.data
        pokemon_id = data.get('pokemon_id')
        pokemon_name = data.get('pokemon_name')
        price = Decimal(str(data.get('price', '0')))
        rarity = data.get('rarity', 'Common')
        
        if not pokemon_id or not pokemon_name or price <= 0:
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        ShopItem.objects.create(
            pokemon_id=pokemon_id,
            pokemon_name=pokemon_name,
            price=price,
            rarity=rarity
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Shop item added successfully'
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def purchase_from_shop(request):
    """Purchase a card from the user's daily shop"""
    try:
        shop_item_id = request.data.get('shop_item_id')
        
        if not shop_item_id:
            return JsonResponse({'error': 'Missing shop_item_id'}, status=400)
        
        # Get the shop item
        try:
            shop_item = UserDailyShop.objects.get(id=shop_item_id, user=request.user)
        except UserDailyShop.DoesNotExist:
            return JsonResponse({'error': 'Shop item not found'}, status=404)
        
        # Check if shop item is expired
        if shop_item.is_expired():
            return JsonResponse({'error': 'Shop has refreshed. Please try again.'}, status=400)
        
        # Get user wallet
        user = request.user
        wallet, created = User_wallet.objects.get_or_create(
            user=user, 
            defaults={'balance': Decimal('2500.00')}
        )
        
        # Check if user has enough balance
        if wallet.balance < shop_item.price:
            return JsonResponse({
                'error': f'Insufficient funds. This card costs {shop_item.price} PD.'
            }, status=400)
        
        # Check if user already owns this card
        if UserCard.objects.filter(user=user, pokemon_id=shop_item.pokemon_id).exists():
            return JsonResponse({
                'error': 'You already own this card'
            }, status=400)
        
        # Deduct balance
        wallet.balance -= shop_item.price
        wallet.save()
        
        # Add card to user's collection
        UserCard.objects.create(
            user=user,
            pokemon_id=shop_item.pokemon_id
        )
        
        # Remove the item from the user's shop
        shop_item.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Successfully purchased {shop_item.pokemon_name}',
            'new_balance': float(wallet.balance)
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_shop(request):
    """Manually refresh the user's shop (costs 500 PD)"""
    try:
        user = request.user
        wallet, created = User_wallet.objects.get_or_create(
            user=user, 
            defaults={'balance': Decimal('2500.00')}
        )
        
        # Define refresh cost
        REFRESH_COST = Decimal('500.00')
        
        # Check if user has enough balance
        if wallet.balance < REFRESH_COST:
            return JsonResponse({
                'error': f'Insufficient funds. Refreshing the shop costs {REFRESH_COST} PD.'
            }, status=400)
        
        # Deduct balance
        wallet.balance -= REFRESH_COST
        wallet.save()
        
        # Refresh the shop
        success = UserDailyShop.refresh_user_shop(user)
        
        if not success:
            return JsonResponse({
                'error': 'Failed to refresh shop. No items available.'
            }, status=500)
        
        # Get the new shop items
        user_shop = UserDailyShop.objects.filter(user=user)
        items_data = []
        
        for item in user_shop:
            items_data.append({
                'id': item.id,
                'pokemon_id': item.pokemon_id,
                'pokemon_name': item.pokemon_name,
                'price': float(item.price),
                'rarity': item.rarity,
                'expires_at': item.expires_at.isoformat()
            })
        
        # Calculate time until next refresh
        if user_shop.exists():
            expires_at = user_shop.first().expires_at
            now = timezone.now()
            time_left = max(0, int((expires_at - now).total_seconds()))
        else:
            time_left = 0
        
        return JsonResponse({
            'success': True,
            'message': 'Shop refreshed successfully!',
            'shop_items': items_data,
            'next_refresh_in_seconds': time_left,
            'new_balance': float(wallet.balance)
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
