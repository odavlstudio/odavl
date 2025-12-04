# Django Blog - Models (Real-world example with intentional issues)

from django.db import models
from django.contrib.auth.models import User
import os

# Issue 1: Missing type hints
def get_user_posts(user_id):
    # Issue 2: SQL injection vulnerability (f-string in raw query)
    query = f"SELECT * FROM blog_post WHERE user_id = {user_id}"
    return models.Post.objects.raw(query)

# Issue 3: Complex function (CC > 5)
def validate_post_data(title, content, author, tags, category, status, published_date, featured_image):
    if not title:
        return False
    if len(title) < 5:
        return False
    if len(title) > 200:
        return False
    if not content:
        return False
    if len(content) < 100:
        return False
    if not author:
        return False
    if not isinstance(tags, list):
        return False
    if not category:
        return False
    if status not in ['draft', 'published', 'archived']:
        return False
    if not published_date:
        return False
    return True

class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    is_published = models.BooleanField(default=False)
    
    # Issue 4: Line too long
    tags = models.ManyToManyField('Tag', related_name='posts', blank=True, help_text='Add relevant tags for better discoverability and organization')
    
    # Issue 5: Unused variable
    def get_related_posts(self):
        unused_count = 5
        return Post.objects.filter(tags__in=self.tags.all()).exclude(id=self.id)[:3]
    
    # Issue 6: Broad exception catching
    def publish(self):
        try:
            self.is_published = True
            self.save()
        except:
            pass
    
    def __str__(self):
        return self.title

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Issue 7: Missing type hints on method
    def approve(self, admin_user):
        # Issue 8: Potential command injection
        os.system(f"echo 'Comment {self.id} approved by {admin_user}'")
        return True

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    
    def __str__(self):
        return self.name

# Issue 9: Unsorted imports (should be at top)
import json
import datetime

# Issue 10: Missing docstrings on functions
def serialize_post(post):
    return {
        'title': post.title,
        'content': post.content,
        'author': post.author.username
    }
