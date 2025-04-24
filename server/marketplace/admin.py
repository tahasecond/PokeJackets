from django.contrib import admin
from .models import Listing, User_wallet

# Register your models here.
class User_walletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance')
    search_fields = ('user__username',)
    list_filter = ('balance',)
    
    fieldsets = (
        (None, {
            'fields': ('user', 'balance')
        }),
    )
    
admin.site.register(User_wallet, User_walletAdmin)
admin.site.register(Listing)
