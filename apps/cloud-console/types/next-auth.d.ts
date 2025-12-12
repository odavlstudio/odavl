// Type augmentation for NextAuth to include custom session properties
import { DefaultSession } from "next-auth";
import { OrgRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizations?: Array<{
        id: string;
        name: string;
        slug: string;
        role: OrgRole;
      }>;
      activeOrgId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    organizations?: Array<{
      id: string;
      name: string;
      slug: string;
      role: OrgRole;
    }>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    organizations?: Array<{
      id: string;
      name: string;
      slug: string;
      role: OrgRole;
    }>;
    activeOrgId?: string;
  }
}
