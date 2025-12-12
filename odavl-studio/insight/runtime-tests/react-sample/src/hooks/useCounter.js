import { useState, useEffect } from 'react';

// BAD: Custom hook with potential issues
export function useCounter(initialValue) {
  const [count, setCount] = useState(initialValue);
  const unusedValue = 100; // BAD: Unused variable
  
  useEffect(() => {
    console.log('Count changed:', count);
    // BAD: Missing cleanup, could cause memory leak
  }, [count]);
  
  return [count, setCount];
}
