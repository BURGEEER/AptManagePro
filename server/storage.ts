import { type User, type InsertUser } from "@shared/schema";
import { PgStorage } from "./db-storage";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

// Use PostgreSQL storage implementation
export const storage = new PgStorage();
