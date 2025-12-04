# Test file for Python Security Detector
# This file has intentional security vulnerabilities

import os
import pickle
import subprocess

# SQL Injection vulnerability
def get_user_data(user_id):
    """Unsafe SQL query"""
    query = f"SELECT * FROM users WHERE id = {user_id}"
    # This would execute the query unsafely
    return query

# Command injection
def run_command(user_input):
    """Unsafe command execution"""
    os.system(f"echo {user_input}")
    subprocess.call(f"ls {user_input}", shell=True)

# Hardcoded credentials
API_KEY = "sk-1234567890abcdef"
DATABASE_PASSWORD = "admin123"

# Pickle deserialization vulnerability
def load_user_data(file_path):
    """Unsafe pickle deserialization"""
    with open(file_path, 'rb') as f:
        data = pickle.load(f)
    return data

# Path traversal vulnerability
def read_file(filename):
    """Unsafe file reading"""
    with open(f"/var/data/{filename}", 'r') as f:
        return f.read()

# Use of eval (code injection)
def calculate_expression(expr):
    """Dangerous eval usage"""
    result = eval(expr)
    return result

# Weak cryptography
import hashlib

def hash_password(password):
    """Using MD5 for password hashing (weak)"""
    return hashlib.md5(password.encode()).hexdigest()
