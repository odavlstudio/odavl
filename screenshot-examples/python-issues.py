# Python Security & Best Practices Issues for Screenshot Demo

import sqlite3
import os

# ❌ SECURITY: Hardcoded credentials
PASSWORD = "admin123"
API_KEY = "sk-1234567890abcdefghijklmnopqrstuvwxyz"
SECRET_TOKEN = "token_abcdefghijklmnopqrstuvwxyz"


# ❌ SECURITY: SQL Injection vulnerability
def get_user_by_id(user_id):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # Direct string formatting in SQL query
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
    return cursor.fetchone()


# ❌ SECURITY: Command injection vulnerability
def execute_system_command(filename):
    # User input directly in system command
    os.system(f"cat {filename}")


# ❌ BEST PRACTICES: Missing type hints
def calculate_total(items, tax_rate, discount):
    total = 0
    for item in items:
        total += item['price'] * item['quantity']
    total = total * (1 + tax_rate)
    total = total * (1 - discount)
    return total


# ❌ BEST PRACTICES: Missing docstring
def process_user_data(user_data):
    if user_data:
        if 'name' in user_data:
            if 'age' in user_data:
                if user_data['age'] > 18:
                    if 'email' in user_data:
                        return user_data
    return None


# ❌ COMPLEXITY: High cyclomatic complexity
def validate_user_permissions(user, role, permissions):
    if user:
        if user.get('active'):
            if role:
                if role.get('level', 0) > 0:
                    if permissions:
                        if permissions.get('read'):
                            if permissions.get('write'):
                                if permissions.get('delete'):
                                    if user.get('age', 0) > 18:
                                        if user.get('verified'):
                                            return True
    return False


# ❌ SECURITY: Weak password hashing
def hash_password(password):
    import hashlib
    # MD5 is cryptographically broken
    return hashlib.md5(password.encode()).hexdigest()


# ❌ SECURITY: Path traversal vulnerability
def read_user_file(filename):
    # No validation of filename
    with open(f"/var/data/{filename}", 'r') as f:
        return f.read()


# ❌ IMPORTS: Unused imports
import json
import sys
import time
from datetime import datetime
from typing import List, Dict


# ❌ BEST PRACTICES: Bare except clause
def risky_operation():
    try:
        # Some operation
        result = dangerous_function()
        return result
    except:  # Catches all exceptions, including SystemExit
        pass


# ❌ COMPLEXITY: Deeply nested function
def process_nested_data(data):
    results = []
    for item in data:
        if item:
            for sub_item in item:
                if sub_item:
                    for value in sub_item:
                        if value:
                            for key in value:
                                if key:
                                    results.append(key)
    return results


# ❌ SECURITY: Insecure deserialization
def load_user_session(session_data):
    import pickle
    # pickle.loads() can execute arbitrary code
    return pickle.loads(session_data)


def dangerous_function():
    pass
