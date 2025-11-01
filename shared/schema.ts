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

// ============= Users (for Authentication) =============
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Hashed password
  role: text("role").notNull(), // IT, ADMIN, TENANT
  email: text("email"),
  fullName: text("full_name"),
  propertyId: uuid("property_id").references(() => properties.id), // For ADMIN and TENANT roles
  ownerId: uuid("owner_id").references(() => owners.id), // Link to owner/tenant record
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  createdAt: true,
  lastLogin: true
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ============= Password Reset Tokens =============
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ 
  id: true,
  createdAt: true
});
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

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
  category: text("category").notNull(), // rent, maintenance, utilities, fine, deposit
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  dueDate: date("due_date"),
  status: text("status").notNull(), // pending, paid, overdue, cancelled
  paymentMethod: text("payment_method"),
  referenceNumber: text("reference_number"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true,
  createdAt: true 
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// ============= Communications =============
export const communications = pgTable("communications", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").references(() => properties.id),
  unitId: uuid("unit_id").references(() => units.id),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  userId: uuid("user_id").references(() => users.id),
  type: text("type").notNull(), // inquiry, complaint, notification, announcement
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull(), // open, in-progress, resolved, closed
  priority: text("priority"), // low, normal, high
  parentId: uuid("parent_id"), // For threaded conversations
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Communication = typeof communications.$inferSelect;

// ============= Announcements =============
export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").references(() => properties.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // general, maintenance, emergency, event
  priority: text("priority").notNull(), // low, normal, high, urgent
  targetAudience: text("target_audience").notNull(), // all, owners, tenants, specific units
  targetUnits: text("target_units").array(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  attachments: text("attachments").array(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  category: text("category").notNull(), // utilities, maintenance, supplies, services
  vendor: text("vendor"),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").notNull(), // pending, approved, paid, overdue, cancelled
  invoiceNumber: text("invoice_number"),
  invoiceDate: date("invoice_date"),
  paidDate: date("paid_date"),
  paymentMethod: text("payment_method"),
  referenceNumber: text("reference_number"),
  approvedBy: uuid("approved_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertAccountPayableSchema = createInsertSchema(accountPayables).omit({ 
  id: true,
  createdAt: true 
});
export type InsertAccountPayable = z.infer<typeof insertAccountPayableSchema>;
export type AccountPayable = typeof accountPayables.$inferSelect;

// ============= Reports =============
export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").references(() => properties.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // financial, occupancy, maintenance, tenant, custom
  parameters: json("parameters"), // Store report parameters
  generatedBy: uuid("generated_by").references(() => users.id),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  format: text("format"), // pdf, excel, csv
  data: json("data"), // Stores the generated report data
});

export const insertReportSchema = createInsertSchema(reports).omit({ 
  id: true,
  generatedAt: true 
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// ============= Contractors =============
export const contractors = pgTable("contractors", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  specialty: text("specialty").notNull(), // general, plumbing, electrical, hvac, landscaping, etc.
  license: text("license"),
  status: text("status").notNull(), // active, inactive, blacklisted
  rating: decimal("rating", { precision: 2, scale: 1 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractorSchema = createInsertSchema(contractors).omit({ 
  id: true,
  createdAt: true
});
export type InsertContractor = z.infer<typeof insertContractorSchema>;
export type Contractor = typeof contractors.$inferSelect;

// ============= Projects =============
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  name: text("name").notNull(),
  status: text("status").notNull(), // planned, in-progress, completed, cancelled
  category: text("category").notNull(), // renovation, maintenance, upgrade, construction
  contractor: text("contractor"),
  contractorId: uuid("contractor_id").references(() => contractors.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  spent: decimal("spent", { precision: 10, scale: 2 }).default("0"),
  documents: text("documents").array(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ 
  id: true,
  createdAt: true
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// ============= DENR Documents (Environmental Compliance) =============
export const denrDocuments = pgTable("denr_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  type: text("type").notNull(), // certificate, permit, clearance, report
  name: text("name").notNull(),
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date"),
  status: text("status").notNull(), // valid, expired, expiring, pending
  fileUrl: text("file_url"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
});

export const insertDenrDocumentSchema = createInsertSchema(denrDocuments).omit({ 
  id: true,
  createdAt: true
});
export type InsertDenrDocument = z.infer<typeof insertDenrDocumentSchema>;
export type DenrDocument = typeof denrDocuments.$inferSelect;

// ============= Vendors =============
export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  category: text("category").notNull(), // utilities, maintenance, supplies, security, cleaning, etc.
  contactPerson: text("contact_person"),
  status: text("status").notNull().default("active"), // active, inactive, blacklisted
  rating: integer("rating").default(0), // 0-5 stars
  notes: text("notes"),
  contractStartDate: date("contract_start_date"),
  contractEndDate: date("contract_end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({ 
  id: true,
  createdAt: true
});
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// ============= Settings =============
export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id).unique(),
  propertyId: uuid("property_id").references(() => properties.id), // Optional for property-specific settings
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  pushNotifications: boolean("push_notifications").default(true),
  language: text("language").default("en"),
  timezone: text("timezone").default("America/New_York"),
  currency: text("currency").default("USD"),
  maintenanceAutoAssign: boolean("maintenance_auto_assign").default(false),
  paymentReminderDays: integer("payment_reminder_days").default(3),
  theme: text("theme").default("light"), // light, dark, auto
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ 
  id: true,
  updatedAt: true
});
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;