// lib/db/client.ts
import { openDatabaseAsync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/op-sqlite';

export async function getDb() {
  const sqlite = await openDatabaseAsync('ontrck.db');
  return drizzle(sqlite);
}
