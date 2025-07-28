import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, BookOpen, Clock, User } from 'lucide-react';
import { db } from '@/server/db';
import { bookLists, bookListItems, books, users } from '@/server/db/schema';
import { eq, desc, sql, and, gte } from 'drizzle-orm';
import { LikeButton } from '@/components/ui/LikeButton';

export default async function PopularPage({
  searchParams,
}: {
  searchParams: Promise<{ timeframe?: 'week' | 'month' | 'all' }>;
}) {
  const { timeframe = 'week' } = await searchParams;
  
  // Build date filter
  let dateFilter = sql`true`;
  if (timeframe === 'week') {
    dateFilter = gte(bookLists.createdAt, sql`NOW() - INTERVAL '7 days'`);
  } else if (timeframe === 'month') {
    dateFilter = gte(bookLists.createdAt, sql`NOW() - INTERVAL '30 days'`);
  }

  // Get popular lists
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
    .leftJoin(users, eq(bookLists.userId, users.id))
    .where(and(
      eq(bookLists.isPublic, true),
      eq(bookLists.isAnonymous, false), // Only show owned lists
      dateFilter
    ))
    .orderBy(desc(bookLists.likeCount), desc(bookLists.createdAt))
    .limit(20);

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

  const timeframeLabels = {
    week: 'This Week',
    month: 'This Month',
    all: 'All Time',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <h1 className="text-4xl font-bold text-gray-900">Popular Lists</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Discover the most loved book lists in the community
          </p>
        </div>

        {/* Timeframe Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(timeframeLabels).map(([key, label]) => (
              <Link
                key={key}
                href={`/popular?timeframe=${key}`}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeframe === key
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Popular Lists */}
        {listsWithBooks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No lists yet
            </h2>
            <p className="text-gray-600">
              Be the first to create a popular list this {timeframe === 'week' ? 'week' : timeframe === 'month' ? 'month' : 'time'}!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {listsWithBooks.map((list, index) => (
              <div
                key={list.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="p-8">
                  <div className="flex items-start gap-6">
                    {/* Ranking Badge */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        #{index + 1}
                      </div>
                    </div>

                    {/* List Content */}
                    <div className="flex-grow">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Text Content */}
                        <div className="flex-grow">
                          <Link
                            href={list.user?.twitterHandle ? `/profile/${list.user.twitterHandle}/${list.slug}` : `/share/${list.slug}`}
                            className="group"
                          >
                            <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-3">
                              {list.title}
                            </h2>
                          </Link>
                          
                          {list.description && (
                            <p className="text-gray-700 mb-4 leading-relaxed">
                              {list.description}
                            </p>
                          )}

                          {/* Creator Info */}
                          {list.user && (
                            <Link
                              href={`/profile/${list.user.twitterHandle}`}
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-4"
                            >
                              {list.user.image ? (
                                <Image
                                  src={list.user.image}
                                  alt={list.user.name || list.user.twitterHandle || 'User'}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              ) : (
                                <User className="w-6 h-6" />
                              )}
                              <span className="font-medium">
                                @{list.user.twitterHandle}
                              </span>
                            </Link>
                          )}

                          {/* Actions and Meta */}
                          <div className="flex flex-wrap items-center gap-4">
                            <LikeButton
                              bookListId={list.id}
                              initialLikeCount={list.likeCount}
                              size="sm"
                              variant="minimal"
                            />
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <BookOpen className="w-4 h-4" />
                              <span>{list.books.length} books</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(list.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Book Covers Preview */}
                        <div className="flex-shrink-0">
                          <div className="flex gap-2">
                            {list.books.slice(0, 4).map((book, bookIndex) => (
                              book && (
                                <div key={book.id} className="relative">
                                  {book.thumbnail || book.medium || book.large ? (
                                    <Image
                                      src={book.thumbnail || book.medium || book.large || ''}
                                      alt={book.title}
                                      width={60}
                                      height={90}
                                      className="rounded-lg shadow-sm"
                                    />
                                  ) : (
                                    <div className="w-15 h-22.5 bg-gray-200 rounded-lg flex items-center justify-center">
                                      <BookOpen className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                  {bookIndex === 3 && list.books.length > 4 && (
                                    <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">
                                        +{list.books.length - 4}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Create Your Own List
          </h2>
          <p className="text-gray-600 mb-6">
            Share your favorite books and join the conversation
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            <BookOpen className="w-5 h-5" />
            Create a List
          </Link>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Popular Book Lists - Journey',
  description: 'Discover the most loved book lists in the reading community',
  openGraph: {
    title: 'Popular Book Lists - Journey',
    description: 'Discover the most loved book lists in the reading community',
  },
};