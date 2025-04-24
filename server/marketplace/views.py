from django.shortcuts import render
from django.http import JsonResponse
from .models import Listing, User_wallet
from pokemon.models import UserCard
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import json
from decimal import Decimal
from django.db import transaction


# Create your views here.

@api_view(['GET'])
def marketplace_listings(request):
    """
    Get all active marketplace listings
    """
    listings = Listing.objects.filter(is_active=True).order_by('-created_at')
    listings_data = []
    
    for listing in listings:
        listings_data.append({
            'id': listing.id,
            'pokemon_id': listing.pokemon_id,
            'pokemon_name': listing.pokemon_name,
            'price': float(listing.price),
            'seller': listing.owner.username,
            'created_at': listing.created_at.isoformat(),
            'notes': listing.notes
        })
    
    return JsonResponse({'listings': listings_data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_listings(request):
    """
    Get all listings created by the authenticated user
    """
    user = request.user
    listings = Listing.objects.filter(owner=user).order_by('-created_at')
    listings_data = []
    
    for listing in listings:
        listings_data.append({
            'id': listing.id,
            'pokemon_id': listing.pokemon_id,
            'pokemon_name': listing.pokemon_name,
            'price': float(listing.price),
            'is_active': listing.is_active,
            'created_at': listing.created_at.isoformat(),
            'notes': listing.notes
        })
    
    return JsonResponse({'listings': listings_data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_listing(request):
    """
    Create a new listing for a card the user owns
    """
    try:
        data = json.loads(request.body)
        pokemon_id = data.get('pokemon_id')
        pokemon_name = data.get('pokemon_name')
        price = Decimal(str(data.get('price', '0')))
        notes = data.get('notes', '')
        
        if not pokemon_id or not pokemon_name or price <= 0:
            return JsonResponse({
                'success': False,
                'message': 'Valid pokemon ID, name and price are required'
            }, status=400)
        
        user = request.user
        
        # Verify the user owns this card
        if not UserCard.objects.filter(user=user, pokemon_id=pokemon_id).exists():
            return JsonResponse({
                'success': False,
                'message': 'You do not own this card'
            }, status=400)
        
        # Check if the user already has an active listing for this card
        if Listing.objects.filter(owner=user, pokemon_id=pokemon_id, is_active=True).exists():
            return JsonResponse({
                'success': False,
                'message': 'You already have an active listing for this card'
            }, status=400)
        
        # Create the listing
        listing = Listing.objects.create(
            owner=user,
            pokemon_id=pokemon_id,
            pokemon_name=pokemon_name,
            price=price,
            notes=notes
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Listing created successfully',
            'listing_id': listing.id
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_listing(request):
    """
    Cancel/deactivate a listing
    """
    try:
        data = json.loads(request.body)
        listing_id = data.get('listing_id')
        
        if not listing_id:
            return JsonResponse({
                'success': False,
                'message': 'Listing ID is required'
            }, status=400)
        
        user = request.user
        
        try:
            listing = Listing.objects.get(id=listing_id, owner=user)
        except Listing.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Listing not found or you are not the owner'
            }, status=404)
        
        listing.is_active = False
        listing.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Listing cancelled successfully'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def buy_listing(request):
    """
    Buy a card from a listing
    """
    try:
        data = json.loads(request.body)
        listing_id = data.get('listing_id')
        
        if not listing_id:
            return JsonResponse({
                'success': False,
                'message': 'Listing ID is required'
            }, status=400)
        
        buyer = request.user
        
        try:
            listing = Listing.objects.get(id=listing_id, is_active=True)
        except Listing.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Listing not found or no longer active'
            }, status=404)
        
        # Prevent buying your own listing
        if listing.owner == buyer:
            return JsonResponse({
                'success': False,
                'message': 'You cannot buy your own listing'
            }, status=400)
        
        # Check if buyer already owns this card
        if UserCard.objects.filter(user=buyer, pokemon_id=listing.pokemon_id).exists():
            return JsonResponse({
                'success': False,
                'message': 'You already own this card'
            }, status=400)
        
        # Get buyer's wallet
        buyer_wallet, _ = User_wallet.objects.get_or_create(user=buyer)
        
        # Check if buyer has enough funds
        if buyer_wallet.balance < listing.price:
            return JsonResponse({
                'success': False,
                'message': 'Insufficient funds'
            }, status=400)
        
        # Get seller's wallet
        seller_wallet, _ = User_wallet.objects.get_or_create(user=listing.owner)
        
        # Perform the transaction
        with transaction.atomic():
            # Transfer the card ownership
            UserCard.objects.filter(user=listing.owner, pokemon_id=listing.pokemon_id).delete()
            UserCard.objects.create(user=buyer, pokemon_id=listing.pokemon_id)
            
            # Transfer the funds
            buyer_wallet.balance -= listing.price
            buyer_wallet.save()
            
            seller_wallet.balance += listing.price
            seller_wallet.save()
            
            # Deactivate the listing
            listing.is_active = False
            listing.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Purchase successful! The card has been added to your collection.',
            'balance': float(buyer_wallet.balance)
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)
