from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.decorators import login_required
from django import forms
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render, get_object_or_404
from wargame.models import ShipAi


class LoginForm(forms.Form):
  user = forms.CharField(label='user', max_length=100)
  password = forms.CharField(label='password', widget=forms.PasswordInput())


def login(request):
  if request.method == 'POST':
    form = LoginForm(request.POST)
    if form.is_valid():
      user = authenticate(username=form.cleaned_data['user'],
                          password=form.cleaned_data['password'])
      if user is not None:
        auth_login(request, user)
        return redirect(to='workspace')
  else:
    form = LoginForm()

  return render(request, 'wargame/login.html' , {'form': form})


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
