import express from "express";
import type { Express, Request } from "express";
import { insertPropertySchema, insertUnitSchema, insertOwnerSchema, insertTenantSchema, 
  insertMaintenanceRequestSchema, insertTransactionSchema, insertCommunicationSchema, 
  insertAnnouncementSchema, insertUtilityReadingSchema, insertOwnerUnitSchema,
  insertParkingSlotSchema, insertAccountPayableSchema, insertUserSchema } from "@shared/schema";
import { PgStorage } from "./db-storage";
import { z } from "zod";

const storage = new PgStorage();

// Authentication middleware
export function requireAuth(req: Request, res: express.Response, next: express.NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// Role-based access middleware
export function requireRole(roles: string[]) {
  return async (req: Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    req.session.user = user;
    next();
  };
}

export function setupRoutes(app: Express) {
  // ============= Authentication Routes =============
  app.post("/api/auth/login", express.json(), async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const isValid = await storage.verifyPassword(user.password, password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Update last login
      await storage.updateUserLastLogin(user.id);
      
      // Set session
      req.session!.userId = user.id;
      req.session!.role = user.role;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const sessionId = req.sessionID;
    
    // Properly destroy the session
    req.session?.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      
      // Clear the session cookie
      res.clearCookie('propertypro.sid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // ============= User Management Routes (IT and Admin only) =============
  app.post("/api/users", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      
      // Validate creation permissions
      if (currentUser?.role === "ADMIN" && req.body.role !== "TENANT") {
        return res.status(403).json({ error: "Admins can only create tenant accounts" });
      }
      if (currentUser?.role === "IT" && req.body.role === "IT") {
        return res.status(403).json({ error: "IT accounts cannot be created via API" });
      }
      
      const userData = {
        ...req.body,
        createdBy: currentUser?.id
      };
      
      const parsed = insertUserSchema.parse(userData);
      const user = await storage.createUser(parsed);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.get("/api/users", requireRole(["IT", "ADMIN"]), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      let users;
      
      if (currentUser?.role === "IT") {
        users = await storage.getAllUsers();
      } else if (currentUser?.role === "ADMIN") {
        // Admins can only see users from their property
        const allUsers = await storage.getAllUsers();
        users = allUsers.filter(u => u.propertyId === currentUser.propertyId);
      }
      
      // Remove passwords from response
      const usersWithoutPasswords = users?.map(({ password: _, ...user }) => user) || [];
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      const targetUser = await storage.getUser(req.params.id);
      
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Permission checks
      if (currentUser?.role === "ADMIN") {
        if (targetUser.propertyId !== currentUser.propertyId || targetUser.role !== "TENANT") {
          return res.status(403).json({ error: "Insufficient permissions" });
        }
      }
      
      const updatedUser = await storage.updateUser(req.params.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ error: "Failed to update user" });
      }
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  
  app.delete("/api/users/:id", requireRole(["IT", "ADMIN"]), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      const targetUser = await storage.getUser(req.params.id);
      
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Permission checks
      if (currentUser?.role === "ADMIN" && 
          (targetUser.propertyId !== currentUser.propertyId || targetUser.role !== "TENANT")) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      // Deactivate instead of delete
      await storage.updateUser(req.params.id, { isActive: false });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to deactivate user" });
    }
  });
  // ============= Properties =============
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", express.json(), async (req, res) => {
    try {
      const parsed = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(parsed);
      res.status(201).json(property);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid property data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create property" });
    }
  });

  app.patch("/api/properties/:id", express.json(), async (req, res) => {
    try {
      const property = await storage.updateProperty(req.params.id, req.body);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    try {
      const success = await storage.deleteProperty(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete property" });
    }
  });

  // ============= Units =============
  app.get("/api/units", async (req, res) => {
    try {
      const { propertyId } = req.query;
      const units = propertyId 
        ? await storage.getUnitsByPropertyId(propertyId as string)
        : await storage.getAllUnits();
      res.json(units);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch units" });
    }
  });

  app.get("/api/units/:id", async (req, res) => {
    try {
      const unit = await storage.getUnitById(req.params.id);
      if (!unit) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.json(unit);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unit" });
    }
  });

  app.post("/api/units", express.json(), async (req, res) => {
    try {
      const parsed = insertUnitSchema.parse(req.body);
      const unit = await storage.createUnit(parsed);
      res.status(201).json(unit);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid unit data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create unit" });
    }
  });

  app.patch("/api/units/:id", express.json(), async (req, res) => {
    try {
      const unit = await storage.updateUnit(req.params.id, req.body);
      if (!unit) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.json(unit);
    } catch (error) {
      res.status(500).json({ error: "Failed to update unit" });
    }
  });

  app.delete("/api/units/:id", async (req, res) => {
    try {
      const success = await storage.deleteUnit(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete unit" });
    }
  });

  // ============= Owners =============
  app.get("/api/owners", async (req, res) => {
    try {
      const owners = await storage.getAllOwners();
      res.json(owners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch owners" });
    }
  });

  app.get("/api/owners/:id", async (req, res) => {
    try {
      const owner = await storage.getOwnerById(req.params.id);
      if (!owner) {
        return res.status(404).json({ error: "Owner not found" });
      }
      res.json(owner);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch owner" });
    }
  });

  app.post("/api/owners", express.json(), async (req, res) => {
    try {
      const parsed = insertOwnerSchema.parse(req.body);
      const owner = await storage.createOwner(parsed);
      res.status(201).json(owner);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid owner data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create owner" });
    }
  });

  app.patch("/api/owners/:id", express.json(), async (req, res) => {
    try {
      const owner = await storage.updateOwner(req.params.id, req.body);
      if (!owner) {
        return res.status(404).json({ error: "Owner not found" });
      }
      res.json(owner);
    } catch (error) {
      res.status(500).json({ error: "Failed to update owner" });
    }
  });

  // ============= Owner Units =============
  app.get("/api/owner-units/:ownerId", async (req, res) => {
    try {
      const ownerUnits = await storage.getOwnerUnitsByOwnerId(req.params.ownerId);
      res.json(ownerUnits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch owner units" });
    }
  });

  app.post("/api/owner-units", express.json(), async (req, res) => {
    try {
      const parsed = insertOwnerUnitSchema.parse(req.body);
      const ownerUnit = await storage.createOwnerUnit(parsed);
      res.status(201).json(ownerUnit);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid owner unit data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create owner unit" });
    }
  });

  // ============= Parking Slots =============
  app.get("/api/parking-slots/:propertyId", async (req, res) => {
    try {
      const slots = await storage.getParkingSlotsByPropertyId(req.params.propertyId);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch parking slots" });
    }
  });

  app.post("/api/parking-slots", express.json(), async (req, res) => {
    try {
      const parsed = insertParkingSlotSchema.parse(req.body);
      const slot = await storage.createParkingSlot(parsed);
      res.status(201).json(slot);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid parking slot data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create parking slot" });
    }
  });

  // ============= Tenants =============
  app.get("/api/tenants", async (req, res) => {
    try {
      const { unitId } = req.query;
      const tenants = unitId 
        ? await storage.getTenantsByUnitId(unitId as string)
        : await storage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tenants" });
    }
  });

  app.get("/api/tenants/:id", async (req, res) => {
    try {
      const tenant = await storage.getTenantById(req.params.id);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tenant" });
    }
  });

  app.post("/api/tenants", express.json(), async (req, res) => {
    try {
      const parsed = insertTenantSchema.parse(req.body);
      const tenant = await storage.createTenant(parsed);
      res.status(201).json(tenant);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid tenant data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create tenant" });
    }
  });

  app.patch("/api/tenants/:id", express.json(), async (req, res) => {
    try {
      const tenant = await storage.updateTenant(req.params.id, req.body);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      res.status(500).json({ error: "Failed to update tenant" });
    }
  });

  // ============= Maintenance Requests =============
  app.get("/api/maintenance-requests", async (req, res) => {
    try {
      const { status, unitId } = req.query;
      let requests;
      
      if (status) {
        requests = await storage.getMaintenanceRequestsByStatus(status as string);
      } else if (unitId) {
        requests = await storage.getMaintenanceRequestsByUnitId(unitId as string);
      } else {
        requests = await storage.getAllMaintenanceRequests();
      }
      
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch maintenance requests" });
    }
  });

  app.get("/api/maintenance-requests/:id", async (req, res) => {
    try {
      const request = await storage.getMaintenanceRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Maintenance request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch maintenance request" });
    }
  });

  app.post("/api/maintenance-requests", express.json(), async (req, res) => {
    try {
      const parsed = insertMaintenanceRequestSchema.parse(req.body);
      const request = await storage.createMaintenanceRequest(parsed);
      res.status(201).json(request);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create maintenance request" });
    }
  });

  app.patch("/api/maintenance-requests/:id", express.json(), async (req, res) => {
    try {
      const request = await storage.updateMaintenanceRequest(req.params.id, req.body);
      if (!request) {
        return res.status(404).json({ error: "Maintenance request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to update maintenance request" });
    }
  });

  // ============= Utility Readings =============
  // Tenants can only view their unit's readings; IT/Admin can view all
  app.get("/api/utility-readings", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { unitId, propertyId } = req.query;
      let readings: any[] = [];
      
      if (user.role === "TENANT") {
        // Tenants can only see their own unit's readings
        // First, get the tenant's unit through their owner record
        if (user.ownerId) {
          const owner = await storage.getOwnerById(user.ownerId);
          if (owner) {
            const ownerUnits = await storage.getOwnerUnitsByOwnerId(owner.id);
            if (ownerUnits.length > 0) {
              readings = await storage.getUtilityReadingsByUnitId(ownerUnits[0].unitId);
            } else {
              readings = [];
            }
          } else {
            readings = [];
          }
        } else {
          readings = [];
        }
      } else {
        // IT and Admin can view filtered or all readings
        if (unitId) {
          readings = await storage.getUtilityReadingsByUnitId(unitId as string);
        } else if (propertyId) {
          // Get all units for the property and then their readings
          const units = await storage.getUnitsByPropertyId(propertyId as string);
          readings = [];
          for (const unit of units) {
            const unitReadings = await storage.getUtilityReadingsByUnitId(unit.id);
            readings.push(...unitReadings);
          }
        } else {
          readings = await storage.getLatestUtilityReadings();
        }
      }
      
      res.json(readings);
    } catch (error) {
      console.error("Failed to fetch utility readings:", error);
      res.status(500).json({ error: "Failed to fetch utility readings" });
    }
  });

  // Get readings for specific unit - IT/Admin can access any unit, Tenants only their own
  app.get("/api/utility-readings/unit/:unitId", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check access for tenants
      if (user.role === "TENANT") {
        let hasAccess = false;
        if (user.ownerId) {
          const ownerUnits = await storage.getOwnerUnitsByOwnerId(user.ownerId);
          hasAccess = ownerUnits.some(ou => ou.unitId === req.params.unitId);
        }
        
        if (!hasAccess) {
          return res.status(403).json({ error: "Insufficient permissions to view this unit's readings" });
        }
      }
      
      const readings = await storage.getUtilityReadingsByUnitId(req.params.unitId);
      res.json(readings);
    } catch (error) {
      console.error("Failed to fetch unit utility readings:", error);
      res.status(500).json({ error: "Failed to fetch unit utility readings" });
    }
  });

  // Only IT and Admin can record new readings
  app.post("/api/utility-readings", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const parsed = insertUtilityReadingSchema.parse(req.body);
      const reading = await storage.createUtilityReading(parsed);
      res.status(201).json(reading);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid reading data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create utility reading" });
    }
  });

  // Only IT and Admin can update readings
  app.patch("/api/utility-readings/:id", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const reading = await storage.updateUtilityReading(req.params.id, req.body);
      if (!reading) {
        return res.status(404).json({ error: "Utility reading not found" });
      }
      res.json(reading);
    } catch (error) {
      res.status(500).json({ error: "Failed to update utility reading" });
    }
  });

  // Only IT and Admin can delete readings
  app.delete("/api/utility-readings/:id", requireRole(["IT", "ADMIN"]), async (req, res) => {
    try {
      const success = await storage.deleteUtilityReading(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Utility reading not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete utility reading" });
    }
  });

  // ============= Transactions =============
  app.get("/api/transactions", async (req, res) => {
    try {
      const { status, ownerId } = req.query;
      let transactions;
      
      if (status) {
        transactions = await storage.getTransactionsByStatus(status as string);
      } else if (ownerId) {
        transactions = await storage.getTransactionsByOwnerId(ownerId as string);
      } else {
        transactions = await storage.getAllTransactions();
      }
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getTransactionById(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  app.post("/api/transactions", express.json(), async (req, res) => {
    try {
      const parsed = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(parsed);
      res.status(201).json(transaction);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid transaction data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.patch("/api/transactions/:id", express.json(), async (req, res) => {
    try {
      const transaction = await storage.updateTransaction(req.params.id, req.body);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  // ============= Communications =============
  // GET /api/communications - List all communications (filtered by role)
  app.get("/api/communications", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      let communications;
      
      if (user.role === "IT") {
        // IT sees all communications
        communications = await storage.getAllCommunicationThreads();
      } else if (user.role === "ADMIN") {
        // Admin sees communications for their property
        if (!user.propertyId) {
          return res.status(400).json({ error: "Admin user has no property assigned" });
        }
        communications = await storage.getCommunicationsByPropertyId(user.propertyId);
      } else if (user.role === "TENANT") {
        // Tenant sees only their own communications
        if (!user.ownerId) {
          return res.status(400).json({ error: "Tenant user has no owner/tenant record linked" });
        }
        communications = await storage.getCommunicationsBySenderId(user.ownerId);
      } else {
        return res.status(403).json({ error: "Invalid user role" });
      }
      
      res.json(communications);
    } catch (error) {
      console.error("Failed to fetch communications:", error);
      res.status(500).json({ error: "Failed to fetch communications" });
    }
  });

  // GET /api/communications/:id - Get single communication with all messages in thread
  app.get("/api/communications/:id", requireAuth, async (req, res) => {
    try {
      const communication = await storage.getCommunicationById(req.params.id);
      
      if (!communication) {
        return res.status(404).json({ error: "Communication not found" });
      }
      
      // Check access rights
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check role-based access
      if (user.role === "TENANT" && communication.senderId !== user.ownerId) {
        // Tenant can only view their own communications
        return res.status(403).json({ error: "Access denied" });
      } else if (user.role === "ADMIN") {
        // Admin can only view communications from their property
        if (!user.propertyId) {
          return res.status(400).json({ error: "Admin user has no property assigned" });
        }
        // Check if communication belongs to someone in their property
        const propertyComms = await storage.getCommunicationsByPropertyId(user.propertyId);
        const isInProperty = propertyComms.some(c => c.threadId === communication.threadId);
        if (!isInProperty) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      // IT role can see all communications
      
      // Get all messages in the thread
      const threadMessages = await storage.getCommunicationsByThreadId(communication.threadId);
      
      res.json({
        thread: communication,
        messages: threadMessages
      });
    } catch (error) {
      console.error("Failed to fetch communication:", error);
      res.status(500).json({ error: "Failed to fetch communication" });
    }
  });

  // POST /api/communications - Create new communication/ticket
  app.post("/api/communications", requireAuth, express.json(), async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Generate thread ID for new conversation
      const threadId = req.body.threadId || `THREAD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Prepare communication data
      const communicationData = {
        ...req.body,
        threadId,
        senderId: user.ownerId || user.id, // Use ownerId for tenant/owner, user.id for IT/ADMIN
        senderName: user.fullName || user.username,
        senderRole: user.role.toLowerCase(),
        status: req.body.status || "open",
      };
      
      const parsed = insertCommunicationSchema.parse(communicationData);
      const communication = await storage.createCommunication(parsed);
      res.status(201).json(communication);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid communication data", details: error.errors });
      }
      console.error("Failed to create communication:", error);
      res.status(500).json({ error: "Failed to create communication" });
    }
  });

  // POST /api/communications/:id/messages - Add message to communication thread
  app.post("/api/communications/:id/messages", requireAuth, express.json(), async (req, res) => {
    try {
      const communication = await storage.getCommunicationById(req.params.id);
      
      if (!communication) {
        return res.status(404).json({ error: "Communication not found" });
      }
      
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check access rights (same logic as GET /api/communications/:id)
      if (user.role === "TENANT" && communication.senderId !== user.ownerId) {
        return res.status(403).json({ error: "Access denied" });
      } else if (user.role === "ADMIN") {
        if (!user.propertyId) {
          return res.status(400).json({ error: "Admin user has no property assigned" });
        }
        const propertyComms = await storage.getCommunicationsByPropertyId(user.propertyId);
        const isInProperty = propertyComms.some(c => c.threadId === communication.threadId);
        if (!isInProperty) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      // Create the reply message
      const replyData = {
        threadId: communication.threadId,
        senderId: user.ownerId || user.id,
        senderName: user.fullName || user.username,
        senderRole: user.role.toLowerCase(),
        subject: communication.subject, // Keep original subject
        message: req.body.message,
        category: communication.category, // Keep original category
        status: req.body.status || communication.status, // Allow status update or keep current
        attachments: req.body.attachments || [],
      };
      
      const parsed = insertCommunicationSchema.parse(replyData);
      const reply = await storage.createCommunication(parsed);
      
      // If status was updated in the message, update all messages in thread
      if (req.body.status && req.body.status !== communication.status) {
        await storage.updateCommunicationStatusByThreadId(communication.threadId, req.body.status);
      }
      
      res.status(201).json(reply);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid message data", details: error.errors });
      }
      console.error("Failed to add message:", error);
      res.status(500).json({ error: "Failed to add message to communication" });
    }
  });

  // PATCH /api/communications/:id - Update communication status
  app.patch("/api/communications/:id", requireAuth, express.json(), async (req, res) => {
    try {
      const communication = await storage.getCommunicationById(req.params.id);
      
      if (!communication) {
        return res.status(404).json({ error: "Communication not found" });
      }
      
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Only IT and ADMIN can update status
      if (user.role !== "IT" && user.role !== "ADMIN") {
        return res.status(403).json({ error: "Only IT and Admin can update communication status" });
      }
      
      // Admin can only update communications from their property
      if (user.role === "ADMIN") {
        if (!user.propertyId) {
          return res.status(400).json({ error: "Admin user has no property assigned" });
        }
        const propertyComms = await storage.getCommunicationsByPropertyId(user.propertyId);
        const isInProperty = propertyComms.some(c => c.threadId === communication.threadId);
        if (!isInProperty) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      // Update the communication and all messages in the thread
      const updatedCommunication = await storage.updateCommunication(req.params.id, req.body);
      
      // If status is being updated, update all messages in thread
      if (req.body.status) {
        await storage.updateCommunicationStatusByThreadId(communication.threadId, req.body.status);
      }
      
      res.json(updatedCommunication);
    } catch (error) {
      console.error("Failed to update communication:", error);
      res.status(500).json({ error: "Failed to update communication" });
    }
  });

  // DELETE /api/communications/:id - Delete communication
  app.delete("/api/communications/:id", requireAuth, async (req, res) => {
    try {
      const communication = await storage.getCommunicationById(req.params.id);
      
      if (!communication) {
        return res.status(404).json({ error: "Communication not found" });
      }
      
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Only IT can delete communications
      if (user.role !== "IT") {
        return res.status(403).json({ error: "Only IT can delete communications" });
      }
      
      // Delete entire thread
      const success = await storage.deleteCommunicationsByThreadId(communication.threadId);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to delete communication thread" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete communication:", error);
      res.status(500).json({ error: "Failed to delete communication" });
    }
  });

  // ============= Announcements =============
  // All authenticated users can view announcements
  app.get("/api/announcements", requireAuth, async (req, res) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.get("/api/announcements/:id", requireAuth, async (req, res) => {
    try {
      const announcement = await storage.getAnnouncementById(req.params.id);
      if (!announcement) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcement" });
    }
  });

  // Only IT and Admin can create announcements
  app.post("/api/announcements", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const parsed = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(parsed);
      res.status(201).json(announcement);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid announcement data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  // Only IT and Admin can update announcements
  app.patch("/api/announcements/:id", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const announcement = await storage.updateAnnouncement(req.params.id, req.body);
      if (!announcement) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ error: "Failed to update announcement" });
    }
  });

  // Only IT and Admin can delete announcements
  app.delete("/api/announcements/:id", requireRole(["IT", "ADMIN"]), async (req, res) => {
    try {
      const success = await storage.deleteAnnouncement(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });

  // ============= Account Payables =============
  app.get("/api/account-payables", async (req, res) => {
    try {
      const { status } = req.query;
      const payables = status 
        ? await storage.getAccountPayablesByStatus(status as string)
        : await storage.getAllAccountPayables();
      res.json(payables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch account payables" });
    }
  });

  app.post("/api/account-payables", express.json(), async (req, res) => {
    try {
      const parsed = insertAccountPayableSchema.parse(req.body);
      const payable = await storage.createAccountPayable(parsed);
      res.status(201).json(payable);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid payable data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create account payable" });
    }
  });

  app.patch("/api/account-payables/:id", express.json(), async (req, res) => {
    try {
      const payable = await storage.updateAccountPayable(req.params.id, req.body);
      if (!payable) {
        return res.status(404).json({ error: "Account payable not found" });
      }
      res.json(payable);
    } catch (error) {
      res.status(500).json({ error: "Failed to update account payable" });
    }
  });

  // ============= Dashboard Statistics =============
  app.get("/api/stats/dashboard", async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      const units = await storage.getAllUnits();
      const tenants = await storage.getAllTenants();
      const maintenanceRequests = await storage.getMaintenanceRequestsByStatus("submitted");
      
      const occupiedUnits = units.filter(u => u.status === "occupied").length;
      const occupancyRate = units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0;
      
      res.json({
        totalProperties: properties.length,
        totalUnits: units.length,
        occupiedUnits,
        occupancyRate,
        totalTenants: tenants.length,
        openRequests: maintenanceRequests.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });
}