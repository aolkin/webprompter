from django.conf.urls import patterns, include, url
from django.http import HttpResponse

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

from . import views

def googleverify(request,extra):
    return HttpResponse("google-site-verification: google{}.html".format(extra))

urlpatterns = patterns(
    '',
    url(r'^$', views.root),
    url(r'^google([a-z0-9]{16}).html$', googleverify),

    url(r'^authorized/', views.authorized),
    url(r'^auth-error/', views.auth_error),

    url(r'^save/(.+)', 'prompterscript.views.save'),
    url(r'^load/(.+)?', 'prompterscript.views.load'),

    url(r'', include('social_auth.urls')),

    url(r'^admin/', include(admin.site.urls)),
)
