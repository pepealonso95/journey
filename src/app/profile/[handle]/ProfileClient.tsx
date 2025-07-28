"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, BookOpen, ChevronDown, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import { useSession } from 'next-auth/react';

interface Book {
  id: string;
  title: string | null;
  thumbnail: string | null;
  medium: string | null;
  large: string | null;
}

interface BookList {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  likeCount: number;
  createdAt: Date;
  bookCount: number;
  books: Book[];
}

interface ProfileClientProps {
  handle: string;
  lists: BookList[];
  profileUserId: string; // User ID of the profile owner
}

type SortOption = 'newest' | 'oldest' | 'most-liked' | 'least-liked';

export function ProfileClient({ handle, lists, profileUserId }: ProfileClientProps) {
  const { data: session } = useSession();
  const [sortBy, setSortBy] = useState<SortOption>('most-liked');
  const [localLists, setLocalLists] = useState(lists);
  
  // Check if current user can edit this profile
  const canEdit = session?.user?.id === profileUserId;

  const deleteListMutation = api.bookList.delete.useMutation({
    onSuccess: (_, variables) => {
      // Remove the deleted list from local state
      setLocalLists(prev => prev.filter(list => list.id !== variables.id));
    },
    onError: (error) => {
      console.error('Failed to delete list:', error);
      alert('Failed to delete list. Please try again.');
    },
  });

  const sortOptions = [
    { value: 'newest' as const, label: 'Newest First' },
    { value: 'oldest' as const, label: 'Oldest First' },
    { value: 'most-liked' as const, label: 'Most Liked' },
    { value: 'least-liked' as const, label: 'Least Liked' },
  ];

  const sortedLists = [...localLists].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'most-liked':
        return (b.likeCount || 0) - (a.likeCount || 0);
      case 'least-liked':
        return (a.likeCount || 0) - (b.likeCount || 0);
      default:
        return 0;
    }
  });

  const handleDelete = async (listId: number) => {
    if (!confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
      return;
    }

    deleteListMutation.mutate({ id: listId });
  };

  if (localLists.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">No lists yet</p>
        <p className="text-gray-500">
          {canEdit ? "You haven't created any book lists yet." : "This user hasn't created any book lists."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Book Lists</h2>
        
        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2 text-sm">
              {sortOptions.find(option => option.value === sortBy)?.label}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`cursor-pointer text-gray-900 hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 ${sortBy === option.value ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-900'}`}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedLists.map((list) => (
          <div key={list.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200 group relative">
            {/* Action Menu for own lists */}
            {canEdit && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 bg-white/90 backdrop-blur-sm shadow-sm">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 bg-white border border-gray-200 shadow-lg">
                    <DropdownMenuItem
                      onClick={() => handleDelete(list.id)}
                      disabled={deleteListMutation.isPending}
                      className="text-red-600 focus:text-red-600 hover:text-red-600 focus:bg-gray-100 hover:bg-gray-100 bg-transparent cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                      {deleteListMutation.isPending ? 'Deleting...' : 'Delete List'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <Link href={`/profile/${handle}/${list.slug}`} className="block">
              <div className="flex gap-3">
                
                {/* Title and Description */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 pr-6">
                    {list.title}
                  </h3>
                  {list.description && (
                    <p className="text-gray-600 text-xs line-clamp-1 mt-0.5">
                      {list.description}
                    </p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{list.likeCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      <span>{list.bookCount}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(list.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Book Cover Previews */}
                <div className="flex gap-1 flex-shrink-0">
                  {list.books && list.books.length > 0 ? (
                    <>
                      {list.books.slice(0, 4).map((book) => (
                        <div key={book.id} className="relative">
                          {book.large || book.medium || book.thumbnail ? (
                            <Image
                              src={book.large || book.medium || book.thumbnail || ''}
                              alt={book.title || 'Book cover'}
                              width={36}
                              height={50}
                              className="object-cover rounded shadow-sm"
                              sizes="36px"
                            />
                          ) : (
                            <div className="w-9 h-[50px] bg-gray-200 rounded flex items-center justify-center">
                              <BookOpen className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ))}
                      {list.bookCount > 4 && (
                        <div className="w-9 h-[50px] bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-[10px] text-gray-500">+{list.bookCount - 3}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-9 h-[50px] bg-gray-100 rounded flex items-center justify-center">
                      <BookOpen className="w-3 h-3 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}