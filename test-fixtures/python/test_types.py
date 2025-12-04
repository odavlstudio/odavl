# Test file for Python Type Detector
# This file has intentional type errors

def add_numbers(a, b):
    """Add two numbers - missing type hints"""
    return a + b

def get_user_name(user):
    """Get user name - missing type hints and potential AttributeError"""
    return user.name.upper()

# Type mismatch
def process_data(items: list[str]) -> int:
    """Returns wrong type"""
    return items  # Should return int, not list

# Missing return type
def calculate_total(prices):
    total = 0
    for price in prices:
        total += price
    return total

# Using Any implicitly
def transform(data):
    if isinstance(data, str):
        return data.upper()
    elif isinstance(data, int):
        return data * 2
    return None

class User:
    def __init__(self, name, age):
        """Missing type hints in __init__"""
        self.name = name
        self.age = age
    
    def greet(self):
        """Missing return type"""
        return f"Hello, {self.name}!"
