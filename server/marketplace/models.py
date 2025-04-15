from django.db import models
from django.contrib.auth.models import User

# Create your models here.

    
class Listing(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listings')
    pokemon_name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.owner.username}'s listing: {self.pokemon_name}" 
    
class RequestTrade(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='trade_requests')
    requester = models.ForeignKey(User, on_delete=models.CASCADE)
    offered_pokemon_name = models.CharField(max_length=100)  # or offered_pokemon_id
    status_choices = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]
    status = models.CharField(max_length=10, choices=status_choices, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.requester.username} offers {self.offered_pokemon_name} for {self.listing.pokemon_name}"