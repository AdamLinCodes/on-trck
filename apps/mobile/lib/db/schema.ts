// lib/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const habit = sqliteTable('habit', {
  id: text('id').primaryKey(),                 // uuid
  name: text('name').notNull(),
  createdAt: integer('created_at').notNull(),  // epoch ms
  archived: integer('archived').default(0),    // 0/1
});

export const habitCheckin = sqliteTable('habit_checkin', {
  id: text('id').primaryKey(),                 // uuid
  habitId: text('habit_id').notNull(),
  day: text('day').notNull(),                  // 'YYYY-MM-DD'
  ts: integer('ts').notNull(),                 // epoch ms
});

export const task = sqliteTable('task', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: integer('created_at').notNull(),
  due: text('due'),                             // ISO string
  done: integer('done').default(0),
});

export const taskInstance = sqliteTable('task_instance', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull(),
  day: text('day').notNull(),                  // 'YYYY-MM-DD'
  done: integer('done').default(0),
});

export const metricSnapshot = sqliteTable('metric_snapshot', {
  id: text('id').primaryKey(),
  day: text('day').notNull(),                  // 'YYYY-MM-DD'
  metric: text('metric').notNull(),            // e.g. weight, steps
  valueNum: real('value_num'),                 // numeric value
  valueText: text('value_text'),               // optional text
  ts: integer('ts').notNull(),
});

// offline-first queue for future sync
export const pendingMutations = sqliteTable('pending_mutations', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),                // e.g. habit_checkin.create
  payloadJson: text('payload_json').notNull(), // stringified JSON
  ts: integer('ts').notNull(),
});
