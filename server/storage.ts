import { 
  type User, type InsertUser,
  type Announcement, type InsertAnnouncement,
  type UtilityReading, type InsertUtilityReading,
  type Owner, type OwnerUnit, type Unit,
  type Project, type InsertProject,
  type Contractor, type InsertContractor,
  type DenrDocument, type InsertDenrDocument,
  type Vendor, type InsertVendor,
  type Settings, type InsertSettings,
  type PasswordResetToken, type InsertPasswordResetToken
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
  
  // Password reset methods
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | null>;
  markTokenAsUsed(tokenId: string): Promise<void>;
  getUserByEmail(email: string): Promise<User | undefined>;
  deleteExpiredTokens(): Promise<void>;

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

  // Project methods
  createProject(project: InsertProject): Promise<Project>;
  getProjectById(id: string): Promise<Project | null>;
  getProjectsByPropertyId(propertyId: string): Promise<Project[]>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | null>;
  deleteProject(id: string): Promise<boolean>;

  // Contractor methods
  createContractor(contractor: InsertContractor): Promise<Contractor>;
  getContractorById(id: string): Promise<Contractor | null>;
  getContractorsByPropertyId(propertyId: string): Promise<Contractor[]>;
  updateContractor(id: string, contractor: Partial<InsertContractor>): Promise<Contractor | null>;
  deleteContractor(id: string): Promise<boolean>;

  // DENR Document methods
  createDenrDocument(document: InsertDenrDocument): Promise<DenrDocument>;
  getDenrDocumentById(id: string): Promise<DenrDocument | null>;
  getDenrDocumentsByPropertyId(propertyId: string): Promise<DenrDocument[]>;
  updateDenrDocument(id: string, document: Partial<InsertDenrDocument>): Promise<DenrDocument | null>;
  deleteDenrDocument(id: string): Promise<boolean>;

  // Vendor methods
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  getVendorById(id: string): Promise<Vendor | null>;
  getVendorsByPropertyId(propertyId: string): Promise<Vendor[]>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor | null>;
  deleteVendor(id: string): Promise<boolean>;

  // Settings methods
  createSettings(settings: InsertSettings): Promise<Settings>;
  getSettingsByUserId(userId: string): Promise<Settings | null>;
  updateSettings(id: string, settings: Partial<InsertSettings>): Promise<Settings | null>;
  upsertSettings(userId: string, settings: Partial<InsertSettings>): Promise<Settings>;
}

// Use PostgreSQL storage implementation
export const storage = new PgStorage();
