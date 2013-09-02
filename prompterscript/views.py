from django.http import *

import json, datetime

from .models import Script

def jsonEncoder(obj):
    if isinstance(obj,datetime.datetime):
        return obj.ctime()
    else:
        return obj

def save(request):
    if not request.user.is_authenticated():
        return HttpResponseForbidden()
    return ""

def load(request,name=None):
    if not request.user.is_authenticated():
        return HttpResponseForbidden()
    if not name:
        return HttpResponse(json.dumps(list(Script.objects.filter(owner=request.user)
                                            .values("name","modified")),default=jsonEncoder),
                            content_type="application/json")
    try:
        return HttpResponse(Script.objects.get(owner=request.user,name=name).contents,
                            content_type="application/json")
    except Script.DoesNotExist as err:
        return HttpResponseNotFound()
