from django.contrib.auth.models import User
from django.db import models

class ShipAi(models.Model):
  name = models.CharField(max_length=128)
  logic = models.TextField()
  user = models.ForeignKey(User, on_delete=models.CASCADE)
