/**
 * ODAVL Insight Test Project - Type Definitions
 * 
 * More type-related issues for testing
 */

// Issue: 'any' type usage
export type AnyData = any;

// Issue: Weak type (single optional property)
export interface WeakType {
  id?: string;
}

// Issue: Duplicate identifier (overload without implementation)
export function overloaded(x: number): number;
export function overloaded(x: string): string;

// Issue: Unused generic parameter
export function identity<T, U>(value: T): T {
  return value; // U is never used
}
