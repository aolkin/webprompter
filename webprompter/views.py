from django.http import *
from django.shortcuts import render_to_response
from django.contrib.auth import logout

import os,httplib2
from django.conf import settings

def root(request):
    return render_to_response("index.html",{
            "is_auth": "true" if request.user.is_authenticated() else "false",
            "username": request.user.email if request.user.is_authenticated() else "" })

def authorized(request):
    return HttpResponse("""<script>opener.isAuthenticated=true;window.close();</script>"""+
                        """You may close this window now, or click <a href="/">here</a>.""")

def auth_error(request):
    logout(request)
    return HttpResponse("""<script>opener.isAuthenticated=false;window.close();</script>"""+
                        """You may close this window now, or click <a href="/">here</a>.""")
