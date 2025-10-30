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
  type AccountPayable, type InsertAccountPayable
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { IStorage } from "./storage";

export class PgStorage implements IStorage {
  // User methods (stubbed for now - not using authentication yet)
  async getUser(id: string): Promise<any> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<any> {
    return undefined;
  }

  async createUser(insertUser: any): Promise<any> {
    return { id: "temp", username: insertUser.username };
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

  async getCommunicationsByThreadId(threadId: string): Promise<Communication[]> {
    return db.select().from(communications).where(eq(communications.threadId, threadId)).orderBy(communications.createdAt);
  }

  async getAllCommunicationThreads(): Promise<Communication[]> {
    return db.select().from(communications).orderBy(desc(communications.createdAt));
  }

  async updateCommunication(id: string, communication: Partial<InsertCommunication>): Promise<Communication | null> {
    const [result] = await db.update(communications).set(communication).where(eq(communications.id, id)).returning();
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
}