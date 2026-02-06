"""
API Views for Intake Profile
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models_intake import IntakeProfile, IntakeWellbeingDisclaimer
from .serializers_intake import IntakeProfileSerializer, IntakeWellbeingDisclaimerSerializer


class IntakeProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for IntakeProfile
    
    Endpoints:
    - GET /api/intake/ - List all profiles (admin)
    - POST /api/intake/ - Create new profile
    - GET /api/intake/{id}/ - Retrieve profile
    - PUT /api/intake/{id}/ - Update profile
    - GET /api/intake/status/?email=x - Check if email has completed intake
    """
    queryset = IntakeProfile.objects.all()
    serializer_class = IntakeProfileSerializer
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """
        Check intake status by email
        GET /api/intake/status/?email=user@example.com
        
        Returns:
        - exists: boolean
        - completed: boolean
        - profile_id: int (if exists)
        - is_valid_for_booking: boolean
        """
        email = request.query_params.get('email')
        
        if not email:
            return Response(
                {'error': 'Email parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            profile = IntakeProfile.objects.get(email=email)
            return Response({
                'exists': True,
                'completed': profile.completed,
                'profile_id': profile.id,
                'is_valid_for_booking': profile.is_valid_for_booking(),
            })
        except IntakeProfile.DoesNotExist:
            return Response({
                'exists': False,
                'completed': False,
                'profile_id': None,
                'is_valid_for_booking': False,
            })
    
    @action(detail=False, methods=['get'])
    def by_email(self, request):
        """
        Get full profile by email
        GET /api/intake/by_email/?email=user@example.com
        """
        email = request.query_params.get('email')
        
        if not email:
            return Response(
                {'error': 'Email parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        profile = get_object_or_404(IntakeProfile, email=email)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)


class IntakeWellbeingDisclaimerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Wellbeing Disclaimer (read-only for public)
    
    Endpoints:
    - GET /api/intake-disclaimer/ - List disclaimers
    - GET /api/intake-disclaimer/active/ - Get active disclaimer
    """
    queryset = IntakeWellbeingDisclaimer.objects.all()
    serializer_class = IntakeWellbeingDisclaimerSerializer
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the currently active disclaimer"""
        try:
            disclaimer = IntakeWellbeingDisclaimer.objects.get(active=True)
            serializer = self.get_serializer(disclaimer)
            return Response(serializer.data)
        except IntakeWellbeingDisclaimer.DoesNotExist:
            return Response(
                {'error': 'No active disclaimer found'},
                status=status.HTTP_404_NOT_FOUND
            )
