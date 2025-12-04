# FastAPI Async API - Real-world example with intentional issues

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import aiosqlite
import os

app = FastAPI()

# Issue 1: Hardcoded database credentials
DATABASE_URL = "postgresql://admin:password123@localhost/mydb"

# Issue 2: Missing type hints on some functions
class User(BaseModel):
    id: int
    username: str
    email: str

class Post(BaseModel):
    title: str
    content: str
    author_id: int

# Issue 3: Blocking I/O in async function
async def get_user_sync(user_id):
    # Should use async database driver, but using sync instead
    import sqlite3
    conn = sqlite3.connect('database.db')  # Blocking!
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return user

# Issue 4: Missing await keyword
async def get_posts():
    # Missing await - will return coroutine, not result
    posts = fetch_posts_from_db()  # Should be: await fetch_posts_from_db()
    return posts

async def fetch_posts_from_db():
    await asyncio.sleep(0.1)
    return []

# Issue 5: SQL injection in async context
@app.get("/users/{user_id}")
async def read_user(user_id: str):
    async with aiosqlite.connect('database.db') as db:
        # Vulnerable to SQL injection
        query = f"SELECT * FROM users WHERE id = {user_id}"
        async with db.execute(query) as cursor:
            user = await cursor.fetchone()
    
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"user": user}

# Issue 6: Command injection in async function
@app.post("/backup")
async def create_backup(filename: str):
    # Vulnerable to command injection
    os.system(f"tar -czf {filename}.tar.gz database.db")
    return {"message": "Backup created"}

# Issue 7: Complex async function (CC > 5)
@app.post("/posts/")
async def create_post(post: Post, user_id: int = None):
    if not post.title:
        raise HTTPException(status_code=400, detail="Title required")
    if len(post.title) < 5:
        raise HTTPException(status_code=400, detail="Title too short")
    if not post.content:
        raise HTTPException(status_code=400, detail="Content required")
    if len(post.content) < 100:
        raise HTTPException(status_code=400, detail="Content too short")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID required")
    if post.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    async with aiosqlite.connect('database.db') as db:
        await db.execute(
            'INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)',
            (post.title, post.content, post.author_id)
        )
        await db.commit()
    
    return {"message": "Post created"}

# Issue 8: Weak random for async tokens
import random
async def generate_token():
    await asyncio.sleep(0.01)
    return random.randint(100000, 999999)

# Issue 9: Broad exception in async
@app.delete("/posts/{post_id}")
async def delete_post(post_id: int):
    try:
        async with aiosqlite.connect('database.db') as db:
            await db.execute('DELETE FROM posts WHERE id = ?', (post_id,))
            await db.commit()
    except:
        raise HTTPException(status_code=500, detail="Delete failed")
    
    return {"message": "Post deleted"}

# Issue 10: Event loop blocking
@app.get("/process")
async def process_data():
    # Blocking operation in async function
    import time
    time.sleep(2)  # Should use await asyncio.sleep(2)
    return {"status": "done"}

# Issue 11: Missing type hints
async def validate_user_data(data):
    if not data.get('email'):
        return False
    if '@' not in data['email']:
        return False
    return True

# Issue 12: Unused imports
from datetime import datetime, timedelta
import json
import sys

# Issue 13: Line too long
@app.get("/search", response_model=List[Post])
async def search_posts(query: Optional[str] = None, category: Optional[str] = None, author: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    return []

# Issue 14: Poor naming in async function
async def GetAllUsers():
    UserList = []
    return UserList

# Issue 15: Missing docstring
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Issue 16: Sync operation mixed with async
@app.post("/upload")
async def upload_file(filename: str, content: bytes):
    # Mixing sync file I/O with async - should use aiofiles
    with open(f"uploads/{filename}", 'wb') as f:
        f.write(content)
    return {"filename": filename}

if __name__ == "__main__":
    import uvicorn
    # Issue 17: Missing type hints on main
    uvicorn.run(app, host="0.0.0.0", port=8000)
