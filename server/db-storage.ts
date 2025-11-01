import { db } from "./db";
import { 
  properties,
  units,
  owners,
  tenants,
  maintenanceRequests,
  transactions,
  communications,
  announcements,
  utilityReadings,
  ownerUnits,
  parkingSlots,
  accountPayables,
  users,
  reports,
  projects,
  contractors,
  denrDocuments,
  vendors,
  settings,
  passwordResetTokens,
  documents,
  notifications,
  auditLogs,
  type Property, type InsertProperty,
  type Unit, type InsertUnit,
  type Owner, type InsertOwner,
  type Tenant, type InsertTenant,
  type MaintenanceRequest, type InsertMaintenanceRequest,
  type Transaction, type InsertTransaction,
  type Communication, type InsertCommunication,
  type Announcement, type InsertAnnouncement,
  type UtilityReading, type InsertUtilityReading,
  type OwnerUnit, type InsertOwnerUnit,
  type ParkingSlot, type InsertParkingSlot,
  type AccountPayable, type InsertAccountPayable,
  type User, type InsertUser,
  type Report, type InsertReport,
  type Project, type InsertProject,
  type Contractor, type InsertContractor,
  type DenrDocument, type InsertDenrDocument,
  type Vendor, type InsertVendor,
  type Settings, type InsertSettings,
  type PasswordResetToken, type InsertPasswordResetToken,
  type Document, type InsertDocument,
  type Notification, type InsertNotification,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { eq, desc, and, sql, or, lt } from "drizzle-orm";
import { IStorage } from "./storage";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";

export class PgStorage implements IStorage {
  // User methods with proper authentication
  async getUser(id: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.id, id));
    return result || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.username, username));
    return result || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [result] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword
    }).returning();
    return result;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | null> {
    // If password is being updated, hash it
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
    const [result] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result || null;
  }

  async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Password reset methods
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    // Hash the token before storing
    const hashedToken = await bcrypt.hash(token.token, 10);
    const [result] = await db.insert(passwordResetTokens).values({
      ...token,
      token: hashedToken
    }).returning();
    return result;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    // Get all non-used, non-expired tokens and check against the hashed token
    const tokens = await db.select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.used, false)
      ));
    
    // Check each token to find a match
    for (const dbToken of tokens) {
      const isMatch = await bcrypt.compare(token, dbToken.token);
      if (isMatch) {
        // Check if expired
        if (new Date(dbToken.expiresAt) < new Date()) {
          return null; // Token is expired
        }
        return dbToken;
      }
    }
    
    return null;
  }

  async markTokenAsUsed(tokenId: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result || undefined;
  }

  async deleteExpiredTokens(): Promise<void> {
    await db.delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, new Date()));
  }

  // Properties
  async createProperty(property: InsertProperty): Promise<Property> {
    const [result] = await db.insert(properties).values(property).returning();
    return result;
  }

  async getPropertyById(id: string): Promise<Property | null> {
    const [result] = await db.select().from(properties).where(eq(properties.id, id));
    return result || null;
  }

  async getAllProperties(): Promise<Property[]> {
    return db.select().from(properties);
  }

  async updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | null> {
    const [result] = await db.update(properties).set(property).where(eq(properties.id, id)).returning();
    return result || null;
  }

  async deleteProperty(id: string): Promise<boolean> {
    const result = await db.delete(properties).where(eq(properties.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Units
  async createUnit(unit: InsertUnit): Promise<Unit> {
    const [result] = await db.insert(units).values(unit).returning();
    return result;
  }

  async getUnitById(id: string): Promise<Unit | null> {
    const [result] = await db.select().from(units).where(eq(units.id, id));
    return result || null;
  }

  async getUnitsByPropertyId(propertyId: string): Promise<Unit[]> {
    return db.select().from(units).where(eq(units.propertyId, propertyId));
  }

  async getAllUnits(): Promise<Unit[]> {
    return db.select().from(units);
  }

  async updateUnit(id: string, unit: Partial<InsertUnit>): Promise<Unit | null> {
    const [result] = await db.update(units).set(unit).where(eq(units.id, id)).returning();
    return result || null;
  }

  async deleteUnit(id: string): Promise<boolean> {
    const result = await db.delete(units).where(eq(units.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Owners
  async createOwner(owner: InsertOwner): Promise<Owner> {
    const [result] = await db.insert(owners).values(owner).returning();
    return result;
  }

  async getOwnerById(id: string): Promise<Owner | null> {
    const [result] = await db.select().from(owners).where(eq(owners.id, id));
    return result || null;
  }

  async getAllOwners(): Promise<Owner[]> {
    return db.select().from(owners);
  }

  async updateOwner(id: string, owner: Partial<InsertOwner>): Promise<Owner | null> {
    const [result] = await db.update(owners).set(owner).where(eq(owners.id, id)).returning();
    return result || null;
  }

  async deleteOwner(id: string): Promise<boolean> {
    const result = await db.delete(owners).where(eq(owners.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Owner Units
  async createOwnerUnit(ownerUnit: InsertOwnerUnit): Promise<OwnerUnit> {
    const [result] = await db.insert(ownerUnits).values(ownerUnit).returning();
    return result;
  }

  async getOwnerUnitsByOwnerId(ownerId: string): Promise<OwnerUnit[]> {
    return db.select().from(ownerUnits).where(eq(ownerUnits.ownerId, ownerId));
  }

  async getOwnerUnitsByUnitId(unitId: string): Promise<OwnerUnit[]> {
    return db.select().from(ownerUnits).where(eq(ownerUnits.unitId, unitId));
  }

  async deleteOwnerUnit(id: string): Promise<boolean> {
    const result = await db.delete(ownerUnits).where(eq(ownerUnits.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Parking Slots
  async createParkingSlot(slot: InsertParkingSlot): Promise<ParkingSlot> {
    const [result] = await db.insert(parkingSlots).values(slot).returning();
    return result;
  }

  async getParkingSlotsByPropertyId(propertyId: string): Promise<ParkingSlot[]> {
    return db.select().from(parkingSlots).where(eq(parkingSlots.propertyId, propertyId));
  }

  async getParkingSlotsByOwnerId(ownerId: string): Promise<ParkingSlot[]> {
    return db.select().from(parkingSlots).where(eq(parkingSlots.ownerId, ownerId));
  }

  async updateParkingSlot(id: string, slot: Partial<InsertParkingSlot>): Promise<ParkingSlot | null> {
    const [result] = await db.update(parkingSlots).set(slot).where(eq(parkingSlots.id, id)).returning();
    return result || null;
  }

  async deleteParkingSlot(id: string): Promise<boolean> {
    const result = await db.delete(parkingSlots).where(eq(parkingSlots.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Tenants
  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [result] = await db.insert(tenants).values(tenant).returning();
    return result;
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    const [result] = await db.select().from(tenants).where(eq(tenants.id, id));
    return result || null;
  }

  async getTenantsByUnitId(unitId: string): Promise<Tenant[]> {
    return db.select().from(tenants).where(eq(tenants.unitId, unitId));
  }

  async getTenantsByOwnerId(ownerId: string): Promise<Tenant[]> {
    return db.select().from(tenants).where(eq(tenants.ownerId, ownerId));
  }

  async getAllTenants(): Promise<Tenant[]> {
    return db.select().from(tenants);
  }

  async updateTenant(id: string, tenant: Partial<InsertTenant>): Promise<Tenant | null> {
    const [result] = await db.update(tenants).set(tenant).where(eq(tenants.id, id)).returning();
    return result || null;
  }

  async deleteTenant(id: string): Promise<boolean> {
    const result = await db.delete(tenants).where(eq(tenants.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Maintenance Requests
  async createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    const [result] = await db.insert(maintenanceRequests).values(request).returning();
    return result;
  }

  async getMaintenanceRequestById(id: string): Promise<MaintenanceRequest | null> {
    const [result] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, id));
    return result || null;
  }

  async getAllMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    return db.select().from(maintenanceRequests).orderBy(desc(maintenanceRequests.createdAt));
  }

  async getMaintenanceRequestsByUnitId(unitId: string): Promise<MaintenanceRequest[]> {
    return db.select().from(maintenanceRequests).where(eq(maintenanceRequests.unitId, unitId));
  }

  async getMaintenanceRequestsByStatus(status: string): Promise<MaintenanceRequest[]> {
    return db.select().from(maintenanceRequests).where(eq(maintenanceRequests.status, status));
  }

  async updateMaintenanceRequest(id: string, request: Partial<InsertMaintenanceRequest>): Promise<MaintenanceRequest | null> {
    const [result] = await db.update(maintenanceRequests).set(request).where(eq(maintenanceRequests.id, id)).returning();
    return result || null;
  }

  async deleteMaintenanceRequest(id: string): Promise<boolean> {
    const result = await db.delete(maintenanceRequests).where(eq(maintenanceRequests.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Utility Readings
  async createUtilityReading(reading: InsertUtilityReading): Promise<UtilityReading> {
    const [result] = await db.insert(utilityReadings).values(reading).returning();
    return result;
  }

  async getUtilityReadingsByUnitId(unitId: string): Promise<UtilityReading[]> {
    return db.select().from(utilityReadings).where(eq(utilityReadings.unitId, unitId));
  }

  async getLatestUtilityReadings(): Promise<UtilityReading[]> {
    return db.select().from(utilityReadings).orderBy(desc(utilityReadings.readingDate)).limit(20);
  }

  async updateUtilityReading(id: string, reading: Partial<InsertUtilityReading>): Promise<UtilityReading | null> {
    const [result] = await db.update(utilityReadings).set(reading).where(eq(utilityReadings.id, id)).returning();
    return result || null;
  }

  async deleteUtilityReading(id: string): Promise<boolean> {
    const result = await db.delete(utilityReadings).where(eq(utilityReadings.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Transactions
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const refNumber = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const [result] = await db.insert(transactions).values({ ...transaction, referenceNumber: refNumber }).returning();
    return result;
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const [result] = await db.select().from(transactions).where(eq(transactions.id, id));
    return result || null;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async getTransactionsByOwnerId(ownerId: string): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.ownerId, ownerId));
  }

  async getTransactionsByStatus(status: string): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.status, status));
  }

  async getTransactionsWithFilters(filters: {
    status?: string;
    ownerId?: string;
    unitId?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
    propertyId?: string;
    ownerIds?: string[];
    unitIds?: string[];
    page?: number;
    limit?: number;
  }): Promise<{ data: Transaction[]; total: number; page: number; totalPages: number }> {
    let query = db.select().from(transactions);
    let countQuery = db.select({ count: sql<number>`cast(count(*) as int)` }).from(transactions);
    
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(transactions.status, filters.status));
    }
    if (filters.ownerId) {
      conditions.push(eq(transactions.ownerId, filters.ownerId));
    }
    if (filters.unitId) {
      conditions.push(eq(transactions.unitId, filters.unitId));
    }
    if (filters.paymentMethod) {
      conditions.push(eq(transactions.paymentMethod, filters.paymentMethod));
    }
    if (filters.category) {
      conditions.push(eq(transactions.category, filters.category));
    }
    if (filters.startDate) {
      conditions.push(sql`${transactions.createdAt} >= ${filters.startDate}::date`);
    }
    if (filters.endDate) {
      conditions.push(sql`${transactions.createdAt} <= ${filters.endDate}::date + interval '1 day'`);
    }
    if (filters.ownerIds && filters.ownerIds.length > 0) {
      conditions.push(sql`${transactions.ownerId} = ANY(${filters.ownerIds})`);
    }
    if (filters.unitIds && filters.unitIds.length > 0) {
      conditions.push(sql`${transactions.unitId} = ANY(${filters.unitIds})`);
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
      countQuery = countQuery.where(and(...conditions));
    }
    
    const [{ count }] = await countQuery;
    const total = count || 0;
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);
    
    query = query.orderBy(desc(transactions.createdAt)).limit(limit).offset(offset);
    
    const data = await query;
    
    return { data, total, page, totalPages };
  }

  async getTransactionsSummary(filters: {
    status?: string;
    ownerId?: string;
    unitId?: string;
    startDate?: string;
    endDate?: string;
    ownerIds?: string[];
    unitIds?: string[];
  }): Promise<{
    totalTransactions: number;
    totalAmount: number;
    completedAmount: number;
    pendingAmount: number;
    completedCount: number;
    pendingCount: number;
    overdueCount: number;
  }> {
    const conditions = [];
    
    if (filters.ownerId) {
      conditions.push(eq(transactions.ownerId, filters.ownerId));
    }
    if (filters.unitId) {
      conditions.push(eq(transactions.unitId, filters.unitId));
    }
    if (filters.startDate) {
      conditions.push(sql`${transactions.createdAt} >= ${filters.startDate}::date`);
    }
    if (filters.endDate) {
      conditions.push(sql`${transactions.createdAt} <= ${filters.endDate}::date + interval '1 day'`);
    }
    if (filters.ownerIds && filters.ownerIds.length > 0) {
      conditions.push(sql`${transactions.ownerId} = ANY(${filters.ownerIds})`);
    }
    if (filters.unitIds && filters.unitIds.length > 0) {
      conditions.push(sql`${transactions.unitId} = ANY(${filters.unitIds})`);
    }
    
    let baseQuery = db.select().from(transactions);
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }
    
    const allTransactions = await baseQuery;
    const now = new Date();
    
    const completed = allTransactions.filter(t => t.status === 'completed');
    const pending = allTransactions.filter(t => t.status === 'pending');
    const overdue = allTransactions.filter(t => {
      if (t.status === 'pending' && t.dueDate) {
        const dueDate = new Date(t.dueDate);
        return dueDate < now;
      }
      return false;
    });
    
    const totalAmount = allTransactions.reduce((sum, t) => {
      const amount = parseFloat(t.amount?.toString() || '0');
      return sum + Math.abs(amount);
    }, 0);
    
    const completedAmount = completed.reduce((sum, t) => {
      const amount = parseFloat(t.amount?.toString() || '0');
      return sum + Math.abs(amount);
    }, 0);
    
    const pendingAmount = pending.reduce((sum, t) => {
      const amount = parseFloat(t.amount?.toString() || '0');
      return sum + Math.abs(amount);
    }, 0);
    
    return {
      totalTransactions: allTransactions.length,
      totalAmount,
      completedAmount,
      pendingAmount,
      completedCount: completed.length,
      pendingCount: pending.length,
      overdueCount: overdue.length,
    };
  }

  async updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | null> {
    const [result] = await db.update(transactions).set(transaction).where(eq(transactions.id, id)).returning();
    return result || null;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Communications
  async createCommunication(communication: InsertCommunication): Promise<Communication> {
    const [result] = await db.insert(communications).values(communication).returning();
    return result;
  }

  async getCommunicationById(id: string): Promise<Communication | null> {
    const [result] = await db.select().from(communications).where(eq(communications.id, id));
    return result || null;
  }

  async getCommunicationReplies(parentId: string): Promise<Communication[]> {
    // Get all replies to a specific communication
    return db.select()
      .from(communications)
      .where(eq(communications.parentId, parentId))
      .orderBy(communications.createdAt);
  }

  async getAllCommunications(): Promise<Communication[]> {
    return db.select()
      .from(communications)
      .orderBy(desc(communications.createdAt));
  }

  async getCommunicationsByUserId(userId: string): Promise<Communication[]> {
    return db.select()
      .from(communications)
      .where(eq(communications.userId, userId))
      .orderBy(desc(communications.createdAt));
  }

  async getCommunicationsByTenantId(tenantId: string): Promise<Communication[]> {
    return db.select()
      .from(communications)
      .where(eq(communications.tenantId, tenantId))
      .orderBy(desc(communications.createdAt));
  }

  async getCommunicationsByPropertyId(propertyId: string): Promise<Communication[]> {
    // Get all communications for a specific property
    return db.select()
      .from(communications)
      .where(eq(communications.propertyId, propertyId))
      .orderBy(desc(communications.createdAt));
  }

  async updateCommunication(id: string, communication: Partial<InsertCommunication>): Promise<Communication | null> {
    const [result] = await db.update(communications)
      .set(communication)
      .where(eq(communications.id, id))
      .returning();
    return result || null;
  }

  async deleteCommunication(id: string): Promise<boolean> {
    const result = await db.delete(communications).where(eq(communications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Announcements
  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [result] = await db.insert(announcements).values(announcement).returning();
    return result;
  }

  async getAnnouncementById(id: string): Promise<Announcement | null> {
    const [result] = await db.select().from(announcements).where(eq(announcements.id, id));
    return result || null;
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    const now = new Date();
    return db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement | null> {
    const [result] = await db.update(announcements).set(announcement).where(eq(announcements.id, id)).returning();
    return result || null;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Account Payables
  async createAccountPayable(payable: InsertAccountPayable): Promise<AccountPayable> {
    const [result] = await db.insert(accountPayables).values(payable).returning();
    return result;
  }

  async getAccountPayableById(id: string): Promise<AccountPayable | null> {
    const [result] = await db.select().from(accountPayables).where(eq(accountPayables.id, id));
    return result || null;
  }

  async getAllAccountPayables(): Promise<AccountPayable[]> {
    return db.select().from(accountPayables).orderBy(desc(accountPayables.createdAt));
  }

  async getAccountPayablesByStatus(status: string): Promise<AccountPayable[]> {
    return db.select().from(accountPayables).where(eq(accountPayables.status, status));
  }

  async updateAccountPayable(id: string, payable: Partial<InsertAccountPayable>): Promise<AccountPayable | null> {
    const now = new Date();
    const [result] = await db.update(accountPayables).set({ ...payable, lastModified: now }).where(eq(accountPayables.id, id)).returning();
    return result || null;
  }

  async deleteAccountPayable(id: string): Promise<boolean> {
    const result = await db.delete(accountPayables).where(eq(accountPayables.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Reports
  async createReport(report: InsertReport): Promise<Report> {
    const [result] = await db.insert(reports).values(report).returning();
    return result;
  }

  async getReportById(id: string): Promise<Report | null> {
    const [result] = await db.select().from(reports).where(eq(reports.id, id));
    return result || null;
  }

  async getReportsByProperty(propertyId: string): Promise<Report[]> {
    return db.select()
      .from(reports)
      .where(eq(reports.propertyId, propertyId))
      .orderBy(desc(reports.generatedAt));
  }

  async getAllReports(): Promise<Report[]> {
    return db.select().from(reports).orderBy(desc(reports.generatedAt));
  }

  async getReportsByType(type: string): Promise<Report[]> {
    return db.select()
      .from(reports)
      .where(eq(reports.type, type))
      .orderBy(desc(reports.generatedAt));
  }

  async updateReport(id: string, report: Partial<InsertReport>): Promise<Report | null> {
    const [result] = await db.update(reports).set(report).where(eq(reports.id, id)).returning();
    return result || null;
  }

  async deleteReport(id: string): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Projects
  async createProject(project: InsertProject): Promise<Project> {
    const [result] = await db.insert(projects).values(project).returning();
    return result;
  }

  async getProjectById(id: string): Promise<Project | null> {
    const [result] = await db.select().from(projects).where(eq(projects.id, id));
    return result || null;
  }

  async getProjectsByPropertyId(propertyId: string): Promise<Project[]> {
    return db.select()
      .from(projects)
      .where(eq(projects.propertyId, propertyId))
      .orderBy(desc(projects.createdAt));
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | null> {
    const [result] = await db.update(projects).set(project).where(eq(projects.id, id)).returning();
    return result || null;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Contractors
  async createContractor(contractor: InsertContractor): Promise<Contractor> {
    const [result] = await db.insert(contractors).values(contractor).returning();
    return result;
  }

  async getContractorById(id: string): Promise<Contractor | null> {
    const [result] = await db.select().from(contractors).where(eq(contractors.id, id));
    return result || null;
  }

  async getContractorsByPropertyId(propertyId: string): Promise<Contractor[]> {
    return db.select()
      .from(contractors)
      .where(eq(contractors.propertyId, propertyId))
      .orderBy(desc(contractors.createdAt));
  }

  async updateContractor(id: string, contractor: Partial<InsertContractor>): Promise<Contractor | null> {
    const [result] = await db.update(contractors).set(contractor).where(eq(contractors.id, id)).returning();
    return result || null;
  }

  async deleteContractor(id: string): Promise<boolean> {
    const result = await db.delete(contractors).where(eq(contractors.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // DENR Documents
  async createDenrDocument(document: InsertDenrDocument): Promise<DenrDocument> {
    const [result] = await db.insert(denrDocuments).values(document).returning();
    return result;
  }

  async getDenrDocumentById(id: string): Promise<DenrDocument | null> {
    const [result] = await db.select().from(denrDocuments).where(eq(denrDocuments.id, id));
    return result || null;
  }

  async getDenrDocumentsByPropertyId(propertyId: string): Promise<DenrDocument[]> {
    return db.select()
      .from(denrDocuments)
      .where(eq(denrDocuments.propertyId, propertyId))
      .orderBy(desc(denrDocuments.createdAt));
  }

  async updateDenrDocument(id: string, document: Partial<InsertDenrDocument>): Promise<DenrDocument | null> {
    const [result] = await db.update(denrDocuments).set(document).where(eq(denrDocuments.id, id)).returning();
    return result || null;
  }

  async deleteDenrDocument(id: string): Promise<boolean> {
    const result = await db.delete(denrDocuments).where(eq(denrDocuments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Vendors
  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [result] = await db.insert(vendors).values(vendor).returning();
    return result;
  }

  async getVendorById(id: string): Promise<Vendor | null> {
    const [result] = await db.select().from(vendors).where(eq(vendors.id, id));
    return result || null;
  }

  async getVendorsByPropertyId(propertyId: string): Promise<Vendor[]> {
    return db.select()
      .from(vendors)
      .where(eq(vendors.propertyId, propertyId))
      .orderBy(desc(vendors.createdAt));
  }

  async updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor | null> {
    const [result] = await db.update(vendors).set(vendor).where(eq(vendors.id, id)).returning();
    return result || null;
  }

  async deleteVendor(id: string): Promise<boolean> {
    const result = await db.delete(vendors).where(eq(vendors.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Settings
  async createSettings(settings: InsertSettings): Promise<Settings> {
    const [result] = await db.insert(settings).values(settings).returning();
    return result;
  }

  async getSettingsByUserId(userId: string): Promise<Settings | null> {
    const [result] = await db.select().from(settings).where(eq(settings.userId, userId));
    return result || null;
  }

  async updateSettings(id: string, settingsData: Partial<InsertSettings>): Promise<Settings | null> {
    const [result] = await db.update(settings)
      .set({ ...settingsData, updatedAt: new Date() })
      .where(eq(settings.id, id))
      .returning();
    return result || null;
  }

  async upsertSettings(userId: string, settingsData: Partial<InsertSettings>): Promise<Settings> {
    const existing = await this.getSettingsByUserId(userId);
    if (existing) {
      const updated = await this.updateSettings(existing.id, settingsData);
      return updated!;
    } else {
      return await this.createSettings({ ...settingsData, userId } as InsertSettings);
    }
  }

  // Documents
  async createDocument(document: InsertDocument): Promise<Document> {
    const [result] = await db.insert(documents).values(document).returning();
    return result;
  }

  async getDocumentById(id: string): Promise<Document | null> {
    const [result] = await db.select().from(documents).where(eq(documents.id, id));
    return result || null;
  }

  async getAllDocuments(): Promise<Document[]> {
    return db.select()
      .from(documents)
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentsByEntity(entityType: string, entityId: string): Promise<Document[]> {
    return db.select()
      .from(documents)
      .where(and(
        eq(documents.entityType, entityType),
        eq(documents.entityId, entityId)
      ))
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentsByPropertyId(propertyId: string): Promise<Document[]> {
    return db.select()
      .from(documents)
      .where(eq(documents.propertyId, propertyId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    return db.select()
      .from(documents)
      .where(eq(documents.category, category))
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentsByUploadedBy(userId: string): Promise<Document[]> {
    return db.select()
      .from(documents)
      .where(eq(documents.uploadedBy, userId))
      .orderBy(desc(documents.createdAt));
  }

  async updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document | null> {
    const [result] = await db.update(documents).set(document).where(eq(documents.id, id)).returning();
    return result || null;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(notification).returning();
    return result;
  }

  async createNotifications(notificationsList: InsertNotification[]): Promise<Notification[]> {
    if (notificationsList.length === 0) return [];
    const results = await db.insert(notifications).values(notificationsList).returning();
    return results;
  }

  async getNotificationById(id: string): Promise<Notification | null> {
    const [result] = await db.select().from(notifications).where(eq(notifications.id, id));
    return result || null;
  }

  async getNotificationsByUserId(userId: string, limit = 20, offset = 0): Promise<Notification[]> {
    return db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getRecentNotificationsByUserId(userId: string, limit = 10): Promise<Notification[]> {
    return db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadCountByUserId(userId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.status, "unread")
      ));
    return result?.count ?? 0;
  }

  async markNotificationAsRead(id: string): Promise<Notification | null> {
    const [result] = await db.update(notifications)
      .set({ 
        status: "read",
        readAt: new Date()
      })
      .where(eq(notifications.id, id))
      .returning();
    return result || null;
  }

  async markAllNotificationsAsRead(userId: string): Promise<number> {
    const result = await db.update(notifications)
      .set({ 
        status: "read",
        readAt: new Date()
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.status, "unread")
      ));
    return result.rowCount ?? 0;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [result] = await db.insert(auditLogs).values(log).returning();
    return result;
  }

  async getAuditLogById(id: string): Promise<AuditLog | null> {
    const [result] = await db.select().from(auditLogs).where(eq(auditLogs.id, id));
    return result || null;
  }

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    propertyId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters?.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq(auditLogs.entityId, filters.entityId));
    }
    if (filters?.startDate) {
      conditions.push(sql`${auditLogs.createdAt} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${auditLogs.createdAt} <= ${filters.endDate}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(auditLogs.createdAt)) as any;

    if (filters?.limit !== undefined) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset !== undefined) {
      query = query.offset(filters.offset) as any;
    }

    return query;
  }

  async getAuditLogStats(filters?: {
    propertyId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByUser: Array<{ userId: string; userName: string; count: number }>;
    recentActions: AuditLog[];
  }> {
    const conditions = [];
    
    if (filters?.startDate) {
      conditions.push(sql`${auditLogs.createdAt} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${auditLogs.createdAt} <= ${filters.endDate}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total actions
    const [totalResult] = await db.select({ 
      count: sql<number>`count(*)::int` 
    })
    .from(auditLogs)
    .where(whereClause);

    const totalActions = totalResult?.count ?? 0;

    // Get actions by type
    const actionsByTypeResults = await db.select({
      action: auditLogs.action,
      count: sql<number>`count(*)::int`
    })
    .from(auditLogs)
    .where(whereClause)
    .groupBy(auditLogs.action);

    const actionsByType: Record<string, number> = {};
    for (const row of actionsByTypeResults) {
      actionsByType[row.action] = row.count;
    }

    // Get actions by user with names
    const actionsByUserResults = await db.select({
      userId: auditLogs.userId,
      userName: users.fullName,
      count: sql<number>`count(*)::int`
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(whereClause)
    .groupBy(auditLogs.userId, users.fullName)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

    const actionsByUser = actionsByUserResults.map(row => ({
      userId: row.userId ?? '',
      userName: row.userName ?? 'System',
      count: row.count
    }));

    // Get recent actions
    let recentQuery = db.select().from(auditLogs);
    if (whereClause) {
      recentQuery = recentQuery.where(whereClause) as any;
    }
    const recentActions = await recentQuery
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);

    return {
      totalActions,
      actionsByType,
      actionsByUser,
      recentActions
    };
  }
}