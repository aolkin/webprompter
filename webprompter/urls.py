from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

from . import views

urlpatterns = patterns(
    '',
    url(r'^$', views.root),

    url(r'^authorized/', views.authorized),
    url(r'^auth-error/', views.auth_error),

    url(r'^save/(.+)', 'prompterscript.views.save'),
    url(r'^load/(.+)?', 'prompterscript.views.load'),

    url(r'', include('social_auth.urls')),

    url(r'^admin/', include(admin.site.urls)),
)
