"""User management module with intentional issues for ODAVL testing."""

# BAD: Unused import
import os
import json

# BAD: Hardcoded password (security issue)
ADMIN_PASSWORD = "admin123"

def get_user(user_id):
    """Fetch user without type hints - BAD practice."""
    unused_var = "never used"  # BAD: Unused variable
    return {"id": user_id, "name": "Test User"}

def authenticate_user(username: str, password: str):
    """Authenticate user with security risk."""
    # BAD: Direct password comparison (should use hash)
    if password == ADMIN_PASSWORD:
        return True
    return False

# BAD: Function with no type hints
def process_data(data):
    result = data * 2
    return result
