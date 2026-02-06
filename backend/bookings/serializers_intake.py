"""
Serializers for Intake Profile API
"""
from rest_framework import serializers
from .models_intake import IntakeProfile, IntakeWellbeingDisclaimer


class IntakeProfileSerializer(serializers.ModelSerializer):
    """Serializer for IntakeProfile with validation"""
    
    is_valid_for_booking = serializers.SerializerMethodField()
    
    class Meta:
        model = IntakeProfile
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'emergency_contact_name',
            'emergency_contact_phone',
            'experience_level',
            'goals',
            'preferences',
            'consent_booking',
            'consent_marketing',
            'consent_privacy',
            'completed',
            'is_valid_for_booking',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'completed', 'created_at', 'updated_at', 'is_valid_for_booking']
    
    def get_is_valid_for_booking(self, obj):
        return obj.is_valid_for_booking()
    
    def validate_email(self, value):
        """Ensure email is unique for new profiles"""
        if self.instance is None:  # Creating new profile
            if IntakeProfile.objects.filter(email=value).exists():
                raise serializers.ValidationError(
                    "An intake profile with this email already exists."
                )
        return value
    
    def validate(self, data):
        """Validate required consents"""
        if not data.get('consent_booking'):
            raise serializers.ValidationError({
                'consent_booking': 'You must consent to booking to proceed.'
            })
        if not data.get('consent_privacy'):
            raise serializers.ValidationError({
                'consent_privacy': 'You must accept the privacy policy to proceed.'
            })
        return data


class IntakeWellbeingDisclaimerSerializer(serializers.ModelSerializer):
    """Serializer for wellbeing disclaimer"""
    
    class Meta:
        model = IntakeWellbeingDisclaimer
        fields = ['id', 'version', 'content', 'active', 'created_at']
        read_only_fields = ['id', 'created_at']
