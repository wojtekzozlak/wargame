from django.contrib.auth import authenticate, login as auth_login, models as auth_models
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Q
from django import forms
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render, get_object_or_404

import json
from wargame import game
from wargame import models

_DEFAULT_SHIP_AI = """// This block will be executed only in the first iteration.
var init_marker;
if (init_marker == undefined) {
  init_marker = true;
  // That's how you can log things.
  Log('Initialization!')

  // Set speed to 50 and direction to West.
  SetTargetSpeed(50);
  SetTargetAngle(90);
}

// Shoot when possible.
if (GetAvailableAmmo() > 0) {
  Shoot(0);
}
"""

class RegistrationForm(forms.Form):
  username = forms.CharField(label='username', max_length=100)
  password = forms.CharField(label='password', widget=forms.PasswordInput())
  repeated_password = forms.CharField(label='confirm password', widget=forms.PasswordInput())

  def clean(self):
    cleaned_data = super(RegistrationForm, self).clean()
    print cleaned_data
    if cleaned_data.get('password', '') != cleaned_data.get('repeated_password', ''):
      self.add_error('repeated_password', 'Passwords does not match.')
    if auth_models.User.objects.filter(username=cleaned_data.get('username', '')).exists():
      self.add_error('username', 'Account with that username already exists.')


class ChallengeForm(forms.Form):
  def __init__(self, *args, **kwargs):
    self._challenger = kwargs.pop('challenger')
    super(ChallengeForm, self).__init__(*args, **kwargs)

    if self._challenger:
      self.fields['challenged'].queryset = auth_models.User.objects.exclude(
          id=self._challenger.id)

  challenged = forms.ModelChoiceField(
      label="User", queryset=auth_models.User.objects.all(),
      empty_label=None,
      widget=forms.Select(attrs={'class': 'form-control'}))

  def clean_challenged(self):
    challenged_user = self.cleaned_data['challenged']
    if challenged_user.id == self._challenger.id:
      raise forms.ValidationError('You can not challenge yourself!')
    if models.Challenge.objects.filter(challenger=self._challenger,
                                       challenged=challenged_user,
                                       accepted=False).exists():
      raise forms.ValidationError('You can have only one pending challenge per user.')
    return challenged_user


def _shortenString(string, max_len):
  if len(string) <= max_len:
    return string
  else:
    return string[:max_len-3] + '...'


def register(request):
  if request.method == 'POST':
    form = RegistrationForm(request.POST)
    if form.is_valid():
      new_user = auth_models.User()
      new_user.username = form.cleaned_data['username']
      new_user.set_password(form.cleaned_data['password'])
      new_user.save()
      new_user.refresh_from_db()
      
      user = authenticate(username=form.cleaned_data['username'],
                          password=form.cleaned_data['password'])
      auth_login(request, user)
      return redirect('workspace')
  else:
    form = RegistrationForm()

  return render(request, 'registration/register.html' , {'form': form})

def post_register(request):
  return render(request, 'registration/post_register.html')


@login_required
def run_match(request):
  player_a = models.ShipAi.objects.get(user=request.user, id=request.POST.get('player_a'))
  player_b = models.ShipAi.objects.get(user=request.user, id=request.POST.get('player_b'))
  max_duration_ms = 30000  # 30s
  result = game.run_match('Player A', player_a, 'Player B', player_b, max_duration_ms)
  return JsonResponse(dict(data=result))

@login_required
def list_ais(request):
  dataset = models.ShipAi.objects.filter(user=request.user).order_by('id')
  ais = []
  for ai in dataset:
    ais.append({
      'id': ai.id,
      'name': _shortenString(ai.name, 30),
      'representant': ai.representant,
    })
  return JsonResponse(dict(data=ais))

@login_required
def get_ai(request):
  ai_id = request.GET.get('id')
  ai = get_object_or_404(models.ShipAi, id=ai_id, user=request.user)
  return JsonResponse({
    'data': {
      'id': ai.id,
      'name': ai.name,
      'logic': ai.logic
    }
  });

@login_required
def add_ai(request):
  name = request.POST.get('name')
  if models.ShipAi.objects.filter(name=name, user=request.user).exists():
    return JsonResponse({
      'error': 'AI with this name already exists.'
    }, status=400)

  ai = models.ShipAi()
  ai.name = name
  ai.user = request.user
  ai.logic = _DEFAULT_SHIP_AI
  ai.save()
  return JsonResponse({
    'data': {
        'id': ai.id
    }
  })

@login_required
@transaction.atomic
def mark_ai_as_representant(request):
  ai_id = request.POST.get('id')
  ai = get_object_or_404(models.ShipAi, id=ai_id, user=request.user)

  models.ShipAi.objects.filter(user=request.user).update(representant=False)
  ai.representant = True
  ai.save()
  return JsonResponse({})


@login_required
def delete_ai(request):
  ai_id = request.POST.get('id')
  ai = get_object_or_404(models.ShipAi, id=ai_id, user=request.user)
  ai.delete()
  return JsonResponse({})

@login_required
def save_ai_logic(request):
  ai_id = request.POST.get('id')
  name = request.POST.get('name')
  logic = request.POST.get('logic')
  ai = get_object_or_404(models.ShipAi, id=ai_id, user=request.user)
  ai.name = name
  ai.logic = logic
  ai.save()
  return JsonResponse({})

@login_required
def workspace(request):
  return render(request, 'wargame/workspace.html')


def help(request):
  docs_file = open('simulation/docs.json')
  docs = json.load(docs_file)
  return render(request, 'wargame/help.html', context=dict(docs=docs))


@login_required
def matches_list(request):
  matching_user = Q(player_a=request.user) | Q(player_b=request.user)
  results_are_public = Q(contest__results_public=True)
  matches = models.Match.objects.filter(
      matching_user & results_are_public).order_by('contest', '-date_time',)

  items = []
  for match in matches:
    if match.player_a != request.user:
      opponent = match.player_a
      opponent_ai = match.ai_name_a
      player_ai = match.ai_name_b
    else:
      opponent = match.player_b
      opponent_ai = match.ai_name_b
      player_ai = match.ai_name_a

    item = {}
    item['id'] = match.id
    item['contest'] = match.contest.name
    item['player_ai_name'] = player_ai
    item['opponent_ai_name'] = opponent_ai
    item['opponent_name'] = opponent.username
    item['date_time'] = match.date_time
    item['outcome'] = get_readable_match_outcome(match)
    items.append(item)

  return render(request, 'wargame/matches_list.html',
                context=dict(items=items))


def get_readable_match_outcome(match):
  if match.outcome == match.ERROR:
    return 'ERROR'
  elif match.outcome == match.TIE:
    return 'TIE'
  else:
    return '"%s" WON' % (
       match.ai_a.user.username if match.outcome == match.PLAYER_A_WON
       else match.ai_b.user.username)


@login_required
def match_replay(request, match_id):
  ai_query = Q(player_a=request.user) | Q(player_b=request.user)
  match = get_object_or_404(models.Match, ai_query, id=match_id, contest__results_public=True)
  readable_outcome = get_readable_match_outcome(match)
  return render(request, 'wargame/match_replay.html',
                context=dict(match=match, outcome=readable_outcome))


@login_required
def challenges(request, error_msg=None):
  msg = None

  if request.method == 'POST':
    challenge_form = ChallengeForm(request.POST, challenger=request.user)
    if challenge_form.is_valid():
      new_challenge = models.Challenge()
      new_challenge.challenger = request.user
      new_challenge.challenged = challenge_form.cleaned_data['challenged']
      new_challenge.save()
      msg = 'Challenge sent!'
  else:
    challenge_form = ChallengeForm(challenger=request.user)

  inbound_challenges = models.Challenge.objects.filter(
      challenged=request.user).order_by('-date_time')
  outbound_challenges = models.Challenge.objects.filter(
      challenger=request.user).order_by('-date_time')
 


  return render(request, 'wargame/challenges.html',
               {
                   'challenge_form': challenge_form,
                   'inbound_challenges': inbound_challenges,
                   'outbound_challenges': outbound_challenges,
                   'msg': msg,
                   'error': error_msg
               })


@login_required
@transaction.atomic
def accept_challenge(request, challenge_id):
  challenge = get_object_or_404(models.Challenge, id=challenge_id, challenged=request.user)
  contest = models.Contest.objects.get(name='Challenges')
  try:
    challenger = get_representant(challenge.challenger)
  except models.ShipAi.DoesNotExist:
    return challenges(request, 'Challenger does not have the representant selected!')
  try:
    challenged = get_representant(challenge.challenged)
  except models.ShipAi.DoesNotExist:
    return challenges(request, 'You do not have the representant selected!')
  match = game.run_ranking_match(contest, challenger, challenged)

  challenge.match = match
  challenge.accepted = True
  challenge.save()

  return redirect('challenges')


def get_representant(user):
  return models.ShipAi.objects.get(user=user, representant=True)
