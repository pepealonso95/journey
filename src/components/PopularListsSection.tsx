import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, BookOpen, Heart, User } from 'lucide-react';
import { db } from '@/server/db';
import { bookLists, bookListItems, books, users } from '@/server/db/schema';
import { eq, desc, sql, and, gte } from 'drizzle-orm';

export async function PopularListsSection() {
  try {
    // Get popular lists for this week - only non-anonymous lists from authenticated users
    const popularLists = await db
      .select({
        id: bookLists.id,
        title: bookLists.title,
        description: bookLists.description,
        slug: bookLists.slug,
        likeCount: bookLists.likeCount,
        createdAt: bookLists.createdAt,
        user: {
          name: users.name,
          twitterHandle: users.twitterHandle,
          image: users.image,
        },
      })
      .from(bookLists)
      .innerJoin(users, eq(bookLists.userId, users.id)) // Only lists with valid users
      .where(and(
        eq(bookLists.isPublic, true),
        eq(bookLists.isAnonymous, false), // Only show owned lists
        gte(bookLists.createdAt, sql`NOW() - INTERVAL '7 days'`)
      ))
      .orderBy(desc(bookLists.likeCount), desc(bookLists.createdAt))
      .limit(3);

    // Get preview books for each list
    const listsWithBooks = await Promise.all(
      popularLists.map(async (list) => {
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
          books: listBooks.map(item => item.book).filter(Boolean),
        };
      })
    );

    if (listsWithBooks.length === 0) {
      return null;
    }

    return (
      <div className="mt-16">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <h3 className="text-2xl font-bold text-gray-900">Popular This Week</h3>
          </div>
          <p className="text-gray-600">Discover the most loved book lists in the community</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {listsWithBooks.map((list, index) => (
            <div
              key={list.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6"
            >
              {/* Ranking badge */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  'bg-orange-600 text-white'
                }`}>
                  #{index + 1}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Heart className="w-4 h-4" />
                  <span>{list.likeCount}</span>
                </div>
              </div>

              {/* List title and description */}
              <Link
                href={list.user?.twitterHandle ? `/profile/${list.user.twitterHandle}/${list.slug}` : `/share/${list.slug}`}
                className="group"
              >
                <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                  {list.title}
                </h4>
              </Link>
              
              {list.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {list.description}
                </p>
              )}

              {/* Book covers preview */}
              <div className="flex gap-1 mb-4">
                {list.books.slice(0, 4).map((book) => (
                  book && (
                    <div key={book.id} className="relative">
                      {book.thumbnail || book.medium || book.large ? (
                        <Image
                          src={book.thumbnail || book.medium || book.large || ''}
                          alt={book.title}
                          width={32}
                          height={48}
                          className="rounded shadow-sm"
                        />
                      ) : (
                        <div className="w-8 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <BookOpen className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>

              {/* Creator info */}
              {list.user && (
                <Link
                  href={`/profile/${list.user.twitterHandle}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {list.user.image ? (
                    <Image
                      src={list.user.image}
                      alt={list.user.name || list.user.twitterHandle || 'User'}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span>@{list.user.twitterHandle}</span>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/popular"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            View All Popular Lists
          </Link>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching popular lists:', error);
    return null;
  }
}