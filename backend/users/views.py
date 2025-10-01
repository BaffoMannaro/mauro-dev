from django.shortcuts import render, get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from users.serializer import MyTokenObtainPairSerializer, RegisterSerializer, UserSerializer, FileSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
import json
from users.models import CustomUser
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.views import APIView
from django.db.models import Q
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.models import Group
from rest_framework_simplejwt.views import TokenObtainPairView
from .custom_claims import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenRefreshView
from .custom_claims import CustomTokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

import environ

env = environ.Env()
environ.Env.read_env()



class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = CustomTokenRefreshSerializer


class CustomUserPagination(PageNumberPagination):
    page_size_query_param = 'page_size'
    max_page_size = 100


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = MyTokenObtainPairSerializer.get_token(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class UserListCreateAPIView(generics.ListCreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    pagination_class = CustomUserPagination

    def get_queryset(self):
        queryset = super().get_queryset()

        admin_group = Group.objects.get(name='admin')
        queryset = queryset.exclude(groups=admin_group)

        first_name = self.request.query_params.get('first_name', None)
        last_name = self.request.query_params.get('last_name', None)
        email = self.request.query_params.get('email', None)

        if first_name is not None:
            queryset = queryset.filter(Q(first_name__icontains=first_name))
        if last_name is not None:
            queryset = queryset.filter(Q(last_name__icontains=last_name))
        if email is not None:
            queryset = queryset.filter(Q(email__icontains=email))

        return queryset


class UserRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer





class PasswordResetRequestView(APIView):
    """
    Riceve una richiesta POST con un'email, genera un link per il reset
    della password e lo invia all'utente.
    (Precedentemente era la funzione 'Send')
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            
            reset_link = f"{env('FRONTEND_URL')}/reset-password/?uid={uid}&token={token}"
            email_body = f"Click the following link to reset your password: {reset_link}"
            message = "Password Reset Request"
            from_email = settings.EMAIL_HOST_USER
            
            send_mail(message, email_body, from_email, [email])
            
            return Response({'message': 'If an account with that email exists, a password reset link has been sent.'}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            
            return Response({'message': 'If an account with that email exists, a password reset link has been sent.'}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error sending password reset email: {e}")
            return Response({'error': 'An error occurred while processing your request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasswordResetConfirmView(APIView):
    """
    Riceve uid, token e la nuova password. Verifica il token e, se valido,
    imposta la nuova password per l'utente.
    (Precedentemente era la funzione 'reset_password')
    """
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        confirm_new_password = request.data.get('confirm_new_password')

        if not all([uidb64, token, new_password, confirm_new_password]):
             return Response({'error': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = CustomUser.objects.get(pk=uid)

            if not default_token_generator.check_token(user, token):
                return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
            
            if new_password != confirm_new_password:
                return Response({'error': 'New passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)

        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

