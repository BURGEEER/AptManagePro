import express from "express";
import type { Express } from "express";
import { insertPropertySchema, insertUnitSchema, insertOwnerSchema, insertTenantSchema, 
  insertMaintenanceRequestSchema, insertTransactionSchema, insertCommunicationSchema, 
  insertAnnouncementSchema, insertUtilityReadingSchema, insertOwnerUnitSchema,
  insertParkingSlotSchema, insertAccountPayableSchema } from "@shared/schema";
import { PgStorage } from "./db-storage";

const storage = new PgStorage();

export function setupRoutes(app: Express) {
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
  app.get("/api/utility-readings", async (req, res) => {
    try {
      const { unitId } = req.query;
      const readings = unitId 
        ? await storage.getUtilityReadingsByUnitId(unitId as string)
        : await storage.getLatestUtilityReadings();
      res.json(readings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch utility readings" });
    }
  });

  app.post("/api/utility-readings", express.json(), async (req, res) => {
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
  app.get("/api/communications", async (req, res) => {
    try {
      const { threadId } = req.query;
      const communications = threadId 
        ? await storage.getCommunicationsByThreadId(threadId as string)
        : await storage.getAllCommunicationThreads();
      res.json(communications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch communications" });
    }
  });

  app.post("/api/communications", express.json(), async (req, res) => {
    try {
      const parsed = insertCommunicationSchema.parse(req.body);
      const communication = await storage.createCommunication(parsed);
      res.status(201).json(communication);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid communication data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create communication" });
    }
  });

  // ============= Announcements =============
  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.get("/api/announcements/:id", async (req, res) => {
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

  app.post("/api/announcements", express.json(), async (req, res) => {
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

  app.patch("/api/announcements/:id", express.json(), async (req, res) => {
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