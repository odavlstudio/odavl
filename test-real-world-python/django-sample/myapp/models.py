"""
Django Models - Intentional Issues for Testing
This file contains various issues that detectors should find
"""
from django.db import models
from django.contrib.auth.models import User
import os

# Missing type hints
def calculate_discount(price, discount_percent):
    return price * (1 - discount_percent / 100)

# Complex function (high cyclomatic complexity)
def process_user_order(user_id, items, payment_method, shipping_address, promo_code):
    if not user_id:
        return None
    if not items:
        return None
    if len(items) == 0:
        return None
    if not payment_method:
        return None
    if payment_method not in ['credit', 'debit', 'paypal']:
        return None
    if not shipping_address:
        return None
    if len(shipping_address) < 10:
        return None
    if promo_code:
        if len(promo_code) != 8:
            return None
        if not promo_code.isalnum():
            return None
    total = 0
    for item in items:
        if item['quantity'] <= 0:
            return None
        total += item['price'] * item['quantity']
    return {'total': total, 'status': 'processed'}

# SQL Injection vulnerability
def get_user_by_email(email):
    from django.db import connection
    cursor = connection.cursor()
    # Dangerous: SQL injection
    query = f"SELECT * FROM users WHERE email = '{email}'"
    cursor.execute(query)
    return cursor.fetchone()

# Command injection vulnerability
def backup_database(filename):
    # Dangerous: command injection
    command = f"pg_dump mydb > {filename}"
    os.system(command)

# Hardcoded secret
API_KEY = "sk-1234567890abcdefghijklmnop"
DATABASE_PASSWORD = "admin123"

# Naming convention violations
def CalculateTax(Amount):
    TAX_RATE = 0.15
    return Amount * TAX_RATE

# Line too long (>79 characters)
def process_payment_with_many_parameters(customer_id, order_id, amount, currency, payment_method, card_number, cvv, expiry_date):
    pass

# Missing docstrings
def validate_email(email):
    return '@' in email and '.' in email

# Broad exception catching
def risky_operation():
    try:
        result = complex_calculation()
        return result
    except:
        pass

def complex_calculation():
    return 42

# Unused imports
import random
import datetime
from typing import Dict, List

# Django Models
class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    
    def get_discounted_price(self, discount_percent):
        # Missing type hints on method
        return self.price * (1 - discount_percent / 100)

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    products = models.ManyToManyField(Product)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Missing @transaction.atomic for database operations
    def process_order(self):
        for product in self.products.all():
            product.stock -= 1
            product.save()
        self.save()
