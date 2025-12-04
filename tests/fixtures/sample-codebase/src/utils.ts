// Utility functions

export function unusedImport() {
    return 'This function is imported but never used';
}

export function formatDate(date: Date): string {
    return date.toISOString();
}

// Complexity issue: High cyclomatic complexity
export function complexFunction(x: number, y: number, z: number): number {
    if (x > 10) {
        if (y > 20) {
            if (z > 30) {
                return x + y + z;
            } else if (z > 20) {
                return x + y;
            } else if (z > 10) {
                return x;
            } else {
                return 0;
            }
        } else if (y > 10) {
            if (z > 20) {
                return y + z;
            } else {
                return y;
            }
        } else {
            return 0;
        }
    } else if (x > 5) {
        if (y > 15) {
            return x + y;
        } else {
            return x;
        }
    } else {
        return 0;
    }
}
