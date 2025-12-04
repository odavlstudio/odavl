# Test file for Python Best Practices Detector
# This file violates PEP 8 and Python best practices

# PEP 8: Lines too long (should be max 79-88 characters)
very_long_variable_name_that_exceeds_reasonable_length = "This is a very long line that definitely exceeds the PEP 8 recommended line length limit"

# PEP 8: Bad naming conventions
def BadFunctionName():  # Should be snake_case
    pass

class bad_class_name:  # Should be PascalCase
    pass

GLOBAL_variable = 42  # Constants should be UPPER_CASE

# PEP 8: Whitespace issues
def bad_spacing(x,y,z):  # Should have spaces after commas
    result=x+y+z  # Should have spaces around operators
    return result

# Bad: Mutable default argument
def append_to_list(item, items=[]):
    """Dangerous mutable default"""
    items.append(item)
    return items

# Bad: Using bare except
def risky_operation():
    try:
        result = 10 / 0
    except:  # Should specify exception type
        pass

# Bad: Not using context manager for file operations
def read_without_context():
    f = open('file.txt', 'r')
    data = f.read()
    f.close()  # Should use 'with' statement
    return data

# Bad: Using == for None comparison
def check_none(value):
    if value == None:  # Should use 'is None'
        return True
    return False

# Bad: Unnecessary else after return
def calculate(x):
    if x > 0:
        return x * 2
    else:  # Unnecessary else
        return 0

# Bad: Not using enumerate
def print_indexed_items(items):
    """Should use enumerate()"""
    for i in range(len(items)):
        print(f"{i}: {items[i]}")

# Bad: String concatenation in loop
def build_string(items):
    """Should use join()"""
    result = ""
    for item in items:
        result += str(item) + ","
    return result

# Missing docstrings
def undocumented_function(x, y):
    return x + y

class UndocumentedClass:
    def method_without_docs(self):
        pass
