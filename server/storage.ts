import { type User, type InsertUser } from "@shared/schema";
import { PgStorage } from "./db-storage";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User authentication methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | null>;
  verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean>;
}

// Use PostgreSQL storage implementation
export const storage = new PgStorage();
