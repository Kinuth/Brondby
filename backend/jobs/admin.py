from django.contrib import admin
from .models import Client, ServiceType, Job, JobStatusLog, JobAttachment

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'company_name', 'email', 'phone', 'created_at')
    search_fields = ('name', 'company_name', 'email', 'phone')
    list_filter = ('created_at',)
    ordering = ('-created_at',)


@admin.register(ServiceType)
class ServiceTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')
    search_fields = ('name', 'description')
    list_filter = ('is_active',)
    ordering = ('name',)


class JobStatusLogInLine(admin.TabularInline):
    model = JobStatusLog
    extra = 0
    readonly_fields = ('changed_by', 'old_status', 'new_status', 'note', 'timestamp')
    can_delete = False


class JobAttachmentInLine(admin.TabularInline):
    model = JobAttachment
    extra = 0
    readonly_fields = ('uploaded_by', 'file_name', 'file_size', 'created_at')


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'service_type', 'assigned_worker', 'status', 'due_date', 'created_at')
    list_filter = ('status', 'service_type', 'due_date', 'created_at')
    search_fields = ('client__name', 'client__company_name', 'description', 'notes')
    ordering = ('-created_at',)
    inlines = [JobStatusLogInLine, JobAttachmentInLine]


@admin.register(JobStatusLog)
class JobStatusLogAdmin(admin.ModelAdmin):
    list_display = ('job', 'changed_by', 'old_status', 'new_status', 'timestamp')
    list_filter = ('old_status', 'new_status', 'timestamp')
    search_fields = ('job__id', 'note', 'changed_by__username')
    ordering = ('-timestamp',)


@admin.register(JobAttachment)
class JobAttachmentAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'job', 'file_size', 'uploaded_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('file_name', 'description', 'job__id')
    ordering = ('-created_at',)
