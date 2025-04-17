from django.urls import path
from . import views

urlpatterns = [
    path('generate/', views.generate_pokemon, name='generate_pokemon'),
    path('recent/', views.get_recent_cards, name='get_recent_cards'),
]
