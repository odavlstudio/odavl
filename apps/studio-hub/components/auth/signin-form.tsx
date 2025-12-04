// Sign In Form Component
// Week 1: OAuth Buttons

'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { OAuthButton } from './OAuthButton';
import { logger } from '@/lib/logger';

export function SignInForm() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  async function handleOAuthSignIn(provider: 'github' | 'google') {
    setIsLoading(provider);

    try {
      await signIn(provider, {
        callbackUrl: '/dashboard',
      });
    } catch (error) {
      logger.error('Sign in error', error as Error);
      setIsLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <OAuthButton
        provider="github"
        isLoading={isLoading === 'github'}
        onClick={() => handleOAuthSignIn('github')}
        disabled={isLoading !== null}
      />

      <OAuthButton
        provider="google"
        isLoading={isLoading === 'google'}
        onClick={() => handleOAuthSignIn('google')}
        disabled={isLoading !== null}
      />
    </div>
  );
}
