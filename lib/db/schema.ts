import { pgTable, uuid, varchar, decimal, timestamp, boolean, date, text, pgEnum } from 'drizzle-orm/pg-core';

// Create ENUM for frequency
export const frequencyEnum = pgEnum('frequency_type', ['daily', 'weekly', 'monthly', 'one-time']);

// Chore Templates table
export const choreTemplates = pgTable('chore_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  frequency: frequencyEnum('frequency').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: varchar('created_by', { length: 100 }).default('user').notNull(),
});

// Chore Instances table
export const choreInstances = pgTable('chore_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => choreTemplates.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  frequency: frequencyEnum('frequency').notNull(),
  dueDate: date('due_date').notNull(),
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Payouts table
export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  date: timestamp('date').defaultNow().notNull(),
  createdBy: varchar('created_by', { length: 100 }).default('user').notNull(),
  notes: text('notes'),
});

// Type exports for TypeScript
export type ChoreTemplate = typeof choreTemplates.$inferSelect;
export type NewChoreTemplate = typeof choreTemplates.$inferInsert;
export type ChoreInstance = typeof choreInstances.$inferSelect;
export type NewChoreInstance = typeof choreInstances.$inferInsert;
export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;
export type Frequency = typeof frequencyEnum.enumValues[number];
