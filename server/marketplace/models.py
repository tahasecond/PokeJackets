from django.db import models

# Create your models here.

class Pokemon(models.py):
    name = models.charField(max_length=100)
    pokedex_number = models.IntegerField()
    type_primary = models.CharField(max_length=50)
    type_secondary = models.CharField(max_length=50, blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.name