from django.urls import path
from . import views

urlpatterns = [
    path('', views.daily_shop_items, name='daily_shop_items'),
    path('purchase/', views.purchase_from_shop, name='purchase_from_shop'),
    path('add-item/', views.add_admin_shop_item, name='add_admin_shop_item'),
    path('refresh/', views.refresh_shop, name='refresh_shop'),
]
