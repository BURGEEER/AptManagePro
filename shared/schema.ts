import { pgTable, text, integer, decimal, timestamp, boolean, uuid, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============= Properties =============
export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  totalUnits: integer("total_units").notNull(),
  yearBuilt: integer("year_built"),
  imageUrl: text("image_url"),
  amenities: text("amenities").array(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({ id: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// ============= Units =============
export const units = pgTable("units", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  unitNumber: text("unit_number").notNull(),
  floor: integer("floor"),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }).notNull(),
  squareFeet: integer("square_feet"),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // available, occupied, maintenance
  features: text("features").array(),
});

export const insertUnitSchema = createInsertSchema(units).omit({ id: true });
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof units.$inferSelect;

// ============= Owners =============
export const owners = pgTable("owners", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  type: text("type").notNull(), // owner, tenant
  isDeemed: boolean("is_deemed").default(false),
  hasSublease: boolean("has_sublease").default(false),
});

export const insertOwnerSchema = createInsertSchema(owners).omit({ id: true });
export type InsertOwner = z.infer<typeof insertOwnerSchema>;
export type Owner = typeof owners.$inferSelect;

// ============= Owner Units (Many-to-Many) =============
export const ownerUnits = pgTable("owner_units", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").notNull().references(() => owners.id),
  unitId: uuid("unit_id").notNull().references(() => units.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isPrimary: boolean("is_primary").default(true),
});

export const insertOwnerUnitSchema = createInsertSchema(ownerUnits).omit({ id: true });
export type InsertOwnerUnit = z.infer<typeof insertOwnerUnitSchema>;
export type OwnerUnit = typeof ownerUnits.$inferSelect;

// ============= Parking Slots =============
export const parkingSlots = pgTable("parking_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  ownerId: uuid("owner_id").references(() => owners.id),
  slotNumber: text("slot_number").notNull(),
  location: text("location"),
  type: text("type"), // covered, uncovered, garage
  monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }),
});

export const insertParkingSlotSchema = createInsertSchema(parkingSlots).omit({ id: true });
export type InsertParkingSlot = z.infer<typeof insertParkingSlotSchema>;
export type ParkingSlot = typeof parkingSlots.$inferSelect;

// ============= Tenants =============
export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").references(() => owners.id),
  unitId: uuid("unit_id").notNull().references(() => units.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  leaseStartDate: date("lease_start_date").notNull(),
  leaseEndDate: date("lease_end_date").notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }),
  status: text("status").notNull(), // active, expiring, expired
  emergencyContact: json("emergency_contact"),
});

export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true });
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// ============= Maintenance Requests =============
export const maintenanceRequests = pgTable("maintenance_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  unitId: uuid("unit_id").notNull().references(() => units.id),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  category: text("category").notNull(), // civil, plumbing, electrical, waterLeak, flooring, intercom
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // low, medium, high, urgent
  status: text("status").notNull(), // submitted, in-progress, resolved, cancelled
  assignedTo: text("assigned_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  attachments: text("attachments").array(),
  notes: text("notes"),
});

export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({ 
  id: true,
  createdAt: true 
});
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;

// ============= Utility Readings =============
export const utilityReadings = pgTable("utility_readings", {
  id: uuid("id").defaultRandom().primaryKey(),
  unitId: uuid("unit_id").notNull().references(() => units.id),
  readingDate: date("reading_date").notNull(),
  waterReading: decimal("water_reading", { precision: 10, scale: 2 }).notNull(),
  electricReading: decimal("electric_reading", { precision: 10, scale: 2 }).notNull(),
  previousWaterReading: decimal("previous_water_reading", { precision: 10, scale: 2 }),
  previousElectricReading: decimal("previous_electric_reading", { precision: 10, scale: 2 }),
  waterCost: decimal("water_cost", { precision: 10, scale: 2 }),
  electricCost: decimal("electric_cost", { precision: 10, scale: 2 }),
  status: text("status"), // normal, high, warning
});

export const insertUtilityReadingSchema = createInsertSchema(utilityReadings).omit({ id: true });
export type InsertUtilityReading = z.infer<typeof insertUtilityReadingSchema>;
export type UtilityReading = typeof utilityReadings.$inferSelect;

// ============= Financial Transactions =============
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").references(() => owners.id),
  unitId: uuid("unit_id").references(() => units.id),
  type: text("type").notNull(), // payment, request, refund, assessment
  category: text("category"), // dues, utilities, maintenance, penalty
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // pending, completed, rejected, cancelled
  dueDate: date("due_date"),
  paidDate: date("paid_date"),
  referenceNumber: text("reference_number").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paymentMethod: text("payment_method"), // cash, check, transfer, online
  notes: text("notes"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true,
  createdAt: true,
  referenceNumber: true 
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// ============= Communications =============
export const communications = pgTable("communications", {
  id: uuid("id").defaultRandom().primaryKey(),
  threadId: text("thread_id").notNull(),
  senderId: uuid("sender_id").references(() => owners.id),
  senderName: text("sender_name").notNull(),
  senderRole: text("sender_role").notNull(), // admin, owner, tenant
  subject: text("subject"),
  message: text("message").notNull(),
  category: text("category"), // inquiry, billing, bug, general
  status: text("status"), // open, pending, resolved
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({ 
  id: true,
  createdAt: true 
});
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Communication = typeof communications.$inferSelect;

// ============= Announcements =============
export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // maintenance, power, repair, general
  priority: text("priority").notNull(), // normal, urgent
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").notNull(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ 
  id: true,
  createdAt: true 
});
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

// ============= Account Payables =============
export const accountPayables = pgTable("account_payables", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendor: text("vendor").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").notNull(), // pending, approved, paid, cancelled
  approver: text("approver"),
  paidDate: date("paid_date"),
  invoiceNumber: text("invoice_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastModified: timestamp("last_modified").defaultNow().notNull(),
});

export const insertAccountPayableSchema = createInsertSchema(accountPayables).omit({ 
  id: true,
  createdAt: true,
  lastModified: true
});
export type InsertAccountPayable = z.infer<typeof insertAccountPayableSchema>;
export type AccountPayable = typeof accountPayables.$inferSelect;