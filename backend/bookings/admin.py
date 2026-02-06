from django.contrib import admin
from django.http import HttpResponse
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db.models import Count, Q, Sum
import csv
from datetime import datetime, timedelta
from .models import Service, Staff, Client, Booking, BusinessHours, StaffSchedule, Closure, StaffLeave, Session


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'duration_minutes', 'price', 'active', 'created_at']
    list_filter = ['active', 'created_at']
    search_fields = ['name', 'description']


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'active', 'created_at']
    list_filter = ['active', 'created_at']
    search_fields = ['name', 'email']
    filter_horizontal = ['services']


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'total_bookings', 'total_spent', 'last_booking', 'created_at']
    search_fields = ['name', 'email', 'phone']
    list_filter = ['created_at']
    actions = ['export_clients_csv']
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            _booking_count=Count('bookings', filter=Q(bookings__status__in=['confirmed', 'completed'])),
            _total_spent=Sum('bookings__service__price', filter=Q(bookings__status__in=['confirmed', 'completed']))
        )
        return queryset
    
    def total_bookings(self, obj):
        return obj._booking_count
    total_bookings.admin_order_field = '_booking_count'
    total_bookings.short_description = 'Total Bookings'
    
    def total_spent(self, obj):
        return f"£{obj._total_spent or 0:.2f}"
    total_spent.admin_order_field = '_total_spent'
    total_spent.short_description = 'Total Spent'
    
    def last_booking(self, obj):
        last = obj.bookings.filter(status__in=['confirmed', 'completed']).order_by('-start_time').first()
        return last.start_time.strftime('%Y-%m-%d') if last else 'Never'
    last_booking.short_description = 'Last Booking'
    
    def export_clients_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="clients_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Name', 'Email', 'Phone', 'Total Bookings', 'Total Spent', 'Services Used', 'Last Booking', 'Created'])
        
        for client in queryset:
            bookings = client.bookings.filter(status__in=['confirmed', 'completed'])
            total_bookings = bookings.count()
            total_spent = sum(b.service.price for b in bookings)
            services = ', '.join(set(b.service.name for b in bookings))
            last_booking = bookings.order_by('-start_time').first()
            last_booking_date = last_booking.start_time.strftime('%Y-%m-%d') if last_booking else 'Never'
            
            writer.writerow([
                client.name,
                client.email,
                client.phone,
                total_bookings,
                f"£{total_spent:.2f}",
                services,
                last_booking_date,
                client.created_at.strftime('%Y-%m-%d')
            ])
        
        return response
    export_clients_csv.short_description = 'Export selected clients to CSV'


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['client', 'service', 'staff', 'start_time', 'end_time', 'status', 'price', 'created_at']
    list_filter = ['status', 'start_time', 'staff', 'service']
    search_fields = ['client__name', 'client__email', 'notes']
    date_hierarchy = 'start_time'
    readonly_fields = ['created_at', 'updated_at']
    actions = ['export_bookings_csv', 'mark_as_completed', 'mark_as_cancelled']
    
    def price(self, obj):
        return f"£{obj.service.price}"
    price.short_description = 'Price'
    
    def export_bookings_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="bookings_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Booking ID', 'Client Name', 'Client Email', 'Client Phone', 'Service', 'Staff', 'Date', 'Start Time', 'End Time', 'Duration', 'Price', 'Status', 'Notes', 'Created'])
        
        for booking in queryset:
            writer.writerow([
                booking.id,
                booking.client.name,
                booking.client.email,
                booking.client.phone,
                booking.service.name,
                booking.staff.name,
                booking.start_time.strftime('%Y-%m-%d'),
                booking.start_time.strftime('%H:%M'),
                booking.end_time.strftime('%H:%M'),
                f"{booking.service.duration_minutes} min",
                f"£{booking.service.price}",
                booking.status,
                booking.notes,
                booking.created_at.strftime('%Y-%m-%d %H:%M')
            ])
        
        return response
    export_bookings_csv.short_description = 'Export selected bookings to CSV'
    
    def mark_as_completed(self, request, queryset):
        updated = queryset.update(status='completed')
        self.message_user(request, f'{updated} booking(s) marked as completed.')
    mark_as_completed.short_description = 'Mark selected as completed'
    
    def mark_as_cancelled(self, request, queryset):
        updated = queryset.update(status='cancelled')
        self.message_user(request, f'{updated} booking(s) marked as cancelled.')
    mark_as_cancelled.short_description = 'Mark selected as cancelled'


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'start_time', 'capacity', 'enrollment_count', 'active', 'created_at']
    list_filter = ['active', 'start_time', 'staff']
    search_fields = ['title', 'description']
    filter_horizontal = ['enrolled_clients']
    readonly_fields = ['enrollment_count', 'is_full', 'available_spots', 'created_at', 'updated_at']


@admin.register(BusinessHours)
class BusinessHoursAdmin(admin.ModelAdmin):
    list_display = ['day_name', 'is_open', 'open_time', 'close_time']
    list_editable = ['is_open', 'open_time', 'close_time']
    ordering = ['day_of_week']
    
    def day_name(self, obj):
        return dict(BusinessHours.DAYS_OF_WEEK)[obj.day_of_week]
    day_name.short_description = 'Day'


@admin.register(StaffSchedule)
class StaffScheduleAdmin(admin.ModelAdmin):
    list_display = ['staff', 'day_name', 'is_working', 'start_time', 'end_time']
    list_filter = ['staff', 'day_of_week', 'is_working']
    list_editable = ['is_working', 'start_time', 'end_time']
    ordering = ['staff', 'day_of_week']
    
    def day_name(self, obj):
        return dict(StaffSchedule.DAYS_OF_WEEK)[obj.day_of_week]
    day_name.short_description = 'Day'


@admin.register(Closure)
class ClosureAdmin(admin.ModelAdmin):
    list_display = ['date', 'reason', 'all_day', 'start_time', 'end_time']
    list_filter = ['all_day', 'date']
    date_hierarchy = 'date'
    ordering = ['-date']


@admin.register(StaffLeave)
class StaffLeaveAdmin(admin.ModelAdmin):
    list_display = ['staff', 'start_date', 'end_date', 'reason']
    list_filter = ['staff', 'start_date']
    date_hierarchy = 'start_date'
    ordering = ['-start_date']
