# Generated by Django 3.2.25 on 2024-08-21 02:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plugin', '0012_pluginbinding_source'),
    ]

    operations = [
        migrations.AddField(
            model_name='pluginform',
            name='example',
            field=models.TextField(blank=True, default='', help_text='example for this plugin'),
        ),
    ]