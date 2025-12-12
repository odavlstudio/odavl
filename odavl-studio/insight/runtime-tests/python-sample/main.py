"""Main application entry point."""

from user import get_user, authenticate_user
from database import query_users
# BAD: Import from non-existent module
from utils import format_output

def main():
    """Main function with complexity issues."""
    unused_list = [1, 2, 3, 4, 5]  # BAD: Unused variable
    
    # BAD: Deeply nested conditions (complexity)
    if True:
        if True:
            if True:
                if True:
                    print("Too much nesting")
    
    user = get_user(1)
    results = query_users("admin")
    
    print(f"User: {user}")
    print(f"Query results: {results}")

if __name__ == "__main__":
    main()
