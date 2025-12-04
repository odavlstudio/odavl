# Flask REST API - Real-world example with intentional issues

from flask import Flask, request, jsonify
import sqlite3
import os
import subprocess

app = Flask(__name__)

# Issue 1: Hardcoded secret key
app.config['SECRET_KEY'] = 'super-secret-key-123456'

# Issue 2: Missing type hints
def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

# Issue 3: SQL injection vulnerability
@app.route('/users/<user_id>')
def get_user(user_id):
    conn = get_db_connection()
    # Vulnerable to SQL injection
    query = f"SELECT * FROM users WHERE id = {user_id}"
    user = conn.execute(query).fetchone()
    conn.close()
    
    if user is None:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(dict(user))

# Issue 4: Command injection
@app.route('/backup')
def backup_database():
    filename = request.args.get('filename', 'backup.db')
    # Vulnerable to command injection
    os.system(f'cp database.db backups/{filename}')
    return jsonify({'message': 'Backup created'})

# Issue 5: Complex function (CC > 5)
@app.route('/posts', methods=['POST'])
def create_post():
    data = request.get_json()
    
    if 'title' not in data:
        return jsonify({'error': 'Title required'}), 400
    if len(data['title']) < 5:
        return jsonify({'error': 'Title too short'}), 400
    if 'content' not in data:
        return jsonify({'error': 'Content required'}), 400
    if len(data['content']) < 100:
        return jsonify({'error': 'Content too short'}), 400
    if 'author_id' not in data:
        return jsonify({'error': 'Author required'}), 400
    if 'category' not in data:
        return jsonify({'error': 'Category required'}), 400
    if data['category'] not in ['tech', 'business', 'lifestyle']:
        return jsonify({'error': 'Invalid category'}), 400
    
    conn = get_db_connection()
    conn.execute(
        'INSERT INTO posts (title, content, author_id, category) VALUES (?, ?, ?, ?)',
        (data['title'], data['content'], data['author_id'], data['category'])
    )
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Post created'}), 201

# Issue 6: Weak random for tokens
import random
def generate_api_token():
    return str(random.randint(1000000000, 9999999999))

# Issue 7: Broad exception catching
@app.route('/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM posts WHERE id = ?', (post_id,))
        conn.commit()
        conn.close()
    except:
        return jsonify({'error': 'Failed to delete'}), 500
    
    return jsonify({'message': 'Post deleted'}), 200

# Issue 8: Unsorted imports
from datetime import datetime
import json

# Issue 9: Line too long
@app.route('/posts/search', methods=['GET'])
def search_posts():
    query = request.args.get('q', '')
    category = request.args.get('category', '')
    author = request.args.get('author', '')
    start_date = request.args.get('start_date', '')
    end_date = request.args.get('end_date', '')
    limit = request.args.get('limit', 10)
    offset = request.args.get('offset', 0)
    return jsonify([])

# Issue 10: Missing docstrings
@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'})

# Issue 11: Unused variable
@app.route('/stats')
def get_stats():
    unused_value = 123
    conn = get_db_connection()
    total_posts = conn.execute('SELECT COUNT(*) FROM posts').fetchone()[0]
    total_users = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    conn.close()
    
    return jsonify({
        'total_posts': total_posts,
        'total_users': total_users
    })

# Issue 12: Poor naming convention
@app.route('/UpdateUserEmail', methods=['POST'])
def UpdateUserEmail():
    UserID = request.json.get('userId')
    NewEmail = request.json.get('email')
    return jsonify({'success': True})

if __name__ == '__main__':
    # Issue 13: Debug mode in production
    app.run(debug=True, host='0.0.0.0')
