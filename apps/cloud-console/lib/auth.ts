import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';
import { OrgRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.hashedPassword) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        if (!user.emailVerified) {
          throw new Error('Please verify your email first');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session: sessionUpdate }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        
        // Load user's organizations and set active org
        const userWithOrgs = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            memberships: {
              include: {
                organization: true,
              },
              orderBy: {
                createdAt: 'asc', // Most recently joined org
              },
            },
          },
        });
        
        if (userWithOrgs && userWithOrgs.memberships.length > 0) {
          // Set first org as default activeOrgId
          token.activeOrgId = userWithOrgs.memberships[0].organization.id;
          token.organizations = userWithOrgs.memberships.map((om: {
            organization: { id: string; name: string; slug: string };
            role: OrgRole;
          }) => ({
            id: om.organization.id,
            name: om.organization.name,
            slug: om.organization.slug,
            role: om.role,
          }));
        }
      }
      
      // Handle organization switch from client
      if (trigger === 'update' && sessionUpdate?.activeOrgId) {
        token.activeOrgId = sessionUpdate.activeOrgId;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        
        // Inject organization context
        (session as any).activeOrgId = token.activeOrgId;
        (session as any).organizations = token.organizations || [];
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      // Create default organization for new OAuth users
      if (account?.provider !== 'credentials') {
        const existingOrg = await prisma.organization.findFirst({
          where: {
            members: {
              some: { userId: user.id },
            },
          },
        });

        if (!existingOrg) {
          const org = await prisma.organization.create({
            data: {
              name: `${user.name}'s Organization`,
              slug: `${user.email?.split('@')[0]}-${Date.now()}`,
              tier: 'FREE',
              members: {
                create: {
                  userId: user.id,
                  role: 'OWNER',
                },
              },
            },
          });
          console.log(`Created organization ${org.id} for user ${user.id}`);
        }
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
