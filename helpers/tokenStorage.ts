import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export const initTokenStorage = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync("app.db");

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS auth (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  }
  return db;
};

export const getToken = async (): Promise<string | null> => {
  try {
    if (!db) await initTokenStorage();

    const result = await db!.getFirstAsync<{ value: string }>(
      "SELECT value FROM auth WHERE key = ?",
      ["user"],
    );

    if (result?.value) {
      const user = JSON.parse(result.value);
      return user?.token ?? null;
    }

    return null;
  } catch (error) {
    console.error("Error getting token from SQLite:", error);
    return null;
  }
};

export const setUser = async (userObject: any): Promise<void> => {
  try {
    if (!db) await initTokenStorage();

    await db!.runAsync(
      "INSERT OR REPLACE INTO auth (key, value) VALUES (?, ?)",
      ["user", JSON.stringify(userObject)],
    );
  } catch (error) {
    console.error("Error setting user in SQLite:", error);
    throw error;
  }
};

export const getUser = async (): Promise<any | null> => {
  try {
    if (!db) await initTokenStorage();

    const result = await db!.getFirstAsync<{ value: string }>(
      "SELECT value FROM auth WHERE key = ?",
      ["user"],
    );

    return result?.value ? JSON.parse(result.value) : null;
  } catch (error) {
    console.error("Error getting user from SQLite:", error);
    return null;
  }
};

export const removeUser = async (): Promise<void> => {
  try {
    if (!db) await initTokenStorage();

    await db!.runAsync("DELETE FROM auth WHERE key = ?", ["user"]);
  } catch (error) {
    console.error("Error removing user from SQLite:", error);
    throw error;
  }
};
