"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, BookOpen, Calendar, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { SignOutButton } from '@/components/AuthButtons';

interface UserProfile {
  id: string;
  name: string | null;
  bio: string | null;
  image: string | null;
  twitterHandle: string | null;
  twitterProfileUrl: string | null;
  createdAt: Date;
  lists: any[];
}

interface ProfileHeaderProps {
  userProfile: UserProfile;
  handle: string;
}

export function ProfileHeader({ userProfile, handle }: ProfileHeaderProps) {
  const { data: session } = useSession();
  
  // Check if this is the current user's profile
  const isOwnProfile = session?.user?.id === userProfile.id;

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          {userProfile.image ? (
            <Image
              src={userProfile.image.replace('_normal', '_400x400')}
              alt={userProfile.name || handle}
              width={120}
              height={120}
              className="rounded-full"
            />
          ) : (
            <div className="w-30 h-30 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {(userProfile.name || handle).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-grow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {userProfile.name || `@${handle}`}
              </h1>
              <p className="text-gray-600 text-lg">@{handle}</p>
            </div>
            
            <div className="flex flex-col gap-3">
              {/* Twitter Link */}
              {userProfile.twitterProfileUrl && (
                <Link
                  href={userProfile.twitterProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Twitter
                </Link>
              )}
              
              {/* Sign Out Button - only show on own profile */}
              {isOwnProfile && (
                <SignOutButton />
              )}
            </div>
          </div>

          {/* Bio */}
          {userProfile.bio && (
            <p className="text-gray-700 mb-4 leading-relaxed">{userProfile.bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span className="font-medium">{userProfile.lists.length}</span>
              <span>lists</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(userProfile.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}