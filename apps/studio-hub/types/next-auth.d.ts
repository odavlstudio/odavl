// NextAuth TypeScript definitions extension
// Week 1: Extend default types with custom fields

import 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    role: Role;
    orgId?: string | null;
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
      orgId?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    orgId?: string | null;
  }
}
