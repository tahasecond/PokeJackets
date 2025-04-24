from django.contrib import admin
from .models import UserCard

# Register your models here.
class UserCardAdmin(admin.ModelAdmin):
    list_display = ('user', 'pokemon_id', 'added_date')
    list_filter = ('user', 'added_date')
    search_fields = ('user__username', 'pokemon_id')
    
    fieldsets = (
        (None, {
            'fields': ('user', 'pokemon_id')
        }),
    )
    
admin.site.register(UserCard, UserCardAdmin)
