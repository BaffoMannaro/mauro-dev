from rest_framework import serializers
from django.conf import settings
from .models import Category, Tag, Article, Block

MAX_UPLOAD_SIZE = 15 * 1024 * 1024

class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model with nested i18n structure"""
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'display_name']
    
    def get_display_name(self, obj):
        """Return display_name as nested object with it/en"""
        return {
            'it': obj.display_name_it,
            'en': obj.display_name_en
        }
    
    def to_internal_value(self, data):
        """Handle input data: accept both nested and flat structure"""
        # If display_name is an object with it/en, flatten it
        if 'display_name' in data and isinstance(data['display_name'], dict):
            display_name = data['display_name']
            data = data.copy()
            data['display_name_it'] = display_name.get('it', '')
            data['display_name_en'] = display_name.get('en', '')
            del data['display_name']
        
        internal = {}
        internal['display_name_it'] = data.get('display_name_it', '')
        internal['display_name_en'] = data.get('display_name_en', '')
        
        return internal


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model with nested i18n structure"""
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'display_name']
    
    def get_display_name(self, obj):
        """Return display_name as nested object with it/en"""
        return {
            'it': obj.display_name_it,
            'en': obj.display_name_en
        }
    
    def to_internal_value(self, data):
        """Handle input data: accept both nested and flat structure"""
        # If display_name is an object with it/en, flatten it
        if 'display_name' in data and isinstance(data['display_name'], dict):
            display_name = data['display_name']
            data = data.copy()
            data['display_name_it'] = display_name.get('it', '')
            data['display_name_en'] = display_name.get('en', '')
            del data['display_name']
        
        # Call parent's to_internal_value with the base fields
        internal = {}
        internal['name'] = data.get('name')
        internal['display_name_it'] = data.get('display_name_it', '')
        internal['display_name_en'] = data.get('display_name_en', '')
        
        return internal


class BlockSerializer(serializers.ModelSerializer):
    """Serializer for Block model with nested i18n for text blocks"""
    content = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Block
        fields = ['id', 'block_type', 'content', 'image', 'order']
    
    def get_content(self, obj):
        """Return content based on block type"""
        if obj.block_type == 'text':
            return {
                'it': obj.content_it,
                'en': obj.content_en
            }
        else:
            # For image blocks, return empty strings
            return {
                'it': '',
                'en': ''
            }
    
    def get_image(self, obj):
        """Return relative URL for image"""
        if obj.image:
            return f"{settings.MEDIA_URL}{obj.image.name}"
        return None
    
    def to_internal_value(self, data):
        """Handle input data: accept both nested and flat structure"""
        # If content is an object with it/en, flatten it
        if 'content' in data and isinstance(data['content'], dict):
            content = data['content']
            data = data.copy()
            data['content_it'] = content.get('it', '')
            data['content_en'] = content.get('en', '')
            del data['content']
        
        internal = {}
        internal['block_type'] = data.get('block_type')
        internal['content_it'] = data.get('content_it', '')
        internal['content_en'] = data.get('content_en', '')
        internal['order'] = data.get('order', 0)
        
        # Handle image if present
        if 'image' in data:
            internal['image'] = data['image']
        
        return internal


class ArticleListSerializer(serializers.ModelSerializer):
    """Serializer for Article list view with nested i18n"""
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    title = serializers.SerializerMethodField()
    meta_title = serializers.SerializerMethodField()
    meta_description = serializers.SerializerMethodField()
    main_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'meta_title', 'meta_description',
            'main_image', 'category', 'tags', 'created_at', 'published_at', 'is_published',
        ]

    def get_main_image(self, obj):
        """Return relative URL for main_image"""
        if obj.main_image:
            return f"{settings.MEDIA_URL}{obj.main_image.name}"
        return None
    
    def get_title(self, obj):
        return {'it': obj.title_it, 'en': obj.title_en}
    
    def get_meta_title(self, obj):
        return {'it': obj.meta_title_it, 'en': obj.meta_title_en}
    
    def get_meta_description(self, obj):
        return {'it': obj.meta_description_it, 'en': obj.meta_description_en}


class ArticleDetailSerializer(serializers.ModelSerializer):
    """Serializer for Article detail view with blocks and nested i18n"""
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    blocks = BlockSerializer(many=True, read_only=True)
    title = serializers.SerializerMethodField()
    meta_title = serializers.SerializerMethodField()
    meta_description = serializers.SerializerMethodField()
    main_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'meta_title', 'meta_description',
            'main_image', 'category', 'tags', 'created_at', 
            'updated_at', 'published_at', 'is_published', 'blocks'
        ]
    
    def get_main_image(self, obj):
        """Return relative URL for main_image"""
        if obj.main_image:
            return f"{settings.MEDIA_URL}{obj.main_image.name}"
        return None
    
    def get_title(self, obj):
        return {'it': obj.title_it, 'en': obj.title_en}
    
    def get_meta_title(self, obj):
        return {'it': obj.meta_title_it, 'en': obj.meta_title_en}
    
    def get_meta_description(self, obj):
        return {'it': obj.meta_description_it, 'en': obj.meta_description_en}


class ArticleCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating articles with i18n support"""
    blocks = BlockSerializer(many=True, required=False)
    
    class Meta:
        model = Article
        fields = [
            'id', 'title_it', 'title_en', 'slug', 
            'meta_title_it', 'meta_title_en',
            'meta_description_it', 'meta_description_en',
            'main_image', 'category', 'tags', 'is_published',
            'published_at', 'blocks'
        ]
    
    def validate(self, data):
        """Ensure both languages are provided for required fields"""
        # Validate title
        title_it = data.get('title_it', '')
        title_en = data.get('title_en', '')
        
        if not title_it or not title_en:
            raise serializers.ValidationError({
                'title': 'Both Italian and English titles are required'
            })
        
        # Validate blocks if present
        blocks = data.get('blocks', [])
        for i, block in enumerate(blocks):
            if block.get('block_type') == 'text':
                content_it = block.get('content_it', '')
                content_en = block.get('content_en', '')
                if not content_it or not content_en:
                    raise serializers.ValidationError({
                        f'blocks[{i}].content': 'Both Italian and English content are required for text blocks'
                    })
        
        return data
    
    def create(self, validated_data):
        blocks_data = validated_data.pop('blocks', [])
        tags = validated_data.pop('tags', [])
        
        article = Article.objects.create(**validated_data)
        article.tags.set(tags)
        
        for block_data in blocks_data:
            Block.objects.create(article=article, **block_data)
        
        return article
    
    def update(self, instance, validated_data):
        blocks_data = validated_data.pop('blocks', None)
        tags = validated_data.pop('tags', None)
        
        # Update article fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update tags if provided
        if tags is not None:
            instance.tags.set(tags)
        
        # Update blocks if provided
        if blocks_data is not None:
            # Delete existing blocks and create new ones
            instance.blocks.all().delete()
            for block_data in blocks_data:
                Block.objects.create(article=instance, **block_data)
        
        return instance

    def validate_main_image(self, f):
        if f and f.size > MAX_UPLOAD_SIZE:
            raise serializers.ValidationError("Max file size is 15 MB.")
        return f
