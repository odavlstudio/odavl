"""
Test Python file for ODAVL Insight Python Support
This file intentionally contains various issues for testing
"""

import os
import pickle  # Insecure deserialization
import hashlib
from typing import Optional

# Hardcoded secrets (SECURITY ISSUE)
API_KEY = "sk-1234567890abcdef"  # Critical security issue
password = "admin123"  # Critical security issue

# Missing type hints (TYPE ISSUE)
def calculate_sum(a, b):  # Missing return type and param types
    return a + b

# Bare except (TYPE ISSUE)
def risky_function():
    try:
        result = 1 / 0
    except:  # Bare except - catches everything
        pass

# Mutable default argument (TYPE ISSUE)
def add_to_list(item, my_list=[]):  # Dangerous mutable default
    my_list.append(item)
    return my_list

# SQL Injection (SECURITY ISSUE - CRITICAL)
def get_user(user_id):
    import sqlite3
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # String concatenation in SQL query
    query = "SELECT * FROM users WHERE id = " + str(user_id)
    cursor.execute(query)
    return cursor.fetchone()

# Command injection (SECURITY ISSUE - HIGH)
def run_command(filename):
    os.system("cat " + filename)  # Command injection vulnerability

# Weak crypto (SECURITY ISSUE - MEDIUM)
def weak_hash(data):
    return hashlib.md5(data.encode()).hexdigest()  # MD5 is weak

# Complex function (COMPLEXITY ISSUE)
def complex_function(x, y, z, a, b, c):
    """Function with high cyclomatic complexity"""
    result = 0
    
    if x > 0:
        if y > 0:
            if z > 0:
                if a > 0:
                    if b > 0:  # Deep nesting
                        if c > 0:
                            result = x + y + z + a + b + c
                        else:
                            result = x + y + z + a + b
                    else:
                        result = x + y + z + a
                else:
                    result = x + y + z
            else:
                result = x + y
        else:
            result = x
    
    for i in range(10):
        if i % 2 == 0:
            result += i
        elif i % 3 == 0:
            result -= i
        else:
            result *= 2
    
    while result > 100:
        result -= 10
        if result < 50:
            break
    
    return result

# Long function (COMPLEXITY ISSUE)
def very_long_function():
    """This function is intentionally too long"""
    line1 = 1
    line2 = 2
    line3 = 3
    line4 = 4
    line5 = 5
    line6 = 6
    line7 = 7
    line8 = 8
    line9 = 9
    line10 = 10
    line11 = 11
    line12 = 12
    line13 = 13
    line14 = 14
    line15 = 15
    line16 = 16
    line17 = 17
    line18 = 18
    line19 = 19
    line20 = 20
    line21 = 21
    line22 = 22
    line23 = 23
    line24 = 24
    line25 = 25
    line26 = 26
    line27 = 27
    line28 = 28
    line29 = 29
    line30 = 30
    line31 = 31
    line32 = 32
    line33 = 33
    line34 = 34
    line35 = 35
    line36 = 36
    line37 = 37
    line38 = 38
    line39 = 39
    line40 = 40
    line41 = 41
    line42 = 42
    line43 = 43
    line44 = 44
    line45 = 45
    line46 = 46
    line47 = 47
    line48 = 48
    line49 = 49
    line50 = 50
    line51 = 51
    line52 = 52
    line53 = 53
    line54 = 54
    line55 = 55
    return sum([line1, line2, line3])

# None comparison issue (TYPE ISSUE)
def check_value(value):
    if value == None:  # Should use "is None"
        return False
    if value != None:  # Should use "is not None"
        return True

# Insecure deserialization (SECURITY ISSUE)
def load_data(filename):
    with open(filename, 'rb') as f:
        return pickle.load(f)  # Insecure pickle

# String concatenation in loop (TYPE ISSUE)
def build_string():
    result = ""
    for i in range(100):
        result += str(i)  # Inefficient string concatenation
    return result

# Class with proper type hints (GOOD EXAMPLE)
class GoodExample:
    """Example with proper type hints and structure"""
    
    def __init__(self, name: str, age: int) -> None:
        self.name = name
        self.age = age
    
    def get_info(self) -> str:
        return f"{self.name} is {self.age} years old"
    
    def is_adult(self) -> bool:
        return self.age >= 18

if __name__ == "__main__":
    print("Testing Python detectors...")
    print(f"Sum: {calculate_sum(1, 2)}")
    print(f"Hash: {weak_hash('test')}")
