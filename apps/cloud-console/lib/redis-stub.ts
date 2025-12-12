/**
 * Redis Stub
 * Optional Redis functionality - not yet implemented
 */

export default class Redis {
  constructor(_url?: string, _options?: any) {}

  async ping(): Promise<string> {
    throw new Error('Redis not configured');
  }

  async get(_key: string): Promise<string | null> {
    return null;
  }

  async set(_key: string, _value: string): Promise<string> {
    return 'OK';
  }

  async info(_section?: string): Promise<string> {
    return 'used_memory_human:0B\nuptime_in_seconds:0';
  }

  async quit(): Promise<void> {}

  disconnect(): void {}
}
