from django.shortcuts import render
import os
import json
import random
import base64
from io import BytesIO
from PIL import Image
import openai
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .models import GeneratedCard

# Configure OpenAI
openai.api_key = settings.OPENAI_API_KEY

@csrf_exempt
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
        
        # Generate Pokemon stats
        hp, attack, defense = generate_stats(rarity)
        
        # Generate image using OpenAI
        image_data = generate_image_openai(name, description, primary_type, secondary_type, art_style)
            
        if not image_data:
            return JsonResponse({'error': 'Failed to generate image'}, status=500)
        
        # Save image to disk
        img_path = save_image(image_data, name)
        
        # Create database record
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
            image_local_path=img_path
        )
        
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
            'imageUrl': request.build_absolute_uri(f'/media/pokemon_cards/{os.path.basename(img_path)}')
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
    """Generate Pokemon stats based on rarity"""
    rarity_multipliers = {
        'Common': 0.8,
        'Uncommon': 1.0,
        'Rare': 1.2,
        'Rare Holo': 1.5,
        'Rare Ultra': 1.8,
        'Legendary': 2.0
    }
    
    multiplier = rarity_multipliers.get(rarity, 1.0)
    
    hp = int(random.randint(50, 120) * multiplier)
    attack = int(random.randint(30, 90) * multiplier)
    defense = int(random.randint(20, 80) * multiplier)
    
    return hp, attack, defense


def generate_image_openai(name, description, primary_type, secondary_type, art_style):
    """Generate Pokemon image using OpenAI DALL-E"""
    type_description = f"{primary_type} type"
    if secondary_type:
        type_description += f" and {secondary_type} type"
    
    prompt = f"A Pokemon trading card artwork of {name}, a {type_description} Pokemon. {description} Art style: {art_style}. The image should look like official Pokemon artwork."
    
    try:
        response = openai.Image.create(
            prompt=prompt,
            n=1,
            size="512x512",
            response_format="b64_json"
        )
        
        return response['data'][0]['b64_json']
    except Exception as e:
        print(f"OpenAI image generation error: {e}")
        return generate_placeholder_image(name, primary_type)


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
