from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['groups'] = [group.name for group in user.groups.all()]
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name

        return token

from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken


# import Custom user from models users app models
from users.models import CustomUser as User

class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        # Call the parent validate method to process the refresh token
        data = super().validate(attrs)

        # Get the refresh token from the request
        refresh = RefreshToken(attrs['refresh'])
        access_token = refresh.access_token

        user = User.objects.get(id=access_token['user_id'])
        # Add custom claims to the access token
        access_token['groups'] = [group.name for group in user.groups.all()]
        access_token['email'] = user.email
        access_token['first_name'] = user.first_name
        access_token['last_name'] = user.last_name
        
        data['access'] = str(access_token)
        return data