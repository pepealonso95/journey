'use client';

import { signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Twitter } from 'lucide-react';

export function SignInButton() {
  return (
    <Button 
      onClick={() => signIn('twitter', { callbackUrl: '/' })} 
      variant="ghost"
      size="sm"
      className="text-gray-600 hover:text-gray-900"
    >
      <Twitter className="mr-2 h-4 w-4" />
      Sign in with X
    </Button>
  );
}

export function SignOutButton() {
  return (
    <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/' })}>
      Sign Out
    </Button>
  );
}