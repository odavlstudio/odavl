// Sample code with intentional issues for testing

import fs from 'node:fs';
import path from 'node:path';
import { unusedImport } from './utils'; // Unused import (should be detected)

// TypeScript error: implicit any
function calculateSum(a, b) {
    return a + b;
}

// ESLint warning: console.log
console.log('Starting application...');

// Security issue: Hardcoded API key
const API_KEY = 'sk-1234567890abcdef';

// Performance issue: Inefficient loop
const numbers = [1, 2, 3, 4, 5];
for (let i = 0; i < numbers.length; i++) {
    for (let j = 0; j < numbers.length; j++) {
        console.log(numbers[i] * numbers[j]);
    }
}

// Runtime issue: Potential null pointer
function getUserName(user: any) {
    return user.name.toUpperCase(); // No null check
}

export { calculateSum, getUserName };
