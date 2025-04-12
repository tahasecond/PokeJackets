from django.urls import path
from .views import pokemon_list

urlpatterns = [
    path("pokemon", pokemon_list, name="pokemon_list"),
]
