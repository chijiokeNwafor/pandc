import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
export const guests = sqliteTable(
  'guests',
  {
    token: text('token').primaryKey(),
    name: text('name').notNull(),
    handle: text('handle').notNull().default(''),
    location: text('location').notNull().default(''),
    dedupeKey: text('dedupe_key').notNull(),
    createdAt: text('created_at').notNull(),
    checkedInAt: text('checked_in_at'),
  },
  (table) => [uniqueIndex('guests_dedupe_unique').on(table.dedupeKey)],
);
export const organizer = sqliteTable('organizer', {
  id: integer('id').primaryKey(),
  email: text('email').notNull(),
  userId: text('user_id'),
  initializedAt: text('initialized_at').notNull(),
});
export const placement = sqliteTable('placement', {
  id: integer('id').primaryKey(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  size: integer('size').notNull(),
});
