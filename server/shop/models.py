from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import datetime
import random
import requests
from decimal import Decimal
from mysite.settings import API_KEY

class ShopItem(models.Model):
    """Admin-configurable items that can appear in daily shops"""
    pokemon_id = models.CharField(max_length=50)
    pokemon_name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    rarity = models.CharField(max_length=50)
    enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.pokemon_name} (${self.price})"

class UserDailyShop(models.Model):
    """User-specific daily shop items"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_shop_items')
    pokemon_id = models.CharField(max_length=50)
    pokemon_name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    rarity = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    def __str__(self):
        return f"{self.user.username}'s shop item: {self.pokemon_name} (${self.price})"
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    @classmethod
    def refresh_user_shop(cls, user):
        """Create a new shop for the user with random items"""
        # Delete existing items for this user
        cls.objects.filter(user=user).delete()
        
        # Set expiration time - 24 hours from now
        expires_at = timezone.now() + datetime.timedelta(days=1)
        
        # Get all enabled admin-added shop items
        admin_items = list(ShopItem.objects.filter(enabled=True))
        
        # We want a total of 5 items in the shop
        total_items_needed = 5
        shop_items = []
        
        # First, randomly select from admin items (if any)
        if admin_items:
            # Use up to 2 admin items (randomly)
            num_admin_items = min(random.randint(0, 2), len(admin_items))
            if num_admin_items > 0:
                admin_selected = random.sample(admin_items, num_admin_items)
                for item in admin_selected:
                    shop_items.append({
                        'pokemon_id': item.pokemon_id,
                        'pokemon_name': item.pokemon_name,
                        'price': item.price,
                        'rarity': item.rarity,
                        'from_admin': True
                    })
        
        # Calculate how many more items we need from the API
        api_items_needed = total_items_needed - len(shop_items)
        
        # Fetch random cards from Pokemon TCG API
        if api_items_needed > 0:
            try:
                # Get a random page of cards
                page = random.randint(1, 20)  # Assuming there are many pages
                url = "https://api.pokemontcg.io/v2/cards"
                headers = {"X-Api-Key": API_KEY}
                params = {
                    'page': page,
                    'pageSize': 20  # Get more than we need to ensure variety
                }
                
                response = requests.get(url, headers=headers, params=params)
                if response.status_code == 200:
                    cards_data = response.json()['data']
                    
                    # If we got cards back, randomly select from them
                    if cards_data:
                        # Shuffle the cards for randomness
                        random.shuffle(cards_data)
                        
                        # Set price tiers based on rarity
                        rarity_pricing = {
                            'Common': (50, 100),
                            'Uncommon': (100, 200),
                            'Rare': (200, 400),
                            'Rare Holo': (400, 600),
                            'Rare Ultra': (600, 800),
                            'Legendary': (800, 1200)
                        }
                        
                        # Take cards until we have enough
                        for card in cards_data:
                            if len(shop_items) >= total_items_needed:
                                break
                                
                            # Skip cards that don't have complete data
                            if not card.get('id') or not card.get('name'):
                                continue
                            
                            # Get rarity and determine price
                            rarity = card.get('rarity', 'Common')
                            price_range = rarity_pricing.get(rarity, (50, 100))
                            price = Decimal(random.randint(price_range[0], price_range[1]))
                            
                            shop_items.append({
                                'pokemon_id': card['id'],
                                'pokemon_name': card['name'],
                                'price': price,
                                'rarity': rarity,
                                'from_admin': False
                            })
            except Exception as e:
                print(f"Error fetching cards from API: {e}")
        
        # Create user shop items from our combined list
        for item in shop_items:
            cls.objects.create(
                user=user,
                pokemon_id=item['pokemon_id'],
                pokemon_name=item['pokemon_name'],
                price=item['price'],
                rarity=item['rarity'],
                expires_at=expires_at
            )
        
        return len(shop_items) > 0
