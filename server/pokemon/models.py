from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class UserCard(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cards')
    pokemon_id = models.CharField(max_length=50)  # Store the unique ID from pokemontcg API
    added_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'pokemon_id')  # Prevent duplicate cards
        verbose_name = "User's Card"
        verbose_name_plural = "User's Cards"
    
    def __str__(self):
        return f"{self.user.username}'s card: {self.pokemon_id}"
