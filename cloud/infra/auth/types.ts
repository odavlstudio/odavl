/**
 * Authentication types
 */

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
}

export interface ApiKey {
  key: string;
  name: string;
  createdAt: string;
  expiresAt?: string;
}
