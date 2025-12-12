import React from 'react';
import { UserProfile } from './components/UserProfile';
import { NonExistentComponent } from './components/Missing'; // BAD: Import from non-existent file

const unusedVariable = 'This is never used'; // BAD: Unused variable

function App() {
  const unusedState = React.useState(0); // BAD: Unused state
  
  return (
    <div className="App">
      <h1>React Sample for ODAVL Testing</h1>
      <UserProfile name="Test User" />
    </div>
  );
}

export default App;
