from django.db import models
from django.contrib.auth.models import User

# Create your models here.

    
class Listing(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listings')
    pokemon_id = models.CharField(max_length=50, default='default-id')  # Store the unique ID from Pokemon TCG API
    pokemon_name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.owner.username}'s listing: {self.pokemon_name} (${self.price})"
    

class User_wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.user.username} - {self.balance} PD"