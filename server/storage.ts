import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { users, type User, type InsertUser } from "@shared/schema";
import { eq } from "drizzle-orm";
import path from "path";

const sqlite = new Database(path.join(process.cwd(), "skyless.db"));
const db = drizzle(sqlite);

// Initialize database
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    wallet_address TEXT UNIQUE,
    connection_type TEXT CHECK(connection_type IN ('email', 'wallet', 'anonymous')) NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()) NOT NULL
  );
  
  CREATE INDEX IF NOT EXISTS idx_wallet_address ON users(wallet_address);
  CREATE INDEX IF NOT EXISTS idx_email ON users(email);
`);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
}

export class SQLiteStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
}

export const storage = new SQLiteStorage();
