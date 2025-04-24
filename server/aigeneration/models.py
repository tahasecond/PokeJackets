from django.db import models

# Create your models here.

class GeneratedCard(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    primary_type = models.CharField(max_length=50)
    secondary_type = models.CharField(max_length=50, blank=True, null=True)
    rarity = models.CharField(max_length=50)
    art_style = models.CharField(max_length=50)
    hp = models.IntegerField()
    attack = models.IntegerField()
    defense = models.IntegerField()
    image_url = models.URLField(blank=True, null=True)
    image_local_path = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # New fields for storing ability and attack info
    ability_name = models.CharField(max_length=100, blank=True, null=True)
    ability_text = models.TextField(blank=True, null=True)
    attack_name = models.CharField(max_length=100, blank=True, null=True)
    attack_text = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.name
