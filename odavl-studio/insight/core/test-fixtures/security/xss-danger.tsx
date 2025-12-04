import React from 'react';

// True Positive: Unsanitized user input SHOULD be flagged
export function DangerousComponent({ userInput }: { userInput: string }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: userInput }} />
  );
}

// XSS vulnerability!
