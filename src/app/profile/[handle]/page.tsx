import { notFound } from 'next/navigation';
import { db } from '@/server/db';
import { users, bookLists, bookListItems, books } from '@/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { ProfileClient } from './ProfileClient';
import { ProfileHeader } from './ProfileHeader';
import { Header } from '@/components/layout';

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle);

  try {
    // Get user profile
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        bio: users.bio,
        image: users.image,
        twitterHandle: users.twitterHandle,
        twitterProfileUrl: users.twitterProfileUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.twitterHandle, handle))
      .limit(1);

    if (!user.length) {
      notFound();
    }

    // Get user's public lists
    const userLists = await db
      .select({
        id: bookLists.id,
        title: bookLists.title,
        description: bookLists.description,
        slug: bookLists.slug,
        likeCount: bookLists.likeCount,
        createdAt: bookLists.createdAt,
        bookCount: sql<number>`count(${bookListItems.id})`,
      })
      .from(bookLists)
      .leftJoin(bookListItems, eq(bookLists.id, bookListItems.bookListId))
      .where(eq(bookLists.userId, user[0].id))
      .groupBy(bookLists.id)
      .orderBy(desc(bookLists.createdAt));

    // Get preview books for each list (first 4 books)
    const listsWithBooks = await Promise.all(
      userLists.map(async (list) => {
        const listBooks = await db
          .select({
            book: books,
            sortOrder: bookListItems.sortOrder,
          })
          .from(bookListItems)
          .leftJoin(books, eq(bookListItems.bookId, books.id))
          .where(eq(bookListItems.bookListId, list.id))
          .orderBy(bookListItems.sortOrder)
          .limit(4);

        return {
          ...list,
          books: listBooks
            .map(item => item.book)
            .filter((book): book is NonNullable<typeof book> => book !== null),
        };
      })
    );

    const userProfile = {
      ...user[0],
      lists: listsWithBooks,
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          {/* User Profile Header */}
          <ProfileHeader userProfile={userProfile} handle={handle} />

          {/* Book Lists */}
          <ProfileClient 
            handle={handle} 
            lists={userProfile.lists} 
            profileUserId={userProfile.id}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching user profile:', error);
    notFound();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle);
  
  try {
    const user = await db
      .select({
        name: users.name,
        bio: users.bio,
        image: users.image,
      })
      .from(users)
      .where(eq(users.twitterHandle, handle))
      .limit(1);
    
    if (!user.length) {
      return {
        title: `@${handle} - Journey`,
        description: `User profile for @${handle}`,
      };
    }
    
    return {
      title: `${user[0].name || `@${handle}`} - Journey`,
      description: user[0].bio || `Book lists by @${handle}`,
      openGraph: {
        title: `${user[0].name || `@${handle}`} - Journey`,
        description: user[0].bio || `Book lists by @${handle}`,
        images: user[0].image ? [user[0].image] : [],
      },
    };
  } catch {
    return {
      title: `@${handle} - Journey`,
      description: `User profile for @${handle}`,
    };
  }
}