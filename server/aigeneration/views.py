from django.shortcuts import render
import os
import json
import random
import base64
from io import BytesIO
from PIL import Image
import google.generativeai as genai
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .models import GeneratedCard
from pokemon.models import UserCard
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import requests
import io
import tempfile
from marketplace.models import User_wallet
from django.db import transaction
from decimal import Decimal

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_pokemon(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        name = data.get('name')
        description = data.get('description', '')
        primary_type = data.get('primaryType')
        secondary_type = data.get('secondaryType', '')
        rarity = data.get('rarity')
        art_style = data.get('artStyle')
        
        if not name or not primary_type or not rarity:
            return JsonResponse({
                'error': 'Missing required fields (name, primaryType, rarity)'
            }, status=400)
        
        # Set cost based on rarity
        rarity_costs = {
            'Common': Decimal('50.00'),
            'Uncommon': Decimal('100.00'),
            'Rare': Decimal('250.00'),
            'Rare Holo': Decimal('400.00'),
            'Rare Ultra': Decimal('600.00'),
            'Legendary': Decimal('750.00')
        }
        
        # Get the generation cost (default to 100 if rarity not in dictionary)
        GENERATION_COST = rarity_costs.get(rarity, Decimal('100.00'))
        
        # Get the user
        user = request.user
        
        # Check if user has enough balance
        wallet, created = User_wallet.objects.get_or_create(user=user, defaults={'balance': Decimal('2500.00')})
        
        if wallet.balance < GENERATION_COST:
            return JsonResponse({
                'error': f'Insufficient funds. A {rarity} card costs {GENERATION_COST} PD.'
            }, status=400)
        
        # Generate Pokemon stats
        hp, attack, defense = generate_stats(rarity)
        
        # Generate image using Gemini
        image_data = generate_image_with_gemini(name, description, primary_type, secondary_type, art_style)
            
        if not image_data:
            return JsonResponse({'error': 'Failed to generate image'}, status=500)
        
        # Save image to disk
        img_path = save_image(image_data, name)
        
        # Generate ability and attack information once
        ability_name = generate_ability_name(name, primary_type)
        ability_text = generate_ability_text(name, primary_type, description)
        attack_name = generate_attack_name(name, primary_type)
        attack_text = generate_attack_text(name, primary_type, attack)
        
        # Create database record and charge user in a transaction
        with transaction.atomic():
            # Deduct the cost from user's wallet
            wallet.balance -= GENERATION_COST
            wallet.save()
            
            # Create the card with ability and attack information
            card = GeneratedCard.objects.create(
                name=name,
                description=description,
                primary_type=primary_type,
                secondary_type=secondary_type,
                rarity=rarity,
                art_style=art_style,
                hp=hp,
                attack=attack,
                defense=defense,
                image_local_path=img_path,
                ability_name=ability_name,
                ability_text=ability_text,
                attack_name=attack_name,
                attack_text=attack_text
            )
        
        # Generate a unique ID for the card
        unique_id = generate_unique_id(name)
        
        return JsonResponse({
            'id': card.id,
            'name': card.name,
            'description': card.description,
            'primaryType': card.primary_type,
            'secondaryType': card.secondary_type,
            'rarity': card.rarity,
            'hp': card.hp,
            'attack': card.attack,
            'defense': card.defense,
            'imageUrl': request.build_absolute_uri(f'/media/pokemon_cards/{os.path.basename(img_path)}'),
            'uniqueId': unique_id,
            'cost': float(GENERATION_COST),
            'newBalance': float(wallet.balance)
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_recent_cards(request):
    cards = GeneratedCard.objects.order_by('-created_at')[:10]
    cards_data = []
    
    for card in cards:
        cards_data.append({
            'id': card.id,
            'name': card.name,
            'primaryType': card.primary_type,
            'rarity': card.rarity,
            'imageUrl': request.build_absolute_uri(f'/media/pokemon_cards/{os.path.basename(card.image_local_path)}')
        })
    
    return JsonResponse({'cards': cards_data})


def generate_stats(rarity):
    """Generate HP, attack, and defense stats based on rarity"""
    rarity_stats_multiplier = {
        'Common': 1.0,
        'Uncommon': 1.2,
        'Rare': 1.5,
        'Rare Holo': 1.8,
        'Rare Ultra': 2.2,
        'Legendary': 2.5
    }
    
    # Base stats
    base_hp = random.randint(60, 90)
    base_attack = random.randint(40, 70)
    base_defense = random.randint(40, 70)
    
    # Apply multiplier based on rarity
    multiplier = rarity_stats_multiplier.get(rarity, 1.0)
    
    hp = int(base_hp * multiplier)
    attack = int(base_attack * multiplier)
    defense = int(base_defense * multiplier)
    
    # Cap stats at reasonable values
    hp = min(max(hp, 60), 300)
    attack = min(max(attack, 40), 150)
    defense = min(max(defense, 40), 150)
    
    return hp, attack, defense


def generate_image_with_gemini(name, description, primary_type, secondary_type, art_style):
    """Two-step approach: Use Gemini for text, Hugging Face for image"""
    try:
        # Configure Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Create prompt for Gemini
        type_description = f"{primary_type} element"
        if secondary_type:
            type_description += f" and {secondary_type} element"
        
        prompt_for_gemini = f"""Create a detailed description for a fantasy creature with these characteristics:
        - Name: {name}
        - Powers: {type_description}
        - Description: {description}
        - Art Style: {art_style}
        
        Format your response as a detailed prompt for an image generator. Focus only on visual attributes.
        Make the description very detailed and creative, approximately 100 words.
        """
        
        # Generate detailed description with Gemini
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt_for_gemini)
        
        # Extract the detailed description
        detailed_prompt = response.text
        print(f"Generated prompt: {detailed_prompt}")
        
        # Use Hugging Face for actual image generation
        image_data = generate_with_huggingface(detailed_prompt)
        
        if image_data:
            return image_data
        else:
            print("Hugging Face image generation failed, using placeholder")
            return generate_placeholder_image(name, primary_type)
        
    except Exception as e:
        print(f"Gemini generation error: {e}")
        return generate_placeholder_image(name, primary_type)


def generate_with_huggingface(prompt):
    """Generate image using Hugging Face's free API"""
    try:
        if not settings.HUGGINGFACE_API_KEY:
            print("No Hugging Face API key provided")
            return None
            
        # Updated URL with the correct model path
        API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
        
        headers = {
            "Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"
        }
        
        payload = {
            "inputs": prompt,
        }
        
        print("Sending request to Hugging Face API...")
        response = requests.post(API_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            # The response directly contains the image bytes
            print("Hugging Face image generated successfully")
            image_bytes = response.content
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            return base64_image
        else:
            print(f"Hugging Face API error: {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"Hugging Face API error: {e}")
        return None


def get_color_for_type(primary_type):
    """Convert Pokemon type to color description"""
    type_colors = {
        'Fire': 'red and orange',
        'Water': 'blue',
        'Grass': 'green',
        'Electric': 'yellow',
        'Psychic': 'purple',
        'Fighting': 'brown',
        'Rock': 'gray',
        'Ground': 'brown and tan',
        'Flying': 'white and blue',
        'Bug': 'green and brown',
        'Poison': 'purple',
        'Normal': 'beige',
        'Ghost': 'purple and gray',
        'Dark': 'black and gray',
        'Steel': 'silver',
        'Fairy': 'pink',
        'Dragon': 'blue and red',
        'Ice': 'light blue'
    }
    return type_colors.get(primary_type, 'colorful')


def generate_placeholder_image(name, primary_type):
    """Generate a simple colored placeholder if AI generation fails"""
    type_colors = {
        'Fire': (240, 128, 48),
        'Water': (104, 144, 240),
        'Grass': (120, 200, 80),
        'Electric': (248, 208, 48),
        'Psychic': (248, 88, 136),
        'Fighting': (192, 48, 40),
        'Rock': (184, 160, 56),
        'Ground': (224, 192, 104),
        'Flying': (168, 144, 240),
        'Bug': (168, 184, 32),
        'Poison': (160, 64, 160),
        'Normal': (168, 168, 120),
        'Ghost': (112, 88, 152),
        'Dark': (112, 88, 72),
        'Steel': (184, 184, 208),
        'Fairy': (238, 153, 172),
        'Dragon': (112, 56, 248),
        'Ice': (152, 216, 216)
    }
    
    color = type_colors.get(primary_type, (200, 200, 200))
    
    # Create a simple colored image with the Pokemon name
    img = Image.new('RGB', (512, 512), color)
    
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def save_image(base64_img, name):
    """Save the generated image to disk"""
    media_path = os.path.join(settings.BASE_DIR, 'media', 'pokemon_cards')
    os.makedirs(media_path, exist_ok=True)
    
    # Clean filename
    clean_name = ''.join(c for c in name if c.isalnum() or c in ' _-').strip().replace(' ', '_')
    filename = f"{clean_name}_{random.randint(1000, 9999)}.png"
    filepath = os.path.join(media_path, filename)
    
    # Decode and save image
    img_data = base64.b64decode(base64_img)
    with open(filepath, 'wb') as f:
        f.write(img_data)
    
    return filepath

# Add this new function to generate unique IDs
def generate_unique_id(name):
    """
    Generate a unique ID based on the name length and letter-value sum
    Format: ai-{length}-{letter_sum}
    """
    if not name:
        return "ai-0-0"
        
    # Calculate length (including all characters)
    name_length = len(name)
    
    # Calculate letter-value sum (a=1, b=2, ..., z=26)
    letter_sum = 0
    for char in name.lower():
        if 'a' <= char <= 'z':
            letter_sum += ord(char) - ord('a') + 1
        elif '0' <= char <= '9':
            # Option (a): treat digits as their numeric value
            letter_sum += int(char)
    
    # Create the unique ID
    unique_id = f"ai-{name_length}-{letter_sum}"
    return unique_id

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_to_collection(request):
    """
    Save an AI-generated card to the user's collection
    """
    try:
        data = json.loads(request.body)
        card_id = data.get('card_id')
        
        if not card_id:
            return JsonResponse({
                'success': False,
                'message': 'Card ID is required'
            }, status=400)
        
        # Get the user
        user = request.user
        
        # Check if the card exists
        try:
            card = GeneratedCard.objects.get(id=card_id)
        except GeneratedCard.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Card not found'
            }, status=404)
        
        # Generate unique pokemon_id based on the name
        ai_pokemon_id = generate_unique_id(card.name)
        
        # Check if already in collection
        if UserCard.objects.filter(user=user, pokemon_id=ai_pokemon_id).exists():
            return JsonResponse({
                'success': False,
                'message': 'This card is already in your collection'
            }, status=400)
        
        # Add to collection
        UserCard.objects.create(
            user=user,
            pokemon_id=ai_pokemon_id
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Card added to your collection!',
            'pokemon_id': ai_pokemon_id
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

# Extend the get_card_details endpoint to use for viewing AI cards
@api_view(['GET'])
def get_card_details(request, card_id):
    """
    Get details for an AI-generated card in a format similar to Pokemon TCG API
    """
    try:
        # Check if it's an AI card
        if card_id.startswith('ai-'):
            # Get all generated cards
            all_cards = GeneratedCard.objects.all()
            
            # Find the card with matching unique ID
            card = None
            for gen_card in all_cards:
                unique_id = generate_unique_id(gen_card.name)
                if unique_id == card_id:
                    card = gen_card
                    break
            
            if not card:
                return JsonResponse({
                    'success': False,
                    'message': f'AI card not found with ID {card_id}'
                }, status=404)
            
            # Use stored ability and attack info if available, otherwise generate
            ability_name = card.ability_name or generate_ability_name(card.name, card.primary_type)
            ability_text = card.ability_text or generate_ability_text(card.name, card.primary_type, card.description)
            attack_name = card.attack_name or generate_attack_name(card.name, card.primary_type)
            attack_text = card.attack_text or generate_attack_text(card.name, card.primary_type, card.attack)
            
            # Format similar to Pokemon TCG API
            card_data = {
                'data': {
                    'id': card_id,
                    'name': card.name,
                    'hp': str(card.hp),
                    'types': [card.primary_type],
                    'evolvesFrom': None,
                    'abilities': [{
                        'name': ability_name,
                        'text': ability_text,
                        'type': 'Ability'
                    }],
                    'attacks': [{
                        'name': attack_name,
                        'cost': [card.primary_type],
                        'convertedEnergyCost': 1,
                        'damage': str(card.attack * 10),
                        'text': attack_text
                    }],
                    'weaknesses': [{
                        'type': get_weakness_type(card.primary_type),
                        'value': '+30'
                    }],
                    'resistances': [{
                        'type': get_resistance_type(card.primary_type),
                        'value': '-20'
                    }],
                    'retreatCost': ['Colorless', 'Colorless'],
                    'convertedRetreatCost': 2,
                    'set': {
                        'name': 'AI Generated',
                        'series': 'Custom',
                        'printedTotal': 0,
                        'total': 0,
                    },
                    'number': card_id,  # Use unique ID as the card number
                    'artist': 'AI',
                    'rarity': card.rarity,
                    'flavorText': card.description,
                    'images': {
                        'small': request.build_absolute_uri(f'/media/pokemon_cards/{os.path.basename(card.image_local_path)}'),
                        'large': request.build_absolute_uri(f'/media/pokemon_cards/{os.path.basename(card.image_local_path)}')
                    }
                }
            }
            
            return JsonResponse(card_data)
        else:
            # For regular Pokemon TCG API cards, proxy the request to the API
            url = f"https://api.pokemontcg.io/v2/cards/{card_id}"
            headers = {"X-Api-Key": settings.API_KEY}
            
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                return JsonResponse(response.json())
            else:
                return JsonResponse(
                    {"error": "Failed to fetch card details"}, 
                    status=response.status_code
                )
            
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

# Helper functions for generating card content
def generate_ability_name(pokemon_name, primary_type):
    """Generate a creative ability name based on the Pokemon's characteristics"""
    type_ability_prefixes = {
        'Fire': ['Flame', 'Blaze', 'Inferno', 'Heat', 'Ember'],
        'Water': ['Aqua', 'Tide', 'Hydro', 'Ocean', 'Stream'],
        'Grass': ['Leaf', 'Bloom', 'Petal', 'Forest', 'Nature'],
        'Electric': ['Spark', 'Volt', 'Thunder', 'Shock', 'Static'],
        'Psychic': ['Mind', 'Psi', 'Dream', 'Vision', 'Astral'],
        'Fighting': ['Combat', 'Warrior', 'Battle', 'Fist', 'Mighty'],
        'Rock': ['Stone', 'Boulder', 'Mountain', 'Crystal', 'Earth'],
        'Ground': ['Terra', 'Sand', 'Soil', 'Quake', 'Desert'],
        'Flying': ['Sky', 'Wind', 'Aerial', 'Soar', 'Gust'],
        'Bug': ['Swarm', 'Insect', 'Hive', 'Web', 'Sting'],
        'Poison': ['Venom', 'Toxic', 'Acid', 'Virus', 'Plague'],
        'Normal': ['Primal', 'Basic', 'Core', 'Essence', 'Aura'],
        'Ghost': ['Spirit', 'Shadow', 'Phantom', 'Spectral', 'Haunt'],
        'Dark': ['Night', 'Shade', 'Gloom', 'Dark', 'Dusk'],
        'Steel': ['Metal', 'Iron', 'Steel', 'Chrome', 'Alloy'],
        'Fairy': ['Charm', 'Magic', 'Pixie', 'Fae', 'Enchant'],
        'Dragon': ['Drake', 'Wyrm', 'Dragon', 'Serpent', 'Scale'],
        'Ice': ['Frost', 'Freeze', 'Chill', 'Glacial', 'Arctic']
    }
    
    ability_suffixes = ['Power', 'Force', 'Strike', 'Surge', 'Aura', 'Bond', 'Strength', 'Instinct', 'Command', 'Mastery']
    
    prefix = random.choice(type_ability_prefixes.get(primary_type, ['Mystic']))
    suffix = random.choice(ability_suffixes)
    
    return f"{prefix} {suffix}"

def generate_ability_text(pokemon_name, primary_type, description):
    """Generate ability text based on the Pokemon's characteristics"""
    if not description:
        description = f"A mysterious {primary_type.lower()} type creature"
    
    type_effects = {
        'Fire': 'burns the opponent', 
        'Water': 'washes away the opponent\'s defenses', 
        'Grass': 'absorbs energy from the environment', 
        'Electric': 'charges with electrical energy', 
        'Psychic': 'reads the opponent\'s mind', 
        'Fighting': 'overwhelms opponents with physical strength', 
        'Rock': 'hardens its body for defense', 
        'Ground': 'manipulates the battlefield terrain', 
        'Flying': 'soars above the battlefield', 
        'Bug': 'swarms with hidden strength', 
        'Poison': 'secretes toxic substances', 
        'Normal': 'adapts to any situation', 
        'Ghost': 'phases through solid objects', 
        'Dark': 'operates from the shadows', 
        'Steel': 'reinforces its body with metal', 
        'Fairy': 'enchants the battlefield with magic', 
        'Dragon': 'channels ancient draconic power', 
        'Ice': 'freezes the surrounding area'
    }
    
    effect = type_effects.get(primary_type, 'unleashes mysterious energy')
    
    ability_templates = [
        f"Once per turn, {pokemon_name} {effect} to nullify opponent's abilities.",
        f"When {pokemon_name} enters play, it {effect}, reducing damage taken next turn.",
        f"{pokemon_name} {effect}, gaining strength from its surroundings.",
        f"If your opponent has more Prize cards than you, {pokemon_name} {effect} to draw a card.",
        f"When damaged, {pokemon_name} {effect}, healing 20 damage from itself."
    ]
    
    return random.choice(ability_templates)

def generate_attack_name(pokemon_name, primary_type):
    """Generate an attack name based on the Pokemon's type"""
    type_attack_prefixes = {
        'Fire': ['Flame', 'Blaze', 'Inferno', 'Ember', 'Scorch'],
        'Water': ['Aqua', 'Hydro', 'Tidal', 'Splash', 'Torrent'],
        'Grass': ['Leaf', 'Petal', 'Vine', 'Solar', 'Spore'],
        'Electric': ['Thunder', 'Volt', 'Shock', 'Spark', 'Discharge'],
        'Psychic': ['Psi', 'Mental', 'Psychic', 'Mind', 'Telekinetic'],
        'Fighting': ['Power', 'Mega', 'Combat', 'Karate', 'Judo'],
        'Rock': ['Rock', 'Stone', 'Seismic', 'Boulder', 'Fossil'],
        'Ground': ['Earth', 'Sand', 'Mud', 'Quake', 'Dig'],
        'Flying': ['Air', 'Wing', 'Sky', 'Aerial', 'Tornado'],
        'Bug': ['Bug', 'Swarm', 'Insect', 'Hive', 'Sting'],
        'Poison': ['Toxic', 'Venom', 'Poison', 'Acid', 'Gas'],
        'Normal': ['Tackle', 'Slam', 'Strike', 'Rush', 'Quick'],
        'Ghost': ['Shadow', 'Phantom', 'Haunt', 'Spectral', 'Curse'],
        'Dark': ['Dark', 'Night', 'Shadow', 'Foul', 'Bite'],
        'Steel': ['Iron', 'Steel', 'Metal', 'Chrome', 'Gear'],
        'Fairy': ['Fairy', 'Charm', 'Pixie', 'Glimmer', 'Enchant'],
        'Dragon': ['Dragon', 'Drake', 'Rage', 'Claw', 'Wrath'],
        'Ice': ['Ice', 'Frost', 'Freeze', 'Crystal', 'Blizzard']
    }
    
    attack_suffixes = ['Strike', 'Blast', 'Attack', 'Surge', 'Rush', 'Smash', 'Slam', 'Pulse', 'Beam', 'Cannon']
    
    prefix = random.choice(type_attack_prefixes.get(primary_type, ['Mystic']))
    suffix = random.choice(attack_suffixes)
    
    return f"{prefix} {suffix}"

def generate_attack_text(pokemon_name, primary_type, attack_value):
    """Generate attack text based on the Pokemon's characteristics"""
    damage = attack_value * 10
    
    type_effects = {
        'Fire': 'may burn', 
        'Water': 'may wash away attachments from', 
        'Grass': 'absorbs energy from', 
        'Electric': 'may paralyze', 
        'Psychic': 'confuses', 
        'Fighting': 'hits with extra force against', 
        'Rock': 'damages the bench of', 
        'Ground': 'reduces damage next turn from', 
        'Flying': 'avoids counterattacks from', 
        'Bug': 'poisons', 
        'Poison': 'badly poisons', 
        'Normal': 'deals consistent damage to', 
        'Ghost': 'bypasses defenses of', 
        'Dark': 'discards cards from', 
        'Steel': 'reduces damage next turn from', 
        'Fairy': 'charms', 
        'Dragon': 'deals devastating damage to', 
        'Ice': 'freezes'
    }
    
    effect = type_effects.get(primary_type, 'damages')
    
    attack_templates = [
        f"Does {damage} damage. This attack {effect} the defending Pokémon.",
        f"Does {damage} damage. If heads, this attack {effect} the defending Pokémon.",
        f"Does {damage} damage. Heal {damage//2} damage from this Pokémon.",
        f"Does {damage} damage. Draw a card.",
        f"Does {damage} damage. This attack's damage isn't affected by resistance."
    ]
    
    return random.choice(attack_templates)

# Helper functions for card details
def get_weakness_type(primary_type):
    weakness_map = {
        'Fire': 'Water',
        'Water': 'Grass',
        'Grass': 'Fire',
        'Electric': 'Fighting',
        'Psychic': 'Dark',
        'Fighting': 'Psychic',
        'Dark': 'Fighting',
        'Fairy': 'Metal',
        'Metal': 'Fire',
        'Dragon': 'Fairy',
        'Normal': 'Fighting'
    }
    return weakness_map.get(primary_type, 'Colorless')

def get_resistance_type(primary_type):
    resistance_map = {
        'Fire': 'Grass',
        'Water': 'Fire',
        'Grass': 'Water',
        'Electric': 'Metal',
        'Psychic': 'Fighting',
        'Fighting': 'Rock',
        'Dark': 'Psychic',
        'Fairy': 'Dark',
        'Metal': 'Psychic',
        'Dragon': 'Electric',
        'Normal': 'Psychic'
    }
    return resistance_map.get(primary_type, 'Psychic')
