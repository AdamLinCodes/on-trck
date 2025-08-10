import { getDb } from '../db/client';
import { habit, habitCheckin, pendingMutations, taskInstance } from '../db/schema';
import { eq } from 'drizzle-orm';

// utils
const now = () => Date.now();
const isoDay = (d = new Date()) => d.toISOString().slice(0, 10);
const uuid = () => crypto.randomUUID();

/**
 * Ensure there's at least one habit in the DB for demo/testing.
 */
export async function ensureDemoHabit() {
  const db = await getDb();
  const rows = await db.select().from(habit).limit(1);
  if (rows.length === 0) {
    await db.insert(habit).values({
      id: 'demo-habit-id',
      name: 'Drink 2L water',
      createdAt: now(),
      archived: 0,
    });
  }
}

/**
 * Record a habit check-in for a given day.
 */
export async function createHabitCheckin(habitId: string, day = isoDay()) {
  const db = await getDb();
  const id = uuid();
  const ts = now();

  await db.insert(habitCheckin).values({ id, habitId, day, ts });

  // enqueue for future sync
  await db.insert(pendingMutations).values({
    id: uuid(),
    kind: 'habit_checkin.create',
    payloadJson: JSON.stringify({ id, habitId, day, ts }),
    ts: now(),
  });

  return id;
}

/**
 * Mark a task instance as complete.
 */
export async function completeTaskInstance(taskId: string, day = isoDay()) {
  const db = await getDb();
  const existing = await db
    .select()
    .from(taskInstance)
    .where(eq(taskInstance.taskId, taskId))
    .limit(1);

  const id = existing[0]?.id ?? uuid();
  if (!existing[0]) {
    await db.insert(taskInstance).values({ id, taskId, day, done: 1 });
  } else {
    await db
      .update(taskInstance)
      .set({ done: 1 })
      .where(eq(taskInstance.id, id));
  }

  await db.insert(pendingMutations).values({
    id: uuid(),
    kind: 'task_instance.complete',
    payloadJson: JSON.stringify({ id, taskId, day }),
    ts: now(),
  });

  return id;
}
