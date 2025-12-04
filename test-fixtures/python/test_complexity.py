# Test file for Python Complexity Detector
# This file has high cyclomatic complexity

def complex_function(x, y, z):
    """High complexity function - many nested conditions"""
    result = 0
    
    if x > 0:
        if y > 0:
            if z > 0:
                result = x + y + z
            else:
                if z < -10:
                    result = x + y - z
                else:
                    result = x + y
        else:
            if z > 0:
                result = x - y + z
            else:
                result = x - y - z
    else:
        if y > 0:
            if z > 0:
                result = -x + y + z
            else:
                result = -x + y - z
        else:
            if z > 0:
                result = -x - y + z
            else:
                result = -x - y - z
    
    return result

def process_order(order):
    """Complex business logic"""
    status = order['status']
    
    if status == 'pending':
        if order['payment_received']:
            if order['items_available']:
                if order['address_valid']:
                    return 'confirmed'
                else:
                    return 'address_error'
            else:
                return 'out_of_stock'
        else:
            return 'payment_required'
    elif status == 'confirmed':
        if order['shipped']:
            if order['delivered']:
                return 'completed'
            else:
                return 'in_transit'
        else:
            return 'processing'
    elif status == 'cancelled':
        if order['refund_issued']:
            return 'refunded'
        else:
            return 'refund_pending'
    else:
        return 'unknown'

# Long function (too many lines)
def giant_function():
    """Function with too many lines"""
    a = 1
    b = 2
    c = 3
    d = 4
    e = 5
    f = 6
    g = 7
    h = 8
    i = 9
    j = 10
    # ... imagine 100 more lines here
    return a + b + c + d + e + f + g + h + i + j
