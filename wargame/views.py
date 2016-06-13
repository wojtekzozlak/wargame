from django.contrib.auth import authenticate, login as auth_login, models as auth_models
from django.contrib.auth.decorators import login_required
from django import forms
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render, get_object_or_404

import json
from simulation import main as simulation_main
from wargame.models import ShipAi


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
  player_a = ShipAi.objects.get(user=request.user, id=request.POST.get('player_a'))
  player_b = ShipAi.objects.get(user=request.user, id=request.POST.get('player_b'))
  spec = {
    'maxDurationMs': 30000,
    'players': [{
      'name': 'PlayerA',
      'logic': player_a.logic
    }, {
      'name': 'PlayerB',
      'logic': player_b.logic
    }]
  }
  result = simulation_main.ValidateAndRun(spec)
  return JsonResponse(dict(data=result))

@login_required
def list_ais(request):
  dataset = ShipAi.objects.filter(user=request.user).order_by('id')
  ais = []
  for ai in dataset:
    ais.append({
      'id': ai.id,
      'name': ai.name,
    })
  return JsonResponse(dict(data=ais))

@login_required
def get_ai(request):
  ai_id = request.GET.get('id')
  ai = get_object_or_404(ShipAi, id=ai_id, user=request.user)
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
  ai = ShipAi()
  ai.name = name
  ai.user = request.user
  ai.logic = ''
  ai.save()
  return JsonResponse({
    'data': {
        'id': ai.id
    }
  })

@login_required
def delete_ai(request):
  ai_id = request.POST.get('id')
  ai = get_object_or_404(ShipAi, id=ai_id, user=request.user)
  ai.delete()
  return JsonResponse({})

@login_required
def save_ai_logic(request):
  ai_id = request.POST.get('id')
  name = request.POST.get('name')
  logic = request.POST.get('logic')
  ai = get_object_or_404(ShipAi, id=ai_id, user=request.user)
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

