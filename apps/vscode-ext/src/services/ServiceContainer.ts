// Simple DI/service container for ODAVL extension
export class ServiceContainer {
    private readonly services = new Map<string, unknown>();

    register<T>(key: string, instance: T): void {
        this.services.set(key, instance);
    }

    resolve<T>(key: string): T {
        const instance = this.services.get(key);
        if (!instance) throw new Error(`Service not found: ${key}`);
        return instance as T;
    }

    has(key: string): boolean {
        return this.services.has(key);
    }
}

// Global singleton container for extension-wide services.
export const GlobalContainer = new ServiceContainer();
