from django.urls import path
from .views import (
    pokemon_list,
    user_collection,
    purchase_card,
    pokemon_detail,
    add_to_collection,
    delete_card_from_collection,
)

urlpatterns = [
    path("pokemon/", pokemon_list, name="pokemon_list"),
    path("pokemon/<str:card_id>/", pokemon_detail, name="pokemon_detail"),
    path("collection/", user_collection, name="user_collection"),
    path("purchase/", purchase_card, name="purchase_card"),
    path("collection/add/", add_to_collection, name="add-to-collection"),
    path("collection/delete/", delete_card_from_collection, name="delete_user_card"),
]
