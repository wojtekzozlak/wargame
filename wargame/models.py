from django.contrib.auth.models import User
from django.db import models


class ShipAi(models.Model):
  name = models.CharField(max_length=128)
  logic = models.TextField()
  user = models.ForeignKey(User, on_delete=models.CASCADE)
  representant = models.BooleanField(default=False)


class Contest(models.Model):
  name = models.CharField(max_length=128, unique=True)
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

  player_a = models.ForeignKey(User, related_name='matches_a')
  logic_a = models.TextField()
  ai_name_a = models.CharField(max_length=128)

  player_b = models.ForeignKey(User, related_name='matches_b')
  logic_b = models.TextField()
  ai_name_b = models.CharField(max_length=128)

  outcome = models.CharField(max_length=16, choices=OUTCOME_CHOICES)
  course = models.TextField()


class Challenge(models.Model):
  date_time = models.DateTimeField(auto_now_add=True)
  challenger = models.ForeignKey(User, related_name='challangers')
  challenged = models.ForeignKey(User, related_name='challanged')

  accepted = models.BooleanField(default=False)
  match = models.ForeignKey(Match, null=True)
  
