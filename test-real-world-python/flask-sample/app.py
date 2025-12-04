"""
Flask REST API - Intentional Issues for Testing
"""
from flask import Flask, request, jsonify
import os
import sqlite3
import pickle
import subprocess

app = Flask(__name__)

# Hardcoded secrets
app.config['SECRET_KEY'] = 'supersecretkey123'
DATABASE_URL = 'postgresql://admin:password123@localhost/mydb'

# Missing type hints
def calculate_total(items):
    return sum(item['price'] * item['quantity'] for item in items)

# SQL Injection vulnerability
@app.route('/users/<email>')
def get_user(email):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # Dangerous: SQL injection
    query = f"SELECT * FROM users WHERE email = '{email}'"
    cursor.execute(query)
    user = cursor.fetchone()
    conn.close()
    return jsonify(user)

# Command injection
@app.route('/backup')
def backup():
    filename = request.args.get('filename', 'backup.sql')
    # Dangerous: command injection
    os.system(f'mysqldump mydb > {filename}')
    return jsonify({'status': 'success'})

# Pickle deserialization
@app.route('/load_data', methods=['POST'])
def load_data():
    data = request.files['file'].read()
    # Dangerous: pickle can execute arbitrary code
    obj = pickle.loads(data)
    return jsonify(obj)

# Missing input validation
@app.route('/process', methods=['POST'])
def process_data():
    data = request.json
    # No validation - could be None or malformed
    result = data['items'][0]['price'] * data['quantity']
    return jsonify({'total': result})

# Complex function (high cyclomatic complexity)
def validate_order(order_data):
    if not order_data:
        return False
    if 'user_id' not in order_data:
        return False
    if 'items' not in order_data:
        return False
    if len(order_data['items']) == 0:
        return False
    if 'payment_method' not in order_data:
        return False
    if order_data['payment_method'] not in ['credit', 'debit', 'paypal']:
        return False
    if 'shipping_address' not in order_data:
        return False
    if len(order_data['shipping_address']) < 10:
        return False
    for item in order_data['items']:
        if 'product_id' not in item:
            return False
        if 'quantity' not in item:
            return False
        if item['quantity'] <= 0:
            return False
        if 'price' not in item:
            return False
        if item['price'] < 0:
            return False
    return True

# Weak random for security tokens
import random
@app.route('/generate_token')
def generate_token():
    # Insecure random
    token = random.randint(100000, 999999)
    return jsonify({'token': token})

# Missing error handling
@app.route('/products/<int:product_id>')
def get_product(product_id):
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
    product = cursor.fetchone()  # Could be None
    # No error handling if product doesn't exist
    return jsonify({
        'id': product[0],
        'name': product[1],
        'price': product[2]
    })

# Naming convention violations
def CalculateDiscount(Price, DiscountPercent):
    DISCOUNT_AMOUNT = Price * (DiscountPercent / 100)
    return DISCOUNT_AMOUNT

# Line too long
def process_payment_transaction(customer_id, order_id, amount, currency, payment_method, card_number, cvv, expiry_date, billing_address):
    pass

# Unused imports
import datetime
from typing import Dict, List
import json

# Broad exception catching
@app.route('/risky')
def risky_operation():
    try:
        result = complex_calculation()
        return jsonify({'result': result})
    except:
        return jsonify({'error': 'Something went wrong'})

def complex_calculation():
    return 42 / 0  # Will raise ZeroDivisionError

# Missing docstrings
def validate_email(email):
    return '@' in email

# Debug mode in production (security risk)
if __name__ == '__main__':
    # Dangerous: debug=True in production
    app.run(debug=True, host='0.0.0.0', port=5000)
