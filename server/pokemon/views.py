from django.http import JsonResponse
from mysite.settings import API_KEY
import requests

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
