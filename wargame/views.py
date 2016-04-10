from django.http import HttpResponse
from django.shortcuts import render

def workspace(request):
  return render(request, 'wargame/workspace.html')
