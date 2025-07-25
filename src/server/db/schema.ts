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
import { type AdapterAccount } from 'next-auth/adapters';
import { createId } from '@paralleldrive/cuid2';

export const createTable = pgTableCreator((name) => `journey_${name}`);

export const users = createTable('user', {
  id: varchar('id', { length: 255 }).notNull().primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  emailVerified: timestamp('emailVerified', {
    mode: 'date',
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar('image', { length: 255 }),
  username: varchar('username', { length: 50 }).unique(),
  bio: text('bio'),
});

export const accounts = createTable(
  'account',
  {
    userId: varchar('userId', { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar('type', { length: 255 })
      .$type<AdapterAccount['type']>()
      .notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('providerAccountId', {
      length: 255,
    }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index('account_userId_idx').on(account.userId),
  })
);

export const sessions = createTable(
  'session',
  {
    sessionToken: varchar('sessionToken', { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar('userId', { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (session) => ({
    userIdIdx: index('session_userId_idx').on(session.userId),
  })
);

export const verificationTokens = createTable(
  'verificationToken',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

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
      .notNull()
      .references(() => users.id),
    isPublic: boolean('isPublic').default(true).notNull(),
    slug: varchar('slug', { length: 150 }).notNull(),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  bookLists: many(bookLists),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const bookListsRelations = relations(bookLists, ({ one, many }) => ({
  user: one(users, { fields: [bookLists.userId], references: [users.id] }),
  items: many(bookListItems),
}));

export const bookListItemsRelations = relations(bookListItems, ({ one }) => ({
  bookList: one(bookLists, {
    fields: [bookListItems.bookListId],
    references: [bookLists.id],
  }),
  book: one(books, { fields: [bookListItems.bookId], references: [books.id] }),
}));

export const booksRelations = relations(books, ({ many }) => ({
  listItems: many(bookListItems),
}));