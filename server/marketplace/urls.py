from django.urls import path
from . import views

urlpatterns = [
    path('listings/', views.marketplace_listings, name='marketplace_listings'),
    path('my-listings/', views.user_listings, name='user_listings'),
    path('create-listing/', views.create_listing, name='create_listing'),
    path('cancel-listing/', views.cancel_listing, name='cancel_listing'),
    path('buy-listing/', views.buy_listing, name='buy_listing'),
]