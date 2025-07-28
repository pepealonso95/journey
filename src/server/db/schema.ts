import { relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgTableCreator,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
  boolean,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const createTable = pgTableCreator((name) => `journey_${name}`);

export const users = createTable('user', {
  id: varchar('id', { length: 255 }).notNull().primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  emailVerified: timestamp('emailVerified', {
    mode: 'date',
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar('image', { length: 255 }),
  username: varchar('username', { length: 50 }).unique(),
  bio: text('bio'),
  twitterHandle: varchar('twitter_handle', { length: 50 }).unique(),
  twitterProfileUrl: varchar('twitter_profile_url', { length: 255 }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});





export const books = createTable('book', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(), // Google Books ID
  title: varchar('title', { length: 500 }).notNull(),
  authors: text('authors'), // JSON array of authors
  description: text('description'),
  publishedDate: varchar('publishedDate', { length: 20 }),
  thumbnail: varchar('thumbnail', { length: 1000 }),
  smallThumbnail: varchar('smallThumbnail', { length: 1000 }),
  medium: varchar('medium', { length: 1000 }),
  large: varchar('large', { length: 1000 }),
  extraLarge: varchar('extraLarge', { length: 1000 }),
  isbn10: varchar('isbn10', { length: 20 }),
  isbn13: varchar('isbn13', { length: 20 }),
  pageCount: integer('pageCount'),
  categories: text('categories'), // JSON array of categories
  language: varchar('language', { length: 10 }),
  previewLink: varchar('previewLink', { length: 1000 }),
  infoLink: varchar('infoLink', { length: 1000 }),
  canonicalVolumeLink: varchar('canonicalVolumeLink', { length: 1000 }),
  lastAccessed: timestamp('last_accessed').default(sql`CURRENT_TIMESTAMP`),
  accessCount: integer('access_count').default(0).notNull(),
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const bookLists = createTable(
  'bookList',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 100 }).notNull(),
    description: text('description'),
    userId: varchar('userId', { length: 255 })
      .references(() => users.id), // Made nullable for anonymous lists
    isPublic: boolean('isPublic').default(true).notNull(),
    isAnonymous: boolean('isAnonymous').default(false).notNull(),
    slug: varchar('slug', { length: 150 }).notNull().unique(),
    expiresAt: timestamp('expires_at'), // For anonymous list cleanup
    likeCount: integer('like_count').default(0).notNull(),
    createdAt: timestamp('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (bookList) => ({
    userIdIdx: index('bookList_userId_idx').on(bookList.userId),
    slugIdx: index('bookList_slug_idx').on(bookList.slug),
    isAnonymousIdx: index('bookList_isAnonymous_idx').on(bookList.isAnonymous),
    expiresAtIdx: index('bookList_expiresAt_idx').on(bookList.expiresAt),
  })
);

export const bookListItems = createTable(
  'bookListItem',
  {
    id: serial('id').primaryKey(),
    bookListId: integer('bookListId')
      .notNull()
      .references(() => bookLists.id, { onDelete: 'cascade' }),
    bookId: varchar('bookId', { length: 255 })
      .notNull()
      .references(() => books.id),
    sortOrder: integer('sortOrder').notNull(), // 0-3 for reading order (4 books)
    customDescription: text('customDescription'), // User's note about why this book is included
    createdAt: timestamp('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (item) => ({
    bookListIdIdx: index('bookListItem_bookListId_idx').on(item.bookListId),
    uniqueBookInList: index('bookListItem_unique_idx').on(
      item.bookListId,
      item.bookId
    ),
  })
);

export const bookListLikes = createTable(
  'bookListLike',
  {
    id: serial('id').primaryKey(),
    userId: varchar('userId', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bookListId: integer('bookListId')
      .notNull()
      .references(() => bookLists.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (like) => ({
    userIdIdx: index('bookListLike_userId_idx').on(like.userId),
    bookListIdIdx: index('bookListLike_bookListId_idx').on(like.bookListId),
    uniqueLike: index('bookListLike_unique_idx').on(like.userId, like.bookListId),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookLists: many(bookLists),
  likes: many(bookListLikes),
}));

export const bookListsRelations = relations(bookLists, ({ one, many }) => ({
  user: one(users, { fields: [bookLists.userId], references: [users.id] }),
  items: many(bookListItems),
  likes: many(bookListLikes),
}));

export const bookListItemsRelations = relations(bookListItems, ({ one }) => ({
  bookList: one(bookLists, {
    fields: [bookListItems.bookListId],
    references: [bookLists.id],
  }),
  book: one(books, { fields: [bookListItems.bookId], references: [books.id] }),
}));

export const bookListLikesRelations = relations(bookListLikes, ({ one }) => ({
  user: one(users, { fields: [bookListLikes.userId], references: [users.id] }),
  bookList: one(bookLists, { fields: [bookListLikes.bookListId], references: [bookLists.id] }),
}));

// Search cache table for temporary search results
export const searchCache = createTable(
  'searchCache',
  {
    id: serial('id').primaryKey(),
    query: varchar('query', { length: 255 }).notNull(),
    results: text('results').notNull(), // JSON array of book IDs
    resultCount: integer('resultCount').notNull(),
    createdAt: timestamp('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (cache) => ({
    queryIdx: index('searchCache_query_idx').on(cache.query),
    expiresAtIdx: index('searchCache_expiresAt_idx').on(cache.expiresAt),
  })
);

export const booksRelations = relations(books, ({ many }) => ({
  listItems: many(bookListItems),
}));