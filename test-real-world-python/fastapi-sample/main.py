"""
FastAPI Application - Intentional Issues for Testing
"""
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import os
import sqlite3
import pickle
import asyncio
import subprocess

app = FastAPI()

# Hardcoded secrets
API_KEY = "sk-1234567890abcdefghijklmnop"
DATABASE_PASSWORD = "admin123"

# Missing type hints on async function
async def get_database():
    conn = sqlite3.connect('app.db')
    try:
        yield conn
    finally:
        conn.close()

# SQL Injection in async function
@app.get("/users/{email}")
async def get_user(email: str):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # Dangerous: SQL injection
    query = f"SELECT * FROM users WHERE email = '{email}'"
    cursor.execute(query)
    user = cursor.fetchone()
    conn.close()
    return {"user": user}

# Command injection
@app.post("/backup")
async def backup_database(filename: str):
    # Dangerous: command injection
    os.system(f"pg_dump mydb > {filename}")
    return {"status": "success"}

# Pickle deserialization
@app.post("/load")
async def load_data(file_path: str):
    with open(file_path, 'rb') as f:
        # Dangerous: pickle can execute arbitrary code
        data = pickle.load(f)
    return data

# Blocking call in async function
@app.get("/sync-operation")
async def sync_operation():
    # BAD: Blocking call in async function
    import time
    time.sleep(5)  # Should use asyncio.sleep()
    return {"status": "done"}

# Missing await keyword
@app.get("/async-data")
async def get_async_data():
    # BAD: Missing await
    result = fetch_data_from_api()  # This is async but not awaited
    return {"data": result}

async def fetch_data_from_api():
    await asyncio.sleep(1)
    return {"sample": "data"}

# Complex function with high cyclomatic complexity
async def process_complex_order(order_data: dict):
    if not order_data:
        raise HTTPException(400, "Invalid order")
    if 'user_id' not in order_data:
        raise HTTPException(400, "Missing user_id")
    if 'items' not in order_data:
        raise HTTPException(400, "Missing items")
    if len(order_data['items']) == 0:
        raise HTTPException(400, "Empty items")
    if 'payment_method' not in order_data:
        raise HTTPException(400, "Missing payment method")
    if order_data['payment_method'] not in ['credit', 'debit', 'paypal']:
        raise HTTPException(400, "Invalid payment method")
    
    total = 0
    for item in order_data['items']:
        if 'quantity' not in item:
            raise HTTPException(400, "Missing quantity")
        if item['quantity'] <= 0:
            raise HTTPException(400, "Invalid quantity")
        if 'price' not in item:
            raise HTTPException(400, "Missing price")
        if item['price'] < 0:
            raise HTTPException(400, "Invalid price")
        total += item['price'] * item['quantity']
    
    return {"total": total}

# Naming convention violations
def CalculateTax(Amount):
    TAX_RATE = 0.15
    return Amount * TAX_RATE

# Weak random for security
import random
@app.get("/generate-token")
async def generate_token():
    # Insecure random
    token = random.randint(100000, 999999)
    return {"token": token}

# Missing input validation
@app.post("/process")
async def process_data(data: dict):
    # No validation - could crash
    result = data['items'][0]['price'] * data['quantity']
    return {"total": result}

# Broad exception catching
@app.get("/risky")
async def risky_operation():
    try:
        result = await dangerous_operation()
        return {"result": result}
    except:
        # Too broad exception
        return {"error": "Failed"}

async def dangerous_operation():
    return 42 / 0

# Unused imports
from typing import List, Dict, Optional
import datetime
import json

# Missing docstrings
def validate_email(email):
    return '@' in email

# Line too long (>79 characters)
def process_payment_with_many_parameters(customer_id, order_id, amount, currency, payment_method, card_number, cvv):
    pass

class Product(BaseModel):
    name: str
    price: float
    stock: int

# Missing type hints on some methods
class ProductService:
    def get_product(self, product_id):  # Missing return type
        return {"id": product_id, "name": "Sample"}
    
    async def update_stock(self, product_id, quantity):  # Missing types
        pass

# Event loop issues
@app.on_event("startup")
async def startup():
    # BAD: Creating new event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

if __name__ == "__main__":
    import uvicorn
    # Running on all interfaces (security risk)
    uvicorn.run(app, host="0.0.0.0", port=8000)
