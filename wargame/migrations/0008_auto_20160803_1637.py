# -*- coding: utf-8 -*-
# Generated by Django 1.9.8 on 2016-08-03 16:37
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wargame', '0007_auto_20160803_0646'),
    ]

    operations = [
        migrations.AlterField(
            model_name='contest',
            name='name',
            field=models.CharField(max_length=128, unique=True),
        ),
    ]