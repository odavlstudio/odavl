import React from 'react';
import { formatDate } from '../utils/helpers'; // BAD: Import from non-existent file

export function UserProfile({ name }) {
  const [count, setCount] = React.useState(0);
  const unusedCounter = 42; // BAD: Unused variable
  
  return (
    <div>
      <h2>{name}</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
