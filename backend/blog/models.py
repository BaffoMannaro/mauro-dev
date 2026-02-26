from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    """Model representing a category for blog articles"""
    display_name_it = models.CharField(max_length=100, help_text="Display name in Italian")
    display_name_en = models.CharField(max_length=100, help_text="Display name in English")
    
    class Meta:
        ordering = ['display_name_it']
        verbose_name_plural = "Categories"
    
    def __str__(self):
        return f"{self.display_name_it} / {self.display_name_en}"


class Tag(models.Model):
    """Model representing a tag for blog articles"""
    name = models.CharField(max_length=100, unique=True, help_text="Internal tag name (lowercase, no spaces)")
    display_name_it = models.CharField(max_length=100, help_text="Display name in Italian")
    display_name_en = models.CharField(max_length=100, help_text="Display name in English")
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.display_name_it} / {self.display_name_en}"


class Article(models.Model):
    """Model representing a blog article"""
    # Multilingual fields
    title_it = models.CharField(max_length=255, help_text="Article title in Italian")
    title_en = models.CharField(max_length=255, help_text="Article title in English")
    slug = models.SlugField(max_length=255, unique=True, help_text="URL-friendly version of title")
    
    # Meta information for SEO (multilingual)
    meta_title_it = models.CharField(max_length=255, blank=True, help_text="SEO meta title in Italian")
    meta_title_en = models.CharField(max_length=255, blank=True, help_text="SEO meta title in English")
    meta_description_it = models.TextField(max_length=500, blank=True, help_text="SEO meta description in Italian")
    meta_description_en = models.TextField(max_length=500, blank=True, help_text="SEO meta description in English")
    
    # Main image
    main_image = models.ImageField(upload_to='blog/images/', blank=True, null=True, help_text="Main article image")
    
    # Category and Tags
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='articles', help_text="Article category")
    tags = models.ManyToManyField(Tag, blank=True, related_name='articles', help_text="Article tags")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Publishing
    is_published = models.BooleanField(default=False, help_text="Whether the article is published")
    published_at = models.DateTimeField(null=True, blank=True, help_text="Publication date")
    
    class Meta:
        ordering = ['-created_at']
        # Ensure unique titles per language
        constraints = [
            models.UniqueConstraint(fields=['title_it'], name='unique_title_it'),
            models.UniqueConstraint(fields=['title_en'], name='unique_title_en'),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-generate slug from Italian title if not provided
        if not self.slug and self.title_it:
            self.slug = slugify(self.title_it)
        # Auto-fill meta titles if empty
        if not self.meta_title_it and self.title_it:
            self.meta_title_it = self.title_it
        if not self.meta_title_en and self.title_en:
            self.meta_title_en = self.title_en
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.title_it} / {self.title_en}"


class Block(models.Model):
    """Model representing a content block within an article"""
    BLOCK_TYPE_CHOICES = [
        ('text', 'Text (HTML)'),
        ('image', 'Image'),
    ]
    
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='blocks', help_text="Article this block belongs to")
    block_type = models.CharField(max_length=10, choices=BLOCK_TYPE_CHOICES, help_text="Type of content block")
    
    # Multilingual content for text blocks
    content_it = models.TextField(blank=True, help_text="HTML content in Italian (for text blocks)")
    content_en = models.TextField(blank=True, help_text="HTML content in English (for text blocks)")
    
    # Image for image blocks
    image = models.ImageField(upload_to='blog/blocks/', blank=True, null=True, help_text="Image file (for image blocks)")
    order = models.PositiveIntegerField(default=0, help_text="Order of the block in the article")
    
    class Meta:
        ordering = ['order']
        unique_together = ['article', 'order']
    
    def __str__(self):
        return f"{self.article.title_it} - Block {self.order} ({self.block_type})"
