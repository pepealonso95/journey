"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { BookOpen, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton, SignInButton } from "@/components/AuthButtons";
import { api } from "@/lib/api";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  
  // Get current user's data for profile link
  const { data: userData } = api.user.getCurrentUser.useQuery(
    undefined,
    { enabled: !!session }
  );

  // Check if user is on their main profile page (not sub-routes)
  const isOnMainProfilePage = userData?.twitterHandle && pathname === `/profile/${userData.twitterHandle}`;

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-gray-900" />
          <h1 className="text-2xl font-bold text-gray-900">Journey</h1>
        </Link>
        
        <div className="flex items-center gap-4">
          {session ? (
            <>
              {isOnMainProfilePage ? (
                <SignOutButton />
              ) : (
                userData?.twitterHandle && (
                  <Button variant="outline" asChild>
                    <Link href={`/profile/${userData.twitterHandle}`}>My Profile</Link>
                  </Button>
                )
              )}
            </>
          ) : (
            <SignInButton />
          )}
          
          <div className="flex items-center gap-4 text-xs text-gray-600 ml-4">
            <Link 
              href="https://github.com/pepealonso95/journey/tree/main" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 underline transition-colors flex items-center gap-1"
            >
              <Github className="w-3 h-3" />
              Open Source Repo
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}