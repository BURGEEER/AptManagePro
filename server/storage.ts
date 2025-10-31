import { 
  type User, type InsertUser,
  type Announcement, type InsertAnnouncement,
  type UtilityReading, type InsertUtilityReading,
  type Owner, type OwnerUnit, type Unit
} from "@shared/schema";
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

  // Owner methods
  getOwnerById(id: string): Promise<Owner | null>;
  getOwnerUnitsByOwnerId(ownerId: string): Promise<OwnerUnit[]>;

  // Unit methods
  getUnitsByPropertyId(propertyId: string): Promise<Unit[]>;

  // Announcement methods
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getAnnouncementById(id: string): Promise<Announcement | null>;
  getActiveAnnouncements(): Promise<Announcement[]>;
  updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement | null>;
  deleteAnnouncement(id: string): Promise<boolean>;

  // Utility Reading methods
  createUtilityReading(reading: InsertUtilityReading): Promise<UtilityReading>;
  getUtilityReadingsByUnitId(unitId: string): Promise<UtilityReading[]>;
  getLatestUtilityReadings(): Promise<UtilityReading[]>;
  updateUtilityReading(id: string, reading: Partial<InsertUtilityReading>): Promise<UtilityReading | null>;
  deleteUtilityReading(id: string): Promise<boolean>;
}

// Use PostgreSQL storage implementation
export const storage = new PgStorage();
