from django.urls import path
from . import views

urlpatterns = [
    path('generate/', views.generate_pokemon, name='generate_pokemon'),
    path('recent/', views.get_recent_cards, name='get_recent_cards'),
    path('save-to-collection/', views.save_to_collection, name='save_to_collection'),
    path('cards/<str:card_id>/', views.get_card_details, name='get_card_details'),
]
