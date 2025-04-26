from django.contrib import admin
from .models import ShopItem, UserDailyShop

class ShopItemAdmin(admin.ModelAdmin):
    list_display = ('pokemon_name', 'price', 'rarity', 'enabled', 'created_at')
    search_fields = ('pokemon_name', 'rarity')
    list_filter = ('rarity', 'enabled', 'created_at')
    
    fieldsets = (
        (None, {
            'fields': ('pokemon_id', 'pokemon_name', 'price', 'rarity', 'enabled')
        }),
    )

class UserDailyShopAdmin(admin.ModelAdmin):
    list_display = ('user', 'pokemon_name', 'price', 'created_at', 'expires_at')
    search_fields = ('user__username', 'pokemon_name')
    list_filter = ('rarity', 'created_at')
    
    fieldsets = (
        (None, {
            'fields': ('user', 'pokemon_id', 'pokemon_name', 'price', 'rarity', 'expires_at')
        }),
    )

admin.site.register(ShopItem, ShopItemAdmin)
admin.site.register(UserDailyShop, UserDailyShopAdmin)
