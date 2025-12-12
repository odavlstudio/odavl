'use client';

import { useState } from 'react';

// BAD: Using hook outside component (wrong placement)
const globalCount = useState(0); // BAD: Hook called at module level

export function ClientCounter() {
  const [count, setCount] = useState(0);
  const unusedVar = 'never used'; // BAD: Unused variable
  
  return (
    <div>
      <h2>Client Counter</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
