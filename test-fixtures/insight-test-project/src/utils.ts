/**
 * ODAVL Insight Test Project - Utilities
 * 
 * More detectable issues for testing
 */

// Issue: Unused export
export const UNUSED_EXPORT = "This export is never imported";

// Issue: Function with 'any' return type
export function getData(): any {
  return { data: [] };
}

// Issue: Empty interface
export interface EmptyInterface {}

// Issue: Unused type alias
type UnusedType = string | number;

// Issue: Console.log in production code
export function debugLog(message: string): void {
  console.log("[DEBUG]", message); // Should use proper logger
}

// Issue: Missing error handling
export async function fetchData(url: string): Promise<any> {
  const response = await fetch(url); // No try/catch
  return response.json();
}
