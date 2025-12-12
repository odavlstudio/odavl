"""Database module with SQL injection risk."""

import sqlite3

def query_users(username: str):
    """BAD: SQL injection vulnerability."""
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    
    # BAD: String concatenation in SQL query
    query = f"SELECT * FROM users WHERE username = '{username}'"
    cursor.execute(query)
    
    results = cursor.fetchall()
    conn.close()
    return results

def insert_user(name, email):  # BAD: Missing type hints
    """Insert user without proper validation."""
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    
    # BAD: No input validation
    cursor.execute(f"INSERT INTO users (name, email) VALUES ('{name}', '{email}')")
    conn.commit()
    conn.close()
