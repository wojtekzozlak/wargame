from django.contrib.auth.models import User
from django.db import models


class ShipAi(models.Model):
  name = models.CharField(max_length=128)
  logic = models.TextField()
  user = models.ForeignKey(User, on_delete=models.CASCADE)
  representant = models.BooleanField(default=False)


class Contest(models.Model):
  name = models.CharField(max_length=128)
  description = models.CharField(max_length=1024)
  results_public = models.BooleanField(default=False)


class Match(models.Model):
  TIE = 'tie'
  ERROR = 'error'
  PLAYER_A_WON = 'player_a_won'
  PLAYER_B_WON = 'player_b_won'
  OUTCOME_CHOICES = (
    (TIE, 'tie'),
    (PLAYER_A_WON, 'Player A won'),
    (PLAYER_B_WON, 'Player B won'),
  )

  contest = models.ForeignKey(Contest)
  date_time = models.DateTimeField(auto_now_add=True)
  ai_a = models.ForeignKey(ShipAi, related_name='matches_a')
  ai_b = models.ForeignKey(ShipAi, related_name='matches_b')
  outcome = models.CharField(max_length=16, choices=OUTCOME_CHOICES)
  course = models.TextField()
