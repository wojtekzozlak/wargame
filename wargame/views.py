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
      return redirect('post_register')
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
  matching_user = Q(ai_a__user=request.user) | Q(ai_b__user=request.user)
  results_are_public = Q(contest__results_public=True)
  matches = models.Match.objects.filter(
      matching_user & results_are_public).order_by('contest', '-date_time',)

  items = []
  for match in matches:
    if match.ai_a.user != request.user:
      opponent_ai = match.ai_a
      player_ai = match.ai_b
    else:
      opponent_ai = match.ai_b
      player_ai = match.ai_a

    item = {}
    item['id'] = match.id
    item['contest'] = match.contest.name
    item['player_ai_name'] = player_ai.name
    item['opponent_ai_name'] = opponent_ai.name
    item['opponent_name'] = opponent_ai.user.username
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
  ai_query = Q(ai_a__user=request.user) | Q(ai_b__user=request.user)
  match = get_object_or_404(models.Match, ai_query, id=match_id, contest__results_public=True)
  readable_outcome = get_readable_match_outcome(match)
  return render(request, 'wargame/match_replay.html', context=dict(match=match, outcome=readable_outcome))
