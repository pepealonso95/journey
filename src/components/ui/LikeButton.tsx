'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  bookListId: number;
  initialLikeCount: number;
  initialIsLiked?: boolean;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
  className?: string;
}

export function LikeButton({
  bookListId,
  initialLikeCount,
  initialIsLiked = false,
  showCount = true,
  size = 'md',
  variant = 'default',
  className,
}: LikeButtonProps) {
  const { data: session } = useSession();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLike = api.like.toggle.useMutation({
    onMutate: () => {
      // Optimistic update
      setIsLoading(true);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    },
    onSuccess: (result) => {
      setIsLiked(result.liked);
      setIsLoading(false);
    },
    onError: () => {
      // Revert optimistic update on error
      setIsLiked(isLiked);
      setLikeCount(initialLikeCount);
      setIsLoading(false);
    },
  });

  const handleClick = () => {
    if (!session) {
      // Redirect to sign in or show modal
      window.location.href = '/api/auth/signin';
      return;
    }

    toggleLike.mutate({ bookListId });
  };

  const sizeClasses = {
    sm: 'text-sm gap-1 px-2 py-1',
    md: 'text-base gap-2 px-3 py-2',
    lg: 'text-lg gap-2 px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'inline-flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors disabled:opacity-50',
          className
        )}
      >
        <Heart 
          className={cn(
            iconSizes[size],
            isLiked ? 'fill-red-500 text-red-500' : '',
            isLoading && 'animate-pulse'
          )} 
        />
        {showCount && (
          <span className="font-medium">{likeCount}</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center rounded-lg border transition-all duration-200 disabled:opacity-50',
        sizeClasses[size],
        isLiked
          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300',
        className
      )}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          isLiked ? 'fill-current' : '',
          isLoading && 'animate-pulse'
        )} 
      />
      {showCount && (
        <span className="font-medium">{likeCount}</span>
      )}
      {!showCount && (
        <span className="sr-only">
          {isLiked ? 'Unlike' : 'Like'} this list
        </span>
      )}
    </button>
  );
}