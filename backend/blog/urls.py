from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, TagViewSet, ArticleViewSet, BlockViewSet


router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'articles', ArticleViewSet, basename='article')
router.register(r'blocks', BlockViewSet, basename='block')

urlpatterns = [
    path('', include(router.urls)),
]
