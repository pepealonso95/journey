'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Plus, Twitter } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-gray-900" />
              <h1 className="text-2xl font-bold text-gray-900">Journey</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" onClick={() => signOut()}>
                Sign Out
              </Button>
              <div className="flex items-center gap-4 text-xs text-gray-600 ml-4">
                <Link 
                  href="https://x.com/pepealonsog" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 underline transition-colors"
                >
                  Built by @pepealonsog
                </Link>
                <span className="text-gray-400">•</span>
                <Link 
                  href="https://github.com/pepealonso95/journey/tree/main" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 underline transition-colors"
                >
                  Open Source Repo
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              Welcome back, {session.user?.name}!
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Create and share curated reading lists on any topic
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create Your First List
                  </CardTitle>
                  <CardDescription>
                    Start building a curated list of 4 books on any topic
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/dashboard">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Share & Discover</CardTitle>
                  <CardDescription>
                    Share your lists with beautiful previews and discover lists from others
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Browse Public Lists
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-gray-900" />
            <h1 className="text-2xl font-bold text-gray-900">Journey</h1>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link 
              href="https://x.com/pepealonsog" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 underline transition-colors"
            >
              Built by @pepealonsog
            </Link>
            <span className="text-gray-400">•</span>
            <Link 
              href="https://github.com/pepealonso95/journey/tree/main" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 underline transition-colors"
            >
              Open Source Repo
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">
            Share Your Reading Journey
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Create curated lists of 4 books on any topic and share them with beautiful previews. 
            Help others discover their next great read.
          </p>
          
          {/* Quick Create Button */}
          <div className="mb-8">
            <Button asChild size="lg" className="mb-3">
              <Link href="/create">
                <BookOpen className="mr-2 h-5 w-5" />
                Try it now - No sign in required
              </Link>
            </Button>
            <p className="text-sm text-gray-600">
              Create and share a list instantly
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Curate Lists</h3>
              <p className="text-gray-600">
                Create focused lists of exactly 4 books on any topic with reading order
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Easy Sharing</h3>
              <p className="text-gray-600">
                Share with rich previews showing book covers and reading sequence
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Twitter className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Social Discovery</h3>
              <p className="text-gray-600">
                Discover amazing book recommendations from your network
              </p>
            </div>
          </div>
          
          {/* Subtle sign-in option */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Want to save and manage your lists?
            </p>
            <Button 
              onClick={() => signIn('twitter')} 
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <Twitter className="mr-2 h-4 w-4" />
              Sign in with X
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
