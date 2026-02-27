import json
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.exceptions import ValidationError

from .models import Category, Tag, Article, Block
from .serializers import (
    CategorySerializer,
    TagSerializer,
    ArticleListSerializer,
    ArticleDetailSerializer,
    ArticleCreateUpdateSerializer,
    BlockSerializer
)

MAX_UPLOAD_SIZE = 15 * 1024 * 1024

def _validate_upload(f, name="file"):
    if f.size > MAX_UPLOAD_SIZE:
        raise ValidationError({name: "La dimensione massima del file è 15 MB."})

class ArticlePagination(PageNumberPagination):
    """Custom pagination class for articles that allows page_size parameter"""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing categories
    
    Permissions:
    - GET requests: Public (no authentication required)
    - POST, PUT, PATCH, DELETE: Requires JWT authentication
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['display_name_it', 'display_name_en']
    ordering_fields = ['display_name_it', 'display_name_en']


class TagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tags
    
    Permissions:
    - GET requests: Public (no authentication required)
    - POST, PUT, PATCH, DELETE: Requires JWT authentication
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'display_name_it', 'display_name_en']
    ordering_fields = ['name', 'display_name_it', 'display_name_en']


class ArticleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing articles
    
    Permissions:
    - GET requests: Public (no authentication required)
      * Unauthenticated users see only published articles
      * Authenticated users see all articles
    - POST, PUT, PATCH, DELETE: Requires JWT authentication
    """
    queryset = Article.objects.prefetch_related('category', 'tags', 'blocks').all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = ArticlePagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_published', 'category', 'tags']
    search_fields = ['title_it', 'title_en', 'slug', 'meta_title_it', 'meta_title_en', 'meta_description_it', 'meta_description_en']
    ordering_fields = ['created_at', 'published_at', 'title_it', 'title_en']
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ArticleListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ArticleCreateUpdateSerializer
        return ArticleDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # If user is not authenticated, show only published articles
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(is_published=True)
        return queryset
    
    @action(detail=False, methods=['get'])
    def published(self, request):
        """Get only published articles"""
        queryset = self.get_queryset().filter(is_published=True).order_by('-published_at')
        queryset = self.filter_queryset(queryset)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ArticleListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ArticleListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def by_slug(self, request, slug=None):
        """Get article by slug"""
        article = self.get_object()
        serializer = ArticleDetailSerializer(article)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def suggested(self, request):
        """Get suggested articles by category"""
        category_id = request.query_params.get('category', None)
        exclude_slug = request.query_params.get('exclude_slug', None)
        
        if not category_id:
            return Response({'error': 'category parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.get_queryset().filter(
            is_published=True,
            category_id=category_id
        ).order_by('-published_at')[:12]
        
        # Exclude current article if slug provided
        if exclude_slug:
            queryset = queryset.exclude(slug=exclude_slug)
        
        serializer = ArticleListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Custom create to handle block images from FormData"""
        # Estrai i blocchi dal JSON
        blocks_json = request.data.get('blocks', '[]')
        blocks_data = json.loads(blocks_json) if isinstance(blocks_json, str) else blocks_json

        # Validate uploads (main_image + block_image_*)
        for key, f in request.FILES.items():
            if key == "main_image" or key.startswith("block_image_"):
                _validate_upload(f, key)

        # Collect block images from FILES
        block_images = {}
        for key in request.FILES.keys():
            if key.startswith('block_image_'):
                idx = key.replace('block_image_', '')
                block_images[int(idx)] = request.FILES[key]
        
        # Build article_data manually to avoid deep copying file objects
        # Skip 'blocks' and 'block_image_*' fields
        article_data = {}
        for key in request.data.keys():
            if key != 'blocks' and not key.startswith('block_image_'):
                # Use getlist for fields that expect multiple values
                if key == 'tags':
                    article_data[key] = request.data.getlist(key)
                else:
                    article_data[key] = request.data[key]
        
        # Add main_image from FILES if present
        if 'main_image' in request.FILES:
            article_data['main_image'] = request.FILES['main_image']
        
        # Crea l'articolo
        serializer = self.get_serializer(data=article_data)
        serializer.is_valid(raise_exception=True)
        article = serializer.save()
        
        # Crea i blocchi con le loro immagini
        for idx, block_data in enumerate(blocks_data):
            block = Block.objects.create(
                article=article,
                block_type=block_data['block_type'],
                content_it=block_data.get('content_it', ''),
                content_en=block_data.get('content_en', ''),
                order=block_data['order']
            )
            if idx in block_images:
                block.image = block_images[idx]
                block.save()
        
        # Restituisci la risposta con l'articolo completo
        output_serializer = ArticleDetailSerializer(article)
        headers = self.get_success_headers(output_serializer.data)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Custom update to handle block images from FormData"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Estrai i blocchi dal JSON
        blocks_json = request.data.get('blocks', '[]')
        blocks_data = json.loads(blocks_json) if isinstance(blocks_json, str) else blocks_json

        # Validate uploads (main_image + block_image_*)
        for key, f in request.FILES.items():
            if key == "main_image" or key.startswith("block_image_"):
                _validate_upload(f, key)

        # Collect block images from FILES
        block_images = {}
        for key in request.FILES.keys():
            if key.startswith('block_image_'):
                idx = key.replace('block_image_', '')
                block_images[int(idx)] = request.FILES[key]
        
        # Build article_data manually to avoid deep copying file objects
        # Skip 'blocks' and 'block_image_*' fields
        article_data = {}
        for key in request.data.keys():
            if key != 'blocks' and not key.startswith('block_image_'):
                # Use getlist for fields that expect multiple values
                if key == 'tags':
                    article_data[key] = request.data.getlist(key)
                else:
                    article_data[key] = request.data[key]
        
        # Add main_image from FILES if present
        if 'main_image' in request.FILES:
            article_data['main_image'] = request.FILES['main_image']
        
        # Aggiorna l'articolo
        serializer = self.get_serializer(instance, data=article_data, partial=partial)
        serializer.is_valid(raise_exception=True)
        article = serializer.save()
        
        # Elimina i blocchi esistenti
        instance.blocks.all().delete()
        
        # Crea i nuovi blocchi con le loro immagini
        for idx, block_data in enumerate(blocks_data):
            block = Block.objects.create(
                article=article,
                block_type=block_data['block_type'],
                content_it=block_data.get('content_it', ''),
                content_en=block_data.get('content_en', ''),
                order=block_data['order']
            )
            if idx in block_images:
                block.image = block_images[idx]
                block.save()
        
        # Restituisci la risposta con l'articolo completo
        output_serializer = ArticleDetailSerializer(article)
        return Response(output_serializer.data)


class BlockViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing blocks
    
    Permissions:
    - GET requests: Public (no authentication required)
    - POST, PUT, PATCH, DELETE: Requires JWT authentication
    """
    queryset = Block.objects.all()
    serializer_class = BlockSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['article', 'block_type']
    ordering_fields = ['order']
