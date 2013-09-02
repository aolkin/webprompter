from django.db import models
from django.contrib import admin

from django.contrib.auth.models import User

class Script(models.Model):
    owner = models.ForeignKey(User)
    name = models.CharField(max_length=150)
    modified = models.DateTimeField(auto_now=True)
    contents = models.TextField()
    public_id = models.CharField(max_length=20,blank=True)

    def __str__(self):
        return self.name

class ScriptAdmin(admin.ModelAdmin):
    list_display = ("name","owner","public_id","modified")

admin.site.register(Script,ScriptAdmin)
