# Generated by Django 5.1.5 on 2025-04-24 21:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("aigeneration", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="generatedcard",
            name="ability_name",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="generatedcard",
            name="ability_text",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="generatedcard",
            name="attack_name",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="generatedcard",
            name="attack_text",
            field=models.TextField(blank=True, null=True),
        ),
    ]
