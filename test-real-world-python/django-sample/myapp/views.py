"""
Django Views - More Intentional Issues
"""
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, JsonResponse
from .models import Product, Order
import pickle
import subprocess

# Missing type hints on function parameters and return
def product_list(request):
    products = Product.objects.all()
    return render(request, 'products/list.html', {'products': products})

# SQL Injection via ORM misuse
def search_products(request):
    search_term = request.GET.get('q', '')
    # Dangerous: raw SQL with user input
    products = Product.objects.raw(f"SELECT * FROM products WHERE name LIKE '%{search_term}%'")
    return render(request, 'products/search.html', {'products': products})

# Command injection
def export_data(request):
    filename = request.GET.get('filename', 'export.csv')
    # Dangerous: command injection
    subprocess.call(f"python manage.py dumpdata > {filename}", shell=True)
    return HttpResponse("Export complete")

# Pickle deserialization (insecure)
def load_user_data(request):
    data_file = request.GET.get('file')
    with open(data_file, 'rb') as f:
        # Dangerous: pickle can execute arbitrary code
        user_data = pickle.load(f)
    return JsonResponse(user_data)

# Missing CSRF protection
def update_profile(request):
    # Should use @csrf_protect or check manually
    user_id = request.POST.get('user_id')
    new_email = request.POST.get('email')
    # Direct database update without validation
    from django.db import connection
    cursor = connection.cursor()
    cursor.execute(f"UPDATE users SET email = '{new_email}' WHERE id = {user_id}")
    return HttpResponse("Profile updated")

# Complex nested logic
def calculate_shipping_cost(weight, destination, shipping_method, insurance, express):
    base_cost = 0
    if weight <= 0:
        return None
    if weight < 1:
        base_cost = 5
    elif weight < 5:
        base_cost = 10
    elif weight < 10:
        base_cost = 15
    else:
        base_cost = 20
    
    if destination == 'domestic':
        multiplier = 1.0
    elif destination == 'international':
        multiplier = 2.5
    else:
        multiplier = 1.5
    
    if shipping_method == 'standard':
        method_cost = 0
    elif shipping_method == 'expedited':
        method_cost = 10
    elif shipping_method == 'overnight':
        method_cost = 25
    else:
        method_cost = 5
    
    insurance_cost = 5 if insurance else 0
    express_cost = 15 if express else 0
    
    total = (base_cost * multiplier) + method_cost + insurance_cost + express_cost
    return total

# Naming violations
def ProcessOrder(Request):
    ORDER_ID = Request.POST.get('order_id')
    return HttpResponse("OK")

# Unused variables
def checkout(request):
    cart_items = request.session.get('cart', [])
    discount_code = request.GET.get('discount')
    unused_var = calculate_total(cart_items)
    return render(request, 'checkout.html')

def calculate_total(items):
    return sum(item['price'] for item in items)

# Missing error handling
def get_product_details(request, product_id):
    product = Product.objects.get(id=product_id)  # Can raise DoesNotExist
    return JsonResponse({
        'name': product.name,
        'price': str(product.price)
    })

# Weak random for security
import random
def generate_reset_token():
    return random.randint(100000, 999999)

# Better: use secrets module
# import secrets
# def generate_reset_token():
#     return secrets.token_urlsafe(32)
