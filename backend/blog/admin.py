from django.contrib import admin
from .models import Category, Tag, Article, Block


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'display_name_it', 'display_name_en')
    search_fields = ('display_name_it', 'display_name_en')


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'display_name_it', 'display_name_en')
    search_fields = ('name', 'display_name_it', 'display_name_en')


class BlockInline(admin.TabularInline):
    model = Block
    extra = 1
    fields = ('block_type', 'content_it', 'content_en', 'image', 'order')


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title_it', 'title_en', 'slug', 'category', 'is_published', 'created_at', 'published_at')
    list_filter = ('is_published', 'category', 'created_at', 'published_at')
    search_fields = ('title_it', 'title_en', 'slug', 'meta_title_it', 'meta_title_en')
    prepopulated_fields = {'slug': ('title_it',)}
    filter_horizontal = ('tags',)
    date_hierarchy = 'created_at'
    inlines = [BlockInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (('title_it', 'title_en'), 'slug', 'main_image')
        }),
        ('SEO', {
            'fields': (('meta_title_it', 'meta_title_en'), ('meta_description_it', 'meta_description_en'))
        }),
        ('Category and Tags', {
            'fields': ('category', 'tags')
        }),
        ('Publishing', {
            'fields': ('is_published', 'published_at')
        }),
    )


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ('article', 'block_type', 'order')
    list_filter = ('block_type', 'article')
    search_fields = ('article__title_it', 'article__title_en', 'content_it', 'content_en')
