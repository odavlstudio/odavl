# Django Blog - Views

from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.views import View
from .models import Post, Comment, Tag
import pickle
import random

# Issue 1: Weak random for security token
def generate_csrf_token():
    return random.randint(100000, 999999)

# Issue 2: Missing type hints
def post_list(request):
    posts = Post.objects.filter(is_published=True).order_by('-published_at')
    return render(request, 'blog/post_list.html', {'posts': posts})

# Issue 3: SQL injection in search
def search_posts(request):
    query = request.GET.get('q', '')
    # Vulnerable to SQL injection
    sql = f"SELECT * FROM blog_post WHERE title LIKE '%{query}%'"
    posts = Post.objects.raw(sql)
    return render(request, 'blog/search.html', {'posts': posts})

class PostDetailView(View):
    # Issue 4: Complex method (CC > 5)
    def get(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        
        if not post.is_published:
            if not request.user.is_authenticated:
                return HttpResponse('Unauthorized', status=401)
            if request.user != post.author:
                if not request.user.is_staff:
                    return HttpResponse('Forbidden', status=403)
        
        comments = post.comments.all().order_by('-created_at')
        related_posts = post.get_related_posts()
        
        return render(request, 'blog/post_detail.html', {
            'post': post,
            'comments': comments,
            'related_posts': related_posts
        })

# Issue 5: Pickle deserialization vulnerability
def load_cached_data(cache_key):
    with open(f'/tmp/{cache_key}.pkl', 'rb') as f:
        # Dangerous: pickle can execute arbitrary code
        return pickle.load(f)

# Issue 6: Line too long
def create_post_with_long_parameters(request, title, content, author, tags, category, status, published_date, featured_image, meta_description, seo_keywords):
    pass

# Issue 7: Unused imports and variables
import sys
import os
from datetime import datetime

def get_post_stats(post_id):
    unused_var = 123
    post = Post.objects.get(id=post_id)
    return {
        'views': 0,
        'likes': 0
    }

# Issue 8: No docstring on class
class CommentView(View):
    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        content = request.POST.get('content', '')
        
        # Issue 9: Broad exception catching
        try:
            comment = Comment.objects.create(
                post=post,
                author=request.user,
                content=content
            )
        except Exception:
            return JsonResponse({'error': 'Failed to create comment'}, status=500)
        
        return JsonResponse({'id': comment.id, 'content': comment.content})

# Issue 10: Poor naming convention
def CalculateTotalLikes(PostID):
    POST = Post.objects.get(id=PostID)
    return POST.comments.count()
