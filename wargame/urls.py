"""wargame URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.9/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include
from django.contrib import admin
from wargame import views

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^api/add_ai', views.add_ai, name='add_ai'),
    url(r'^api/delete_ai', views.delete_ai, name='delete_ai'),
    url(r'^api/get_ai', views.get_ai, name='get_ai'),
    url(r'^api/list_ais', views.list_ais, name='list_ais'),
    url(r'^api/run_match', views.run_match, name='run_match'),
    url(r'^api/save_ai_logic', views.save_ai_logic, name='save_ai_logic'),
    url(r'^accounts/register', views.register, name='register'),
    url(r'^accounts/post_register', views.post_register, name='post_register'),
    url(r'^accounts/', include('django.contrib.auth.urls')),
    url(r'^help', views.help, name='help'),
    url(r'^$', views.workspace, name='workspace'),
]
