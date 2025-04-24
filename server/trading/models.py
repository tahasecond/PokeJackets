from django.db import models
from django.contrib.auth.models import User
from marketplace.models import Listing


# Create your models here.
class FriendRequest(models.Model):
    from_user = models.ForeignKey(
        User, related_name="sent_requests", on_delete=models.CASCADE
    )
    to_user = models.ForeignKey(
        User, related_name="received_requests", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("from_user", "to_user")

    def __str__(self):
        return f"{self.from_user.username} -> {self.to_user.username}"

class RequestTrade(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='trade_requests')
    requester = models.ForeignKey(User, on_delete=models.CASCADE)
    offered_pokemon_name = models.CharField(max_length=100)
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
