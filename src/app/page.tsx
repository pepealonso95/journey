import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Twitter } from 'lucide-react';
import Link from 'next/link';
import { PopularListsSection } from '@/components/PopularListsSection';
import { SignInButton } from '@/components/AuthButtons';
import { Header } from '@/components/layout';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">
            Share Your Reading Journey
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Create curated lists of 4 books on any topic and share them with beautiful previews.<br />
            Help others discover their next reading journey.
          </p>
          
          {/* Quick Create Button */}
          <div className="mb-8">
            <Button asChild size="lg" className="mb-3">
              <Link href="/create">
                <BookOpen className="mr-2 h-5 w-5" />
                {session ? "Create Your Reading List" : "Try it now - No sign in required"}
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
          
          {/* Popular Lists Section */}
          <PopularListsSection />

          {/* Subtle sign-in option for non-authenticated users */}
          {!session && (
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Want to save and manage your lists?
              </p>
              <SignInButton />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}