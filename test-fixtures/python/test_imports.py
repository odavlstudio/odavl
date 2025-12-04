# Test file for Python Imports Detector
# This file has import issues

# Unused imports
import os
import sys
import json
import datetime
from typing import List, Dict, Optional

# Only using datetime.datetime
now = datetime.datetime.now()

# Circular import (would cause issues)
# from test_types import User

# Duplicate imports
import os as operating_system

# Wildcard import (bad practice)
from typing import *

# Import not at top of file
def some_function():
    import random  # Import inside function
    return random.randint(1, 10)

# Missing import (will cause NameError)
def use_missing_module():
    # pandas is not imported
    # df = pandas.DataFrame()
    pass

# Relative import
# from . import test_security

# Standard library, third-party, and local imports not grouped
from collections import Counter
import numpy as np  # Third-party (if installed)
import test_types  # Local
import re  # Standard library
