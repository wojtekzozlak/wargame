# -*- coding: utf-8 -*-
# Generated by Django 1.9.8 on 2016-07-28 05:54
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wargame', '0003_auto_20160724_1239'),
    ]

    operations = [
        migrations.AddField(
            model_name='contest',
            name='results_public',
            field=models.BooleanField(default=False),
        ),
    ]
