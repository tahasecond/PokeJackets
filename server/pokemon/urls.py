from django.urls import path
from .views import pokemon_list, user_collection

urlpatterns = [
    path("pokemon/", pokemon_list, name="pokemon_list"),
    path("collection/", user_collection, name="user_collection"),
]
