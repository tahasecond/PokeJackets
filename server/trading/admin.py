from django.contrib import admin
from .models import FriendRequest, RequestTrade

# Register your models here.
admin.site.register(FriendRequest)
admin.site.register(RequestTrade)
