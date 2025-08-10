// lib/db/init.ts
import { openDatabaseAsync } from 'expo-sqlite';

export async function initializeDb() {
  const db = await openDatabaseAsync('ontrck.db');

  await db.execAsync(`
    PRAGMA journal_mode = wal;

    CREATE TABLE IF NOT EXISTS habit (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      archived INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS habit_checkin (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      day TEXT NOT NULL,
      ts INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      due TEXT,
      done INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS task_instance (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      day TEXT NOT NULL,
      done INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS metric_snapshot (
      id TEXT PRIMARY KEY,
      day TEXT NOT NULL,
      metric TEXT NOT NULL,
      value_num REAL,
      value_text TEXT,
      ts INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_mutations (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      ts INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_habit_checkin_day ON habit_checkin(day);
    CREATE INDEX IF NOT EXISTS idx_task_instance_day ON task_instance(day);
    CREATE INDEX IF NOT EXISTS idx_metric_snapshot_day ON metric_snapshot(day);
  `);
}
