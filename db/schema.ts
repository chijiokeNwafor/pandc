import {
  integer,
  serial,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
export const guests = pgTable(
  'guests',
  {
    id: serial('id').notNull(),
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
export const organizer = pgTable('organizer', {
  id: integer('id').primaryKey(),
  email: text('email').notNull(),
  userId: text('user_id'),
  initializedAt: text('initialized_at').notNull(),
});
export const placement = pgTable('placement', {
  id: integer('id').primaryKey(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  size: integer('size').notNull(),
});

export const loginAttempts = pgTable('login_attempts', {
  id: integer('id').primaryKey(),
  bucket: integer('bucket').notNull(),
  attempts: integer('attempts').notNull(),
});
