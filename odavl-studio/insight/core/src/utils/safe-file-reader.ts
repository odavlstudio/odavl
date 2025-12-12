/**
 * Safe File Reader Utility
 * Wave 7: Fix detector crashes from EISDIR errors
 * 
 * Provides safe file reading with directory detection and error handling
 */

import * as fs from 'node:fs';

/**
 * Safely read a file, returning null if unreadable or is a directory
 * @param filePath Absolute path to file
 * @returns File content as string, or null if unreadable
 */
export function safeReadFile(filePath: string): string | null {
    try {
        // Check if path exists and is a file (not directory)
        const stats = fs.statSync(filePath);
        
        if (!stats.isFile()) {
            // Skip directories silently
            return null;
        }
        
        // Read file content
        return fs.readFileSync(filePath, 'utf8');
    } catch (error: any) {
        // Handle common errors silently
        if (error.code === 'EISDIR' || 
            error.code === 'ENOENT' || 
            error.code === 'EACCES' ||
            error.code === 'EPERM') {
            return null;
        }
        
        // Log unexpected errors but don't crash
        console.warn(`[SafeFileReader] Unexpected error reading ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Check if a path is a file (not a directory)
 * @param filePath Path to check
 * @returns true if path is a file, false otherwise
 */
export function isFile(filePath: string): boolean {
    try {
        const stats = fs.statSync(filePath);
        return stats.isFile();
    } catch {
        return false;
    }
}

/**
 * Check if a path is a directory
 * @param dirPath Path to check
 * @returns true if path is a directory, false otherwise
 */
export function isDirectory(dirPath: string): boolean {
    try {
        const stats = fs.statSync(dirPath);
        return stats.isDirectory();
    } catch {
        return false;
    }
}
