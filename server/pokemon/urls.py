from django.urls import path
from .views import pokemon_list, user_collection, purchase_card, pokemon_detail

urlpatterns = [
    path("pokemon/", pokemon_list, name="pokemon_list"),
    path("pokemon/<str:card_id>/", pokemon_detail, name="pokemon_detail"),
    path("collection/", user_collection, name="user_collection"),
    path("purchase/", purchase_card, name="purchase_card"),
]
