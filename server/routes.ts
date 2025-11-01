import express from "express";
import type { Express, Request } from "express";
import { 
  insertPropertySchema, insertUnitSchema, insertOwnerSchema, insertTenantSchema, 
  insertMaintenanceRequestSchema, insertTransactionSchema, insertCommunicationSchema, 
  insertAnnouncementSchema, insertUtilityReadingSchema, insertOwnerUnitSchema,
  insertParkingSlotSchema, insertAccountPayableSchema, insertUserSchema, insertReportSchema,
  insertProjectSchema, insertContractorSchema, insertDenrDocumentSchema, insertDocumentSchema,
  type Property, type Unit, type Owner, type Tenant, type MaintenanceRequest, 
  type Transaction, type Communication, type Announcement, type UtilityReading,
  type OwnerUnit, type ParkingSlot, type AccountPayable, type User, type Report,
  type Project, type Contractor, type DenrDocument, type Document, type AuditLog
} from "@shared/schema";
import { PgStorage } from "./db-storage";
import { z } from "zod";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { auditLog, captureOriginalBody, auditAuthEvent } from "./middleware/audit";

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
  // Apply audit logging middleware
  app.use(captureOriginalBody);
  app.use(auditLog({
    skipRoutes: ['/api/auth/me', '/api/notifications'],
    includeGetRequests: false
  }));

  // ============= Authentication Routes =============
  app.post("/api/auth/login", express.json(), async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || !user.isActive) {
        // Log failed login attempt
        await auditAuthEvent(undefined, 'LOGIN_FAILED', req, { username });
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const isValid = await storage.verifyPassword(user.password, password);
      if (!isValid) {
        // Log failed login attempt
        await auditAuthEvent(user.id, 'LOGIN_FAILED', req, { username });
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Update last login
      await storage.updateUserLastLogin(user.id);
      
      // Set session
      req.session!.userId = user.id;
      req.session!.role = user.role;
      
      // Log successful login
      await auditAuthEvent(user.id, 'LOGIN', req, { username, role: user.role });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const userId = req.session?.userId;
    const sessionId = req.sessionID;
    
    // Log logout event before destroying session
    if (userId) {
      await auditAuthEvent(userId, 'LOGOUT', req);
    }
    
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

  app.post("/api/auth/change-password", requireAuth, express.json(), async (req, res) => {
    try {
      const userId = req.session?.userId;
      const { currentPassword, newPassword } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }
      
      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify current password
      const isValid = await storage.verifyPassword(user.password, currentPassword);
      if (!isValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      // Update to new password (will be hashed in storage layer)
      await storage.updateUser(userId, { password: newPassword });
      
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
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

  // ============= Password Reset Routes =============
  app.post("/api/auth/forgot-password", express.json(), async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (user) {
        // Generate secure random token
        const rawToken = crypto.randomBytes(32).toString('hex');
        
        // Set expiry to 1 hour from now
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        
        // Save token to database (will be hashed in storage)
        await storage.createPasswordResetToken({
          userId: user.id,
          token: rawToken,
          expiresAt,
          used: false
        });
        
        // Clean up any expired tokens
        await storage.deleteExpiredTokens();
        
        // In production, this would be sent via email
        const resetLink = `http://localhost:5000/reset-password?token=${rawToken}`;
        console.log('\n========================================');
        console.log('PASSWORD RESET LINK (would be emailed in production):');
        console.log(resetLink);
        console.log('User:', user.email);
        console.log('Expires in 1 hour');
        console.log('========================================\n');
      }
      
      // Always return success to prevent email enumeration
      res.json({ 
        success: true, 
        message: "If an account exists with this email, a password reset link has been sent." 
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", express.json(), async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }
      
      // Validate password strength
      const passwordSchema = z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number");
      
      try {
        passwordSchema.parse(newPassword);
      } catch (validationError: any) {
        return res.status(400).json({ 
          error: "Password does not meet security requirements",
          details: validationError.errors 
        });
      }
      
      // Find and verify token
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }
      
      // Check if token has been used
      if (resetToken.used) {
        return res.status(400).json({ error: "This reset token has already been used" });
      }
      
      // Check if token is expired
      if (new Date(resetToken.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Reset token has expired" });
      }
      
      // Update user's password
      await storage.updateUser(resetToken.userId, { password: newPassword });
      
      // Mark token as used
      await storage.markTokenAsUsed(resetToken.id);
      
      res.json({ 
        success: true, 
        message: "Password has been reset successfully" 
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.get("/api/auth/verify-reset-token", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Token is required" });
      }
      
      // Find and verify token
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ 
          valid: false, 
          error: "Invalid or expired reset token" 
        });
      }
      
      // Check if token has been used
      if (resetToken.used) {
        return res.status(400).json({ 
          valid: false, 
          error: "This reset token has already been used" 
        });
      }
      
      // Check if token is expired
      if (new Date(resetToken.expiresAt) < new Date()) {
        return res.status(400).json({ 
          valid: false, 
          error: "Reset token has expired" 
        });
      }
      
      res.json({ 
        valid: true,
        message: "Token is valid" 
      });
    } catch (error) {
      console.error("Verify token error:", error);
      res.status(500).json({ error: "Failed to verify token" });
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
  
  // ============= Settings Routes =============
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      let settings = await storage.getSettingsByUserId(userId);
      
      // If no settings exist, create default settings
      if (!settings) {
        settings = await storage.createSettings({ userId });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Settings fetch error:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });
  
  app.patch("/api/settings", requireAuth, express.json(), async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Remove userId from the update payload if it exists
      const { userId: _, ...updateData } = req.body;
      
      // Use upsert to create or update settings
      const settings = await storage.upsertSettings(userId, updateData);
      
      res.json(settings);
    } catch (error) {
      console.error("Settings update error:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });
  
  // ============= Notifications =============
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const notifications = await storage.getNotificationsByUserId(userId, limit, offset);
      res.json(notifications);
    } catch (error) {
      console.error("Notifications fetch error:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  
  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const count = await storage.getUnreadCountByUserId(userId);
      res.json({ count });
    } catch (error) {
      console.error("Unread count fetch error:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });
  
  app.get("/api/notifications/recent", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const limit = parseInt(req.query.limit as string) || 5;
      const notifications = await storage.getRecentNotificationsByUserId(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Recent notifications fetch error:", error);
      res.status(500).json({ error: "Failed to fetch recent notifications" });
    }
  });
  
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Verify the notification belongs to the user
      const notification = await storage.getNotificationById(req.params.id);
      if (!notification || notification.userId !== userId) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      const updated = await storage.markNotificationAsRead(req.params.id);
      res.json(updated);
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });
  
  app.patch("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const count = await storage.markAllNotificationsAsRead(userId);
      res.json({ updated: count });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });
  
  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Verify the notification belongs to the user
      const notification = await storage.getNotificationById(req.params.id);
      if (!notification || notification.userId !== userId) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      const deleted = await storage.deleteNotification(req.params.id);
      res.json({ success: deleted });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });
  
  // Internal endpoint to create notifications (not exposed to frontend)
  app.post("/api/notifications", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const { userId, title, message, type, priority, actionUrl, metadata } = req.body;
      
      if (!userId || !title || !message || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const notification = await storage.createNotification({
        userId,
        title,
        message,
        type,
        priority: priority || "medium",
        actionUrl: actionUrl || null,
        metadata: metadata || null,
        status: "unread",
      });
      
      res.status(201).json(notification);
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });
  
  // ============= Properties =============
  app.get("/api/properties", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let properties: Property[];
      
      // IT sees all properties
      if (user.role === "IT") {
        properties = await storage.getAllProperties();
      } 
      // Admin sees only their assigned property
      else if (user.role === "ADMIN" && user.propertyId) {
        const property = await storage.getPropertyById(user.propertyId);
        properties = property ? [property] : [];
      }
      // Tenant sees only their property
      else if (user.role === "TENANT" && user.propertyId) {
        const property = await storage.getPropertyById(user.propertyId);
        properties = property ? [property] : [];
      }
      else {
        properties = [];
      }
      
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

  // Only IT can create properties
  app.post("/api/properties", requireRole(["IT"]), express.json(), async (req, res) => {
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

  // Only IT can update properties (Admins can only manage within their property)
  app.patch("/api/properties/:id", requireRole(["IT"]), express.json(), async (req, res) => {
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

  // Only IT can delete properties
  app.delete("/api/properties/:id", requireRole(["IT"]), async (req, res) => {
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
  app.get("/api/units", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { propertyId } = req.query;
      let units: Unit[];
      
      // IT sees all units
      if (user.role === "IT") {
        units = propertyId 
          ? await storage.getUnitsByPropertyId(propertyId as string)
          : await storage.getAllUnits();
      }
      // Admin sees only units from their property
      else if (user.role === "ADMIN" && user.propertyId) {
        // Allow filtering within their property if propertyId matches
        if (propertyId && propertyId !== user.propertyId) {
          return res.status(403).json({ error: "Access denied to this property" });
        }
        units = await storage.getUnitsByPropertyId(user.propertyId);
      }
      // Tenant sees only their assigned unit
      else if (user.role === "TENANT" && user.ownerId) {
        // Get tenant's unit through their tenant record
        const tenants = await storage.getTenantsByOwnerId(user.ownerId);
        if (tenants.length > 0 && tenants[0].unitId) {
          const unit = await storage.getUnitById(tenants[0].unitId);
          units = unit ? [unit] : [];
        } else {
          units = [];
        }
      }
      else {
        units = [];
      }
      
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

  app.post("/api/units", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      
      // Admins can only create units in their property
      if (currentUser?.role === "ADMIN") {
        if (!currentUser.propertyId || req.body.propertyId !== currentUser.propertyId) {
          return res.status(403).json({ error: "Can only create units in your assigned property" });
        }
      }
      
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

  app.patch("/api/units/:id", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      
      // Check if admin can update this unit
      if (currentUser?.role === "ADMIN") {
        const unit = await storage.getUnitById(req.params.id);
        if (!unit || unit.propertyId !== currentUser.propertyId) {
          return res.status(403).json({ error: "Can only update units in your assigned property" });
        }
      }
      
      const unit = await storage.updateUnit(req.params.id, req.body);
      if (!unit) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.json(unit);
    } catch (error) {
      res.status(500).json({ error: "Failed to update unit" });
    }
  });

  app.delete("/api/units/:id", requireRole(["IT", "ADMIN"]), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      
      // Check if admin can delete this unit
      if (currentUser?.role === "ADMIN") {
        const unit = await storage.getUnitById(req.params.id);
        if (!unit || unit.propertyId !== currentUser.propertyId) {
          return res.status(403).json({ error: "Can only delete units in your assigned property" });
        }
      }
      
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
  app.get("/api/owners", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Tenants should not access owners list
      if (user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      let owners: Owner[];
      
      // IT sees all owners
      if (user.role === "IT") {
        owners = await storage.getAllOwners();
      }
      // Admin sees only owners from their property
      else if (user.role === "ADMIN" && user.propertyId) {
        // Get all units in the property
        const units = await storage.getUnitsByPropertyId(user.propertyId);
        const unitIds = units.map(u => u.id);
        
        // Get all owner-unit relationships for these units
        const ownerUnits = [];
        for (const unitId of unitIds) {
          const ous = await storage.getOwnerUnitsByUnitId(unitId);
          ownerUnits.push(...ous);
        }
        
        // Get unique owner IDs
        const ownerIds = Array.from(new Set(ownerUnits.map(ou => ou.ownerId)));
        
        // Get all owners
        const allOwners = await storage.getAllOwners();
        owners = allOwners.filter(owner => ownerIds.includes(owner.id));
      }
      else {
        owners = [];
      }
      
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

  app.post("/api/owners", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
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

  app.patch("/api/owners/:id", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      
      // Check if admin can update this owner
      if (currentUser?.role === "ADMIN") {
        // Get owner's units to check if they belong to admin's property
        const ownerUnits = await storage.getOwnerUnitsByOwnerId(req.params.id);
        if (ownerUnits.length > 0) {
          const unit = await storage.getUnitById(ownerUnits[0].unitId);
          if (!unit || unit.propertyId !== currentUser.propertyId) {
            return res.status(403).json({ error: "Can only update owners in your assigned property" });
          }
        }
      }
      
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
  app.get("/api/tenants", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Tenants should not access tenants list
      if (user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const { unitId } = req.query;
      let tenants: Tenant[];
      
      // IT sees all tenants
      if (user.role === "IT") {
        tenants = unitId 
          ? await storage.getTenantsByUnitId(unitId as string)
          : await storage.getAllTenants();
      }
      // Admin sees only tenants from their property
      else if (user.role === "ADMIN" && user.propertyId) {
        // Get all units in the property
        const units = await storage.getUnitsByPropertyId(user.propertyId);
        const unitIds = units.map(u => u.id);
        
        if (unitId) {
          // Check if requested unitId belongs to admin's property
          if (!unitIds.includes(unitId as string)) {
            return res.status(403).json({ error: "Access denied to this unit" });
          }
          tenants = await storage.getTenantsByUnitId(unitId as string);
        } else {
          // Get all tenants from all units in the property
          const allTenants = await storage.getAllTenants();
          tenants = allTenants.filter(tenant => unitIds.includes(tenant.unitId));
        }
      }
      else {
        tenants = [];
      }
      
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

  app.post("/api/tenants", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      
      // Admins can only create tenants in their property
      if (currentUser?.role === "ADMIN") {
        const unit = await storage.getUnitById(req.body.unitId);
        if (!unit || unit.propertyId !== currentUser.propertyId) {
          return res.status(403).json({ error: "Can only create tenants in your assigned property" });
        }
      }
      
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

  app.patch("/api/tenants/:id", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      
      // Check if admin can update this tenant
      if (currentUser?.role === "ADMIN") {
        const tenant = await storage.getTenantById(req.params.id);
        if (!tenant) {
          return res.status(404).json({ error: "Tenant not found" });
        }
        const unit = await storage.getUnitById(tenant.unitId);
        if (!unit || unit.propertyId !== currentUser.propertyId) {
          return res.status(403).json({ error: "Can only update tenants in your assigned property" });
        }
      }
      
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
  app.get("/api/maintenance-requests", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { status, unitId } = req.query;
      let requests: MaintenanceRequest[];
      
      // IT sees all requests
      if (user.role === "IT") {
        if (status) {
          requests = await storage.getMaintenanceRequestsByStatus(status as string);
        } else if (unitId) {
          requests = await storage.getMaintenanceRequestsByUnitId(unitId as string);
        } else {
          requests = await storage.getAllMaintenanceRequests();
        }
      }
      // Admin sees only requests from their property
      else if (user.role === "ADMIN" && user.propertyId) {
        // Get all units in the property
        const units = await storage.getUnitsByPropertyId(user.propertyId);
        const unitIds = units.map(u => u.id);
        
        let allRequests;
        if (status) {
          allRequests = await storage.getMaintenanceRequestsByStatus(status as string);
        } else if (unitId) {
          // Check if requested unitId belongs to admin's property
          if (!unitIds.includes(unitId as string)) {
            return res.status(403).json({ error: "Access denied to this unit" });
          }
          allRequests = await storage.getMaintenanceRequestsByUnitId(unitId as string);
        } else {
          allRequests = await storage.getAllMaintenanceRequests();
        }
        
        // Filter to only property's units
        requests = allRequests.filter(req => unitIds.includes(req.unitId));
      }
      // Tenant sees only their unit's requests
      else if (user.role === "TENANT" && user.ownerId) {
        // Get tenant's unit
        const tenants = await storage.getTenantsByOwnerId(user.ownerId);
        if (tenants.length > 0 && tenants[0].unitId) {
          let unitRequests = await storage.getMaintenanceRequestsByUnitId(tenants[0].unitId);
          
          // Apply status filter if provided
          if (status) {
            unitRequests = unitRequests.filter(req => req.status === status);
          }
          
          requests = unitRequests;
        } else {
          requests = [];
        }
      }
      else {
        requests = [];
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
      
      // Create notification for admins about new maintenance request
      const admins = await storage.getUsersByRole("ADMIN");
      const its = await storage.getUsersByRole("IT");
      const unit = await storage.getUnitById(request.unitId);
      
      const notificationUsers = [...admins, ...its];
      const notifications = notificationUsers.map(user => ({
        userId: user.id,
        title: "New Maintenance Request",
        message: `A new ${request.priority} priority maintenance request has been created for unit ${unit?.unitNumber || "Unknown"}`,
        type: "maintenance" as const,
        priority: request.priority === "urgent" ? "urgent" as const : "medium" as const,
        actionUrl: `/maintenance`,
        metadata: { requestId: request.id, unitId: request.unitId },
        status: "unread" as const,
      }));
      
      if (notifications.length > 0) {
        await storage.createNotifications(notifications);
      }
      
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
      const existingRequest = await storage.getMaintenanceRequestById(req.params.id);
      if (!existingRequest) {
        return res.status(404).json({ error: "Maintenance request not found" });
      }
      
      const request = await storage.updateMaintenanceRequest(req.params.id, req.body);
      if (!request) {
        return res.status(404).json({ error: "Maintenance request not found" });
      }
      
      // Notify tenant if status changed
      if (req.body.status && req.body.status !== existingRequest.status && request.tenantId) {
        const tenant = await storage.getTenantById(request.tenantId);
        if (tenant) {
          // Find the user account for this tenant
          const users = await storage.getAllUsers();
          const tenantUser = users.find(u => u.email === tenant.email);
          
          if (tenantUser) {
            await storage.createNotification({
              userId: tenantUser.id,
              title: "Maintenance Request Updated",
              message: `Your maintenance request has been updated to: ${request.status}`,
              type: "maintenance",
              priority: request.status === "resolved" ? "low" : "medium",
              actionUrl: `/maintenance`,
              metadata: { requestId: request.id, status: request.status },
              status: "unread",
            });
          }
        }
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
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const {
        status,
        ownerId,
        unitId,
        paymentMethod,
        startDate,
        endDate,
        category,
        page,
        limit
      } = req.query;
      
      const filters: any = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20
      };
      
      if (status) filters.status = status as string;
      if (ownerId) filters.ownerId = ownerId as string;
      if (unitId) filters.unitId = unitId as string;
      if (paymentMethod) filters.paymentMethod = paymentMethod as string;
      if (category) filters.category = category as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      
      // Role-based filtering
      if (user.role === "ADMIN" && user.propertyId) {
        // Admin sees only transactions from their property
        const units = await storage.getUnitsByPropertyId(user.propertyId);
        const unitIds = units.map(u => u.id);
        
        const ownerUnits = [];
        for (const unitId of unitIds) {
          const ous = await storage.getOwnerUnitsByUnitId(unitId);
          ownerUnits.push(...ous);
        }
        
        const propertyOwnerIds = Array.from(new Set(ownerUnits.map(ou => ou.ownerId)));
        
        filters.ownerIds = propertyOwnerIds;
        filters.unitIds = unitIds;
      } else if (user.role === "TENANT" && user.ownerId) {
        // Tenant sees only their transactions
        filters.ownerId = user.ownerId;
      }
      // IT role sees all transactions (no filters needed)
      
      const result = await storage.getTransactionsWithFilters(filters);
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/summary", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { startDate, endDate } = req.query;
      
      const filters: any = {};
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      
      // Role-based filtering
      if (user.role === "ADMIN" && user.propertyId) {
        const units = await storage.getUnitsByPropertyId(user.propertyId);
        const unitIds = units.map(u => u.id);
        
        const ownerUnits = [];
        for (const unitId of unitIds) {
          const ous = await storage.getOwnerUnitsByUnitId(unitId);
          ownerUnits.push(...ous);
        }
        
        const propertyOwnerIds = Array.from(new Set(ownerUnits.map(ou => ou.ownerId)));
        
        filters.ownerIds = propertyOwnerIds;
        filters.unitIds = unitIds;
      } else if (user.role === "TENANT" && user.ownerId) {
        filters.ownerId = user.ownerId;
      }
      
      const summary = await storage.getTransactionsSummary(filters);
      res.json(summary);
    } catch (error) {
      console.error("Failed to fetch transaction summary:", error);
      res.status(500).json({ error: "Failed to fetch transaction summary" });
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
      
      // Create notifications based on target audience
      let targetUsers: User[] = [];
      
      if (announcement.targetAudience === "all") {
        targetUsers = await storage.getAllUsers();
      } else if (announcement.targetAudience === "owners") {
        targetUsers = await storage.getUsersByRole("ADMIN");
        const its = await storage.getUsersByRole("IT");
        targetUsers = [...targetUsers, ...its];
      } else if (announcement.targetAudience === "tenants") {
        targetUsers = await storage.getUsersByRole("TENANT");
      }
      
      // Filter users by property if announcement is property-specific
      if (announcement.propertyId) {
        targetUsers = targetUsers.filter(u => !u.propertyId || u.propertyId === announcement.propertyId);
      }
      
      // Create notifications for target users
      const notifications = targetUsers.map(user => ({
        userId: user.id,
        title: "New Announcement",
        message: announcement.title,
        type: "announcement" as const,
        priority: announcement.priority as "low" | "medium" | "high" | "urgent",
        actionUrl: `/`,
        metadata: { announcementId: announcement.id, category: announcement.category },
        status: "unread" as const,
      }));
      
      if (notifications.length > 0) {
        await storage.createNotifications(notifications);
      }
      
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
  app.get("/api/account-payables", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Tenants should not access account payables
      if (user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const { status } = req.query;
      
      // IT and Admin can view account payables
      // Note: Account payables are not property-specific in the current schema
      // If they should be filtered by property for admins, we'd need to add a propertyId field
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
  app.get("/api/stats/dashboard", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      let properties: Property[], units: Unit[], tenants: Tenant[], maintenanceRequests: MaintenanceRequest[];
      
      // IT sees all statistics
      if (user.role === "IT") {
        properties = await storage.getAllProperties();
        units = await storage.getAllUnits();
        tenants = await storage.getAllTenants();
        maintenanceRequests = await storage.getMaintenanceRequestsByStatus("submitted");
      }
      // Admin sees only their property's statistics
      else if (user.role === "ADMIN" && user.propertyId) {
        const property = await storage.getPropertyById(user.propertyId);
        properties = property ? [property] : [];
        
        units = await storage.getUnitsByPropertyId(user.propertyId);
        
        // Get tenants from the property's units
        const allTenants = await storage.getAllTenants();
        const unitIds = units.map(u => u.id);
        tenants = allTenants.filter(t => unitIds.includes(t.unitId));
        
        // Get maintenance requests from the property's units
        const allRequests = await storage.getMaintenanceRequestsByStatus("submitted");
        maintenanceRequests = allRequests.filter(r => unitIds.includes(r.unitId));
      }
      // Tenant sees limited statistics
      else if (user.role === "TENANT" && user.ownerId) {
        // Tenants get very limited stats - just their unit info
        const userTenants = await storage.getTenantsByOwnerId(user.ownerId);
        if (userTenants.length > 0 && userTenants[0].unitId) {
          const unit = await storage.getUnitById(userTenants[0].unitId);
          properties = [];
          units = unit ? [unit] : [];
          tenants = userTenants;
          
          // Get their unit's maintenance requests
          const unitRequests = await storage.getMaintenanceRequestsByUnitId(userTenants[0].unitId);
          maintenanceRequests = unitRequests.filter(r => r.status === "submitted");
        } else {
          properties = [];
          units = [];
          tenants = [];
          maintenanceRequests = [];
        }
      }
      else {
        properties = [];
        units = [];
        tenants = [];
        maintenanceRequests = [];
      }
      
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

  // ============= Reports =============
  // Get all reports with role-based filtering
  app.get("/api/reports", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let reports: Report[];
      
      if (user.role === "IT") {
        reports = await storage.getAllReports();
      } else if (user.role === "ADMIN" && user.propertyId) {
        reports = await storage.getReportsByProperty(user.propertyId);
      } else {
        reports = [];
      }
      
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // Generate Engineering Report
  app.get("/api/reports/engineering", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user || user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }

      const { startDate, endDate, propertyId } = req.query;
      
      // Get property based on user role
      let targetPropertyId = propertyId as string | undefined;
      if (user.role === "ADMIN" && user.propertyId) {
        targetPropertyId = user.propertyId;
      }

      // Get maintenance requests
      let maintenanceRequests = await storage.getAllMaintenanceRequests();
      
      // Filter by property if needed
      if (targetPropertyId) {
        const units = await storage.getUnitsByPropertyId(targetPropertyId);
        const unitIds = units.map(u => u.id);
        maintenanceRequests = maintenanceRequests.filter(mr => unitIds.includes(mr.unitId));
      }

      // Group by status and category
      const reportData = {
        total: maintenanceRequests.length,
        byStatus: {
          submitted: maintenanceRequests.filter(r => r.status === "submitted").length,
          inProgress: maintenanceRequests.filter(r => r.status === "in-progress").length,
          resolved: maintenanceRequests.filter(r => r.status === "resolved").length,
          cancelled: maintenanceRequests.filter(r => r.status === "cancelled").length,
        },
        byCategory: {
          civil: maintenanceRequests.filter(r => r.category === "civil").length,
          plumbing: maintenanceRequests.filter(r => r.category === "plumbing").length,
          electrical: maintenanceRequests.filter(r => r.category === "electrical").length,
          waterLeak: maintenanceRequests.filter(r => r.category === "waterLeak").length,
          flooring: maintenanceRequests.filter(r => r.category === "flooring").length,
          intercom: maintenanceRequests.filter(r => r.category === "intercom").length,
        },
        requests: maintenanceRequests,
      };

      // Store report in database
      const report = await storage.createReport({
        propertyId: targetPropertyId || null,
        type: "engineering",
        name: `Engineering Report - ${new Date().toLocaleDateString()}`,
        description: "Maintenance requests status and analysis",
        parameters: { startDate, endDate, propertyId: targetPropertyId },
        generatedBy: userId,
        status: "completed",
        format: "json",
        data: reportData,
        fileUrl: null,
      });

      res.json({ report, data: reportData });
    } catch (error) {
      console.error("Engineering report error:", error);
      res.status(500).json({ error: "Failed to generate engineering report" });
    }
  });

  // Generate Billing Report
  app.get("/api/reports/billing", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user || user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }

      const { startDate, endDate, propertyId } = req.query;
      
      let targetPropertyId = propertyId as string | undefined;
      if (user.role === "ADMIN" && user.propertyId) {
        targetPropertyId = user.propertyId;
      }

      // Get transactions
      let transactions = await storage.getAllTransactions();
      
      // Filter by property if needed
      if (targetPropertyId) {
        const units = await storage.getUnitsByPropertyId(targetPropertyId);
        const unitIds = units.map(u => u.id);
        transactions = transactions.filter(t => t.unitId && unitIds.includes(t.unitId));
      }

      // Calculate billing summary
      const completedTransactions = transactions.filter(t => t.status === "completed");
      const pendingTransactions = transactions.filter(t => t.status === "pending");
      
      const totalRevenue = completedTransactions
        .filter(t => t.type === "payment")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalPending = pendingTransactions
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const reportData = {
        totalRevenue,
        totalPending,
        totalTransactions: transactions.length,
        completedPayments: completedTransactions.length,
        pendingPayments: pendingTransactions.length,
        byCategory: {
          dues: transactions.filter(t => t.category === "dues").length,
          utilities: transactions.filter(t => t.category === "utilities").length,
          maintenance: transactions.filter(t => t.category === "maintenance").length,
          penalty: transactions.filter(t => t.category === "penalty").length,
        },
        transactions: transactions,
      };

      // Store report
      const report = await storage.createReport({
        propertyId: targetPropertyId || null,
        type: "billing",
        name: `Billing Report - ${new Date().toLocaleDateString()}`,
        description: "Monthly billing and payment summary",
        parameters: { startDate, endDate, propertyId: targetPropertyId },
        generatedBy: userId,
        status: "completed",
        format: "json",
        data: reportData,
        fileUrl: null,
      });

      res.json({ report, data: reportData });
    } catch (error) {
      console.error("Billing report error:", error);
      res.status(500).json({ error: "Failed to generate billing report" });
    }
  });

  // Generate Statement of Accounts
  app.get("/api/reports/soa", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user || user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }

      const { unitId, ownerId, propertyId } = req.query;
      
      let targetPropertyId = propertyId as string | undefined;
      if (user.role === "ADMIN" && user.propertyId) {
        targetPropertyId = user.propertyId;
      }

      // Get transactions for specific unit or owner
      let transactions = await storage.getAllTransactions();
      
      if (unitId) {
        transactions = transactions.filter(t => t.unitId === unitId);
      } else if (ownerId) {
        transactions = transactions.filter(t => t.ownerId === ownerId);
      } else if (targetPropertyId) {
        const units = await storage.getUnitsByPropertyId(targetPropertyId);
        const unitIds = units.map(u => u.id);
        transactions = transactions.filter(t => t.unitId && unitIds.includes(t.unitId));
      }

      // Calculate balances
      const totalCharges = transactions
        .filter(t => t.type === "request" || t.type === "assessment")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalPayments = transactions
        .filter(t => t.type === "payment")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const balance = totalCharges - totalPayments;

      const reportData = {
        totalCharges,
        totalPayments,
        currentBalance: balance,
        transactions: transactions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      };

      // Store report
      const report = await storage.createReport({
        propertyId: targetPropertyId || null,
        type: "soa",
        name: `Statement of Account - ${new Date().toLocaleDateString()}`,
        description: "Detailed financial statement",
        parameters: { unitId, ownerId, propertyId: targetPropertyId },
        generatedBy: userId,
        status: "completed",
        format: "json",
        data: reportData,
        fileUrl: null,
      });

      res.json({ report, data: reportData });
    } catch (error) {
      console.error("SOA report error:", error);
      res.status(500).json({ error: "Failed to generate statement of account" });
    }
  });

  // Generate Occupancy Report
  app.get("/api/reports/occupancy", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user || user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }

      const { propertyId } = req.query;
      
      let targetPropertyId = propertyId as string | undefined;
      if (user.role === "ADMIN" && user.propertyId) {
        targetPropertyId = user.propertyId;
      }

      // Get units and calculate occupancy
      let units: Unit[];
      let properties: Property[];
      
      if (targetPropertyId) {
        units = await storage.getUnitsByPropertyId(targetPropertyId);
        const property = await storage.getPropertyById(targetPropertyId);
        properties = property ? [property] : [];
      } else {
        units = await storage.getAllUnits();
        properties = await storage.getAllProperties();
      }

      const occupiedUnits = units.filter(u => u.status === "occupied");
      const availableUnits = units.filter(u => u.status === "available");
      const maintenanceUnits = units.filter(u => u.status === "maintenance");

      const reportData = {
        totalUnits: units.length,
        occupied: occupiedUnits.length,
        available: availableUnits.length,
        maintenance: maintenanceUnits.length,
        occupancyRate: units.length > 0 ? (occupiedUnits.length / units.length) * 100 : 0,
        byProperty: properties.map(p => {
          const propertyUnits = units.filter(u => u.propertyId === p.id);
          const propertyOccupied = propertyUnits.filter(u => u.status === "occupied");
          return {
            propertyId: p.id,
            propertyName: p.name,
            totalUnits: propertyUnits.length,
            occupied: propertyOccupied.length,
            occupancyRate: propertyUnits.length > 0 
              ? (propertyOccupied.length / propertyUnits.length) * 100 
              : 0,
          };
        }),
        units: units,
      };

      // Store report
      const report = await storage.createReport({
        propertyId: targetPropertyId || null,
        type: "occupancy",
        name: `Occupancy Report - ${new Date().toLocaleDateString()}`,
        description: "Unit occupancy rates and analysis",
        parameters: { propertyId: targetPropertyId },
        generatedBy: userId,
        status: "completed",
        format: "json",
        data: reportData,
        fileUrl: null,
      });

      res.json({ report, data: reportData });
    } catch (error) {
      console.error("Occupancy report error:", error);
      res.status(500).json({ error: "Failed to generate occupancy report" });
    }
  });

  // Generate Maintenance Report
  app.get("/api/reports/maintenance", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user || user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }

      const { startDate, endDate, propertyId } = req.query;
      
      let targetPropertyId = propertyId as string | undefined;
      if (user.role === "ADMIN" && user.propertyId) {
        targetPropertyId = user.propertyId;
      }

      // Get maintenance requests
      let maintenanceRequests = await storage.getAllMaintenanceRequests();
      
      // Filter by property if needed
      if (targetPropertyId) {
        const units = await storage.getUnitsByPropertyId(targetPropertyId);
        const unitIds = units.map(u => u.id);
        maintenanceRequests = maintenanceRequests.filter(mr => unitIds.includes(mr.unitId));
      }

      // Calculate statistics
      const resolvedRequests = maintenanceRequests.filter(r => r.status === "resolved");
      const avgResolutionTime = resolvedRequests.length > 0
        ? resolvedRequests.reduce((sum, r) => {
            if (r.resolvedAt) {
              const created = new Date(r.createdAt).getTime();
              const resolved = new Date(r.resolvedAt).getTime();
              return sum + (resolved - created) / (1000 * 60 * 60 * 24); // Days
            }
            return sum;
          }, 0) / resolvedRequests.length
        : 0;

      const reportData = {
        totalRequests: maintenanceRequests.length,
        resolved: resolvedRequests.length,
        pending: maintenanceRequests.filter(r => r.status === "submitted").length,
        inProgress: maintenanceRequests.filter(r => r.status === "in-progress").length,
        avgResolutionTimeDays: avgResolutionTime,
        byPriority: {
          urgent: maintenanceRequests.filter(r => r.priority === "urgent").length,
          high: maintenanceRequests.filter(r => r.priority === "high").length,
          medium: maintenanceRequests.filter(r => r.priority === "medium").length,
          low: maintenanceRequests.filter(r => r.priority === "low").length,
        },
        byCategory: {
          civil: maintenanceRequests.filter(r => r.category === "civil").length,
          plumbing: maintenanceRequests.filter(r => r.category === "plumbing").length,
          electrical: maintenanceRequests.filter(r => r.category === "electrical").length,
          waterLeak: maintenanceRequests.filter(r => r.category === "waterLeak").length,
          flooring: maintenanceRequests.filter(r => r.category === "flooring").length,
          intercom: maintenanceRequests.filter(r => r.category === "intercom").length,
        },
        requests: maintenanceRequests,
      };

      // Store report
      const report = await storage.createReport({
        propertyId: targetPropertyId || null,
        type: "maintenance",
        name: `Maintenance Report - ${new Date().toLocaleDateString()}`,
        description: "Maintenance request statistics and analysis",
        parameters: { startDate, endDate, propertyId: targetPropertyId },
        generatedBy: userId,
        status: "completed",
        format: "json",
        data: reportData,
        fileUrl: null,
      });

      res.json({ report, data: reportData });
    } catch (error) {
      console.error("Maintenance report error:", error);
      res.status(500).json({ error: "Failed to generate maintenance report" });
    }
  });

  // Generate Financial Summary Report
  app.get("/api/reports/financial-summary", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user || user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }

      const { startDate, endDate, propertyId } = req.query;
      
      let targetPropertyId = propertyId as string | undefined;
      if (user.role === "ADMIN" && user.propertyId) {
        targetPropertyId = user.propertyId;
      }

      // Get transactions and account payables
      let transactions = await storage.getAllTransactions();
      let accountPayables = await storage.getAllAccountPayables();
      
      // Filter by property if needed
      if (targetPropertyId) {
        const units = await storage.getUnitsByPropertyId(targetPropertyId);
        const unitIds = units.map(u => u.id);
        transactions = transactions.filter(t => t.unitId && unitIds.includes(t.unitId));
      }

      // Calculate revenue
      const completedPayments = transactions.filter(t => 
        t.type === "payment" && t.status === "completed"
      );
      const totalRevenue = completedPayments.reduce((sum, t) => 
        sum + parseFloat(t.amount), 0
      );

      // Calculate expenses
      const paidExpenses = accountPayables.filter(ap => ap.status === "paid");
      const totalExpenses = paidExpenses.reduce((sum, ap) => 
        sum + parseFloat(ap.amount), 0
      );

      // Calculate pending amounts
      const pendingRevenue = transactions
        .filter(t => t.status === "pending")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const pendingExpenses = accountPayables
        .filter(ap => ap.status === "pending" || ap.status === "approved")
        .reduce((sum, ap) => sum + parseFloat(ap.amount), 0);

      const netIncome = totalRevenue - totalExpenses;

      const reportData = {
        revenue: {
          total: totalRevenue,
          pending: pendingRevenue,
          byCategory: {
            dues: completedPayments.filter(t => t.category === "dues")
              .reduce((sum, t) => sum + parseFloat(t.amount), 0),
            utilities: completedPayments.filter(t => t.category === "utilities")
              .reduce((sum, t) => sum + parseFloat(t.amount), 0),
            maintenance: completedPayments.filter(t => t.category === "maintenance")
              .reduce((sum, t) => sum + parseFloat(t.amount), 0),
            penalties: completedPayments.filter(t => t.category === "penalty")
              .reduce((sum, t) => sum + parseFloat(t.amount), 0),
          },
        },
        expenses: {
          total: totalExpenses,
          pending: pendingExpenses,
          payables: accountPayables,
        },
        netIncome,
        profitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
      };

      // Store report
      const report = await storage.createReport({
        propertyId: targetPropertyId || null,
        type: "financial-summary",
        name: `Financial Summary - ${new Date().toLocaleDateString()}`,
        description: "Complete financial overview with revenue and expenses",
        parameters: { startDate, endDate, propertyId: targetPropertyId },
        generatedBy: userId,
        status: "completed",
        format: "json",
        data: reportData,
        fileUrl: null,
      });

      res.json({ report, data: reportData });
    } catch (error) {
      console.error("Financial summary error:", error);
      res.status(500).json({ error: "Failed to generate financial summary" });
    }
  });

  // Create custom report
  app.post("/api/reports/generate", requireAuth, express.json(), async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user || user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }

      const { type, parameters } = req.body;
      
      // Redirect to specific report endpoint based on type
      const reportEndpoints: Record<string, string> = {
        engineering: "/api/reports/engineering",
        billing: "/api/reports/billing",
        soa: "/api/reports/soa",
        occupancy: "/api/reports/occupancy",
        maintenance: "/api/reports/maintenance",
        "financial-summary": "/api/reports/financial-summary",
      };

      if (!reportEndpoints[type]) {
        return res.status(400).json({ error: "Invalid report type" });
      }

      // Make internal request to the specific report endpoint
      const queryParams = new URLSearchParams(parameters).toString();
      const reportUrl = `${reportEndpoints[type]}${queryParams ? `?${queryParams}` : ""}`;
      
      // For simplicity, return a message to use the specific endpoint
      res.json({ 
        message: "Use the specific report endpoint",
        endpoint: reportUrl 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // ============= Financial Data Routes =============
  app.get("/api/financial/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const period = req.query.period as string || 'monthly';
      
      // Get all transactions for the property
      let allTransactions = await storage.getAllTransactions();
      
      // Filter by property if ADMIN
      if (user.role === "ADMIN" && user.propertyId) {
        const unitIds = (await storage.getUnitsByPropertyId(user.propertyId)).map(u => u.id);
        allTransactions = allTransactions.filter(t => unitIds.includes(t.unitId));
      } else if (user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Calculate stats for current month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const monthlyTransactions = allTransactions.filter(t => {
        const tDate = new Date(t.transactionDate);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      });
      
      const revenue = monthlyTransactions
        .filter(t => t.type === 'payment' && (t.category === 'dues' || t.category === 'utilities' || t.category === 'penalty'))
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
      
      const collected = monthlyTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
      
      const pending = monthlyTransactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
      
      const overdue = monthlyTransactions
        .filter(t => t.status === 'overdue')
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
      
      // Calculate trends (comparison with last month)
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const lastMonthTransactions = allTransactions.filter(t => {
        const tDate = new Date(t.transactionDate);
        return tDate.getMonth() === lastMonth && tDate.getFullYear() === lastMonthYear;
      });
      
      const lastMonthRevenue = lastMonthTransactions
        .filter(t => t.type === 'payment' && (t.category === 'dues' || t.category === 'utilities' || t.category === 'penalty'))
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
      
      const revenueTrend = lastMonthRevenue > 0 
        ? ((revenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
        : '0';
      
      const collectedTrend = lastMonthTransactions.length > 0
        ? ((collected - lastMonthTransactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)) / lastMonthTransactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0) * 100).toFixed(1)
        : '0';
      
      const overdueTrend = lastMonthTransactions.filter(t => t.status === 'overdue').length > 0
        ? ((overdue - lastMonthTransactions.filter(t => t.status === 'overdue').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)) / lastMonthTransactions.filter(t => t.status === 'overdue').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0) * 100).toFixed(1)
        : '0';
      
      res.json({
        revenue,
        collected,
        pending,
        overdue,
        revenueTrend: parseFloat(revenueTrend),
        collectedTrend: parseFloat(collectedTrend),
        overdueTrend: parseFloat(overdueTrend),
        period
      });
    } catch (error) {
      console.error('Financial stats error:', error);
      res.status(500).json({ error: "Failed to fetch financial stats" });
    }
  });

  app.get("/api/financial/revenue-chart", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const months = parseInt(req.query.months as string) || 6;
      
      // Get all transactions
      let allTransactions = await storage.getAllTransactions();
      
      // Filter by property if ADMIN
      if (user.role === "ADMIN" && user.propertyId) {
        const unitIds = (await storage.getUnitsByPropertyId(user.propertyId)).map(u => u.id);
        allTransactions = allTransactions.filter(t => unitIds.includes(t.unitId));
      }
      
      // Group by month for the last N months
      const now = new Date();
      const chartData = [];
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const monthNum = date.getMonth();
        const year = date.getFullYear();
        
        const monthlyRevenue = allTransactions
          .filter(t => {
            const tDate = new Date(t.transactionDate);
            return tDate.getMonth() === monthNum && 
                   tDate.getFullYear() === year &&
                   t.type === 'payment' &&
                   (t.category === 'dues' || t.category === 'utilities' || t.category === 'penalty') &&
                   t.status === 'completed';
          })
          .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
        
        chartData.push({
          month: monthName,
          revenue: monthlyRevenue
        });
      }
      
      res.json(chartData);
    } catch (error) {
      console.error('Revenue chart error:', error);
      res.status(500).json({ error: "Failed to fetch revenue chart data" });
    }
  });

  app.get("/api/financial/delinquent-accounts", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get all overdue transactions
      let allTransactions = await storage.getAllTransactions();
      const overdueTransactions = allTransactions.filter(t => t.status === 'overdue');
      
      // Filter by property if ADMIN
      let filteredTransactions = overdueTransactions;
      if (user.role === "ADMIN" && user.propertyId) {
        const unitIds = (await storage.getUnitsByPropertyId(user.propertyId)).map(u => u.id);
        filteredTransactions = overdueTransactions.filter(t => unitIds.includes(t.unitId));
      }
      
      // Group by owner/tenant
      const delinquentMap = new Map();
      
      for (const transaction of filteredTransactions) {
        const unit = await storage.getUnitById(transaction.unitId);
        if (!unit) continue;
        
        const property = await storage.getPropertyById(unit.propertyId);
        if (!property) continue;
        
        // Get owner or tenant info
        const ownerUnits = await storage.getOwnerUnitsByUnitId(unit.id);
        let ownerName = "Unknown";
        let ownerId = "";
        
        if (ownerUnits.length > 0) {
          const owner = await storage.getOwnerById(ownerUnits[0].ownerId);
          if (owner) {
            ownerName = owner.name;
            ownerId = owner.id;
          }
        }
        
        const key = `${ownerId}-${unit.id}`;
        
        if (delinquentMap.has(key)) {
          const existing = delinquentMap.get(key);
          existing.totalOwed += parseFloat(transaction.amount || '0');
          if (new Date(transaction.transactionDate) < new Date(existing.oldestTransaction)) {
            existing.oldestTransaction = transaction.transactionDate;
          }
        } else {
          delinquentMap.set(key, {
            id: key,
            ownerName,
            unit: unit.unitNumber,
            property: property.name,
            totalOwed: parseFloat(transaction.amount || '0'),
            oldestTransaction: transaction.transactionDate,
            lastPayment: transaction.transactionDate
          });
        }
      }
      
      // Calculate months overdue and status
      const delinquentAccounts = Array.from(delinquentMap.values()).map(account => {
        const monthsOverdue = Math.floor((Date.now() - new Date(account.oldestTransaction).getTime()) / (1000 * 60 * 60 * 24 * 30));
        
        let status: 'warning' | 'critical' | 'legal';
        if (monthsOverdue >= 6) {
          status = 'legal';
        } else if (monthsOverdue >= 3) {
          status = 'critical';
        } else {
          status = 'warning';
        }
        
        return {
          ...account,
          monthsOverdue,
          status,
          lastPayment: new Date(account.lastPayment).toLocaleString('default', { month: 'short', year: 'numeric' })
        };
      });
      
      res.json(delinquentAccounts);
    } catch (error) {
      console.error('Delinquent accounts error:', error);
      res.status(500).json({ error: "Failed to fetch delinquent accounts" });
    }
  });

  app.post("/api/financial/record-payment", requireAuth, express.json(), async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user || user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const { transactionId, amount, paymentMethod, notes } = req.body;
      
      const transaction = await storage.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      // Update transaction status to completed
      const updated = await storage.updateTransaction(transactionId, {
        status: 'completed',
        paymentMethod,
        notes: notes ? `${transaction.notes || ''}\n${notes}` : transaction.notes
      });
      
      res.json(updated);
    } catch (error) {
      console.error('Record payment error:', error);
      res.status(500).json({ error: "Failed to record payment" });
    }
  });

  app.get("/api/financial/payment-by-property", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user || user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get all properties
      let properties = await storage.getAllProperties();
      
      // Filter by property if ADMIN
      if (user.role === "ADMIN" && user.propertyId) {
        properties = properties.filter(p => p.id === user.propertyId);
      }
      
      const paymentStats = [];
      
      for (const property of properties) {
        const units = await storage.getUnitsByPropertyId(property.id);
        const unitIds = units.map(u => u.id);
        
        const propertyTransactions = (await storage.getAllTransactions())
          .filter(t => unitIds.includes(t.unitId));
        
        const totalDue = propertyTransactions
          .filter(t => t.type === 'payment')
          .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
        
        const collected = propertyTransactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
        
        const percentCollected = totalDue > 0 ? (collected / totalDue * 100) : 0;
        
        paymentStats.push({
          property: property.name,
          percentCollected: Math.round(percentCollected)
        });
      }
      
      res.json(paymentStats);
    } catch (error) {
      console.error('Payment by property error:', error);
      res.status(500).json({ error: "Failed to fetch payment stats by property" });
    }
  });

  app.get("/api/financial/common-area-expenses", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user || user.role === "TENANT") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get all account payables
      let accountPayables = await storage.getAllAccountPayables();
      
      // Filter by property if ADMIN
      if (user.role === "ADMIN" && user.propertyId) {
        accountPayables = accountPayables.filter(ap => ap.propertyId === user.propertyId);
      }
      
      // Group by category
      const expenses = [
        {
          category: "Maintenance",
          amount: accountPayables
            .filter(ap => ap.vendor.toLowerCase().includes('maintenance'))
            .reduce((sum, ap) => sum + parseFloat(ap.amount || '0'), 0),
          change: 8.2
        },
        {
          category: "Security",
          amount: accountPayables
            .filter(ap => ap.vendor.toLowerCase().includes('security'))
            .reduce((sum, ap) => sum + parseFloat(ap.amount || '0'), 0),
          change: -3.5
        },
        {
          category: "Utilities",
          amount: accountPayables
            .filter(ap => ap.vendor.toLowerCase().includes('power') || ap.vendor.toLowerCase().includes('water'))
            .reduce((sum, ap) => sum + parseFloat(ap.amount || '0'), 0),
          change: 12.1
        },
        {
          category: "Landscaping",
          amount: accountPayables
            .filter(ap => ap.vendor.toLowerCase().includes('landscap'))
            .reduce((sum, ap) => sum + parseFloat(ap.amount || '0'), 0),
          change: 5.7
        }
      ];
      
      res.json(expenses);
    } catch (error) {
      console.error('Common area expenses error:', error);
      res.status(500).json({ error: "Failed to fetch common area expenses" });
    }
  });

  // ============= Projects =============
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      let projects: Project[];
      
      // Admin sees only projects from their property
      if (user.role === "ADMIN" && user.propertyId) {
        projects = await storage.getProjectsByPropertyId(user.propertyId);
      }
      // IT sees all projects
      else if (user.role === "IT") {
        const allProperties = await storage.getAllProperties();
        projects = [];
        for (const property of allProperties) {
          const propertyProjects = await storage.getProjectsByPropertyId(property.id);
          projects.push(...propertyProjects);
        }
      }
      else {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(projects);
    } catch (error) {
      console.error('Projects fetch error:', error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const project = await storage.getProjectById(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Admin can only see projects from their property
      if (user.role === "ADMIN" && user.propertyId && project.propertyId !== user.propertyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      
      // Admins can only create projects in their property
      if (currentUser?.role === "ADMIN") {
        req.body.propertyId = currentUser.propertyId;
      }
      
      const projectData = {
        ...req.body,
        createdBy: currentUser?.id
      };
      
      const parsed = insertProjectSchema.parse(projectData);
      const project = await storage.createProject(parsed);
      res.status(201).json(project);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      const project = await storage.getProjectById(req.params.id);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Admins can only update projects in their property
      if (currentUser?.role === "ADMIN" && project.propertyId !== currentUser.propertyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updated = await storage.updateProject(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", requireRole(["IT", "ADMIN"]), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      const project = await storage.getProjectById(req.params.id);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Admins can only delete projects in their property
      if (currentUser?.role === "ADMIN" && project.propertyId !== currentUser.propertyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const success = await storage.deleteProject(req.params.id);
      if (success) {
        res.json({ message: "Project deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete project" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // ============= Contractors =============
  app.get("/api/contractors", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      let contractors: Contractor[];
      
      // Admin sees only contractors from their property
      if (user.role === "ADMIN" && user.propertyId) {
        contractors = await storage.getContractorsByPropertyId(user.propertyId);
      }
      // IT sees all contractors
      else if (user.role === "IT") {
        const allProperties = await storage.getAllProperties();
        contractors = [];
        for (const property of allProperties) {
          const propertyContractors = await storage.getContractorsByPropertyId(property.id);
          contractors.push(...propertyContractors);
        }
      }
      else {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(contractors);
    } catch (error) {
      console.error('Contractors fetch error:', error);
      res.status(500).json({ error: "Failed to fetch contractors" });
    }
  });

  app.get("/api/contractors/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const contractor = await storage.getContractorById(req.params.id);
      if (!contractor) {
        return res.status(404).json({ error: "Contractor not found" });
      }
      
      // Admin can only see contractors from their property
      if (user.role === "ADMIN" && user.propertyId && contractor.propertyId !== user.propertyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(contractor);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contractor" });
    }
  });

  app.post("/api/contractors", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      
      // Admins can only create contractors in their property
      if (currentUser?.role === "ADMIN") {
        req.body.propertyId = currentUser.propertyId;
      }
      
      const parsed = insertContractorSchema.parse(req.body);
      const contractor = await storage.createContractor(parsed);
      res.status(201).json(contractor);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid contractor data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create contractor" });
    }
  });

  app.patch("/api/contractors/:id", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      const contractor = await storage.getContractorById(req.params.id);
      
      if (!contractor) {
        return res.status(404).json({ error: "Contractor not found" });
      }
      
      // Admins can only update contractors in their property
      if (currentUser?.role === "ADMIN" && contractor.propertyId !== currentUser.propertyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updated = await storage.updateContractor(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update contractor" });
    }
  });

  app.delete("/api/contractors/:id", requireRole(["IT", "ADMIN"]), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      const contractor = await storage.getContractorById(req.params.id);
      
      if (!contractor) {
        return res.status(404).json({ error: "Contractor not found" });
      }
      
      // Admins can only delete contractors in their property
      if (currentUser?.role === "ADMIN" && contractor.propertyId !== currentUser.propertyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const success = await storage.deleteContractor(req.params.id);
      if (success) {
        res.json({ message: "Contractor deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete contractor" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contractor" });
    }
  });

  // ============= DENR Documents =============
  app.get("/api/denr-documents", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      let documents: DenrDocument[];
      
      // Admin sees only DENR documents from their property
      if (user.role === "ADMIN" && user.propertyId) {
        documents = await storage.getDenrDocumentsByPropertyId(user.propertyId);
      }
      // IT sees all DENR documents
      else if (user.role === "IT") {
        const allProperties = await storage.getAllProperties();
        documents = [];
        for (const property of allProperties) {
          const propertyDocs = await storage.getDenrDocumentsByPropertyId(property.id);
          documents.push(...propertyDocs);
        }
      }
      else {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(documents);
    } catch (error) {
      console.error('DENR documents fetch error:', error);
      res.status(500).json({ error: "Failed to fetch DENR documents" });
    }
  });

  app.get("/api/denr-documents/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const document = await storage.getDenrDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "DENR document not found" });
      }
      
      // Admin can only see DENR documents from their property
      if (user.role === "ADMIN" && user.propertyId && document.propertyId !== user.propertyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch DENR document" });
    }
  });

  app.post("/api/denr-documents", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      
      // Admins can only create DENR documents in their property
      if (currentUser?.role === "ADMIN") {
        req.body.propertyId = currentUser.propertyId;
      }
      
      const documentData = {
        ...req.body,
        uploadedBy: currentUser?.id
      };
      
      const parsed = insertDenrDocumentSchema.parse(documentData);
      const document = await storage.createDenrDocument(parsed);
      res.status(201).json(document);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid DENR document data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create DENR document" });
    }
  });

  app.patch("/api/denr-documents/:id", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      const document = await storage.getDenrDocumentById(req.params.id);
      
      if (!document) {
        return res.status(404).json({ error: "DENR document not found" });
      }
      
      // Admins can only update DENR documents in their property
      if (currentUser?.role === "ADMIN" && document.propertyId !== currentUser.propertyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updated = await storage.updateDenrDocument(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update DENR document" });
    }
  });

  app.delete("/api/denr-documents/:id", requireRole(["IT", "ADMIN"]), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      const document = await storage.getDenrDocumentById(req.params.id);
      
      if (!document) {
        return res.status(404).json({ error: "DENR document not found" });
      }
      
      // Admins can only delete DENR documents in their property
      if (currentUser?.role === "ADMIN" && document.propertyId !== currentUser.propertyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const success = await storage.deleteDenrDocument(req.params.id);
      if (success) {
        res.json({ message: "DENR document deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete DENR document" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete DENR document" });
    }
  });

  // ============= Vendors =============
  app.get("/api/vendors", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      let vendors;
      const { category, status, search } = req.query;
      
      if (user.role === "ADMIN" && user.propertyId) {
        // Admin sees only vendors from their property
        vendors = await storage.getVendorsByPropertyId(user.propertyId);
      } else if (user.role === "IT") {
        // IT sees all vendors
        const allProperties = await storage.getAllProperties();
        vendors = [];
        for (const property of allProperties) {
          const propertyVendors = await storage.getVendorsByPropertyId(property.id);
          vendors.push(...propertyVendors);
        }
      } else {
        // Tenants have read-only access to vendors from their property
        if (user.propertyId) {
          vendors = await storage.getVendorsByPropertyId(user.propertyId);
        } else {
          vendors = [];
        }
      }
      
      // Apply filters
      if (category) {
        vendors = vendors.filter(v => v.category === category);
      }
      if (status) {
        vendors = vendors.filter(v => v.status === status);
      }
      if (search) {
        const searchLower = (search as string).toLowerCase();
        vendors = vendors.filter(v => 
          v.name.toLowerCase().includes(searchLower) ||
          (v.contactPerson && v.contactPerson.toLowerCase().includes(searchLower))
        );
      }
      
      res.json(vendors);
    } catch (error) {
      console.error('Vendors fetch error:', error);
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });

  app.get("/api/vendors/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      const vendor = await storage.getVendorById(req.params.id);
      
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      // Admin can only see vendors from their property
      if (user?.role === "ADMIN" && user.propertyId && vendor.propertyId !== user.propertyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor" });
    }
  });

  app.post("/api/vendors", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      
      // Admins can only create vendors in their property
      if (currentUser?.role === "ADMIN") {
        if (!currentUser.propertyId) {
          return res.status(400).json({ error: "Admin must be associated with a property" });
        }
        req.body.propertyId = currentUser.propertyId;
      }
      
      const parsed = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(parsed);
      res.status(201).json(vendor);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid vendor data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create vendor" });
    }
  });

  app.patch("/api/vendors/:id", requireRole(["IT", "ADMIN"]), express.json(), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      const vendor = await storage.getVendorById(req.params.id);
      
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      // Admins can only update vendors in their property
      if (currentUser?.role === "ADMIN" && vendor.propertyId !== currentUser.propertyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updated = await storage.updateVendor(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vendor" });
    }
  });

  app.delete("/api/vendors/:id", requireRole(["IT", "ADMIN"]), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      const vendor = await storage.getVendorById(req.params.id);
      
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      
      // Admins can only delete vendors in their property
      if (currentUser?.role === "ADMIN" && vendor.propertyId !== currentUser.propertyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const success = await storage.deleteVendor(req.params.id);
      if (success) {
        res.json({ message: "Vendor deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete vendor" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete vendor" });
    }
  });

  // ============= Document Management Routes =============
  
  // Configure multer for file uploads
  const uploadStorage = multer.memoryStorage();
  const upload = multer({
    storage: uploadStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allowed file types
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/png',
        'image/jpeg',
        'image/jpg'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, and JPEG files are allowed.'));
      }
    }
  });

  // POST /api/documents/upload - Handle file upload to object storage
  app.post("/api/documents/upload", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const currentUser = req.session!.userId;
      const { category, entityType, entityId, isPrivate, propertyId } = req.body;
      
      // Validate required fields
      if (!category || !entityType || !entityId) {
        return res.status(400).json({ error: "Missing required fields: category, entityType, entityId" });
      }

      // Determine storage path based on privacy setting
      const bucketId = 'replit-objstore-f03cc47e-4647-48c7-a05a-85bd3b031fca';
      const isPrivateFile = isPrivate === 'true' || isPrivate === true;
      const baseDir = isPrivateFile 
        ? `/replit-objstore-f03cc47e-4647-48c7-a05a-85bd3b031fca/.private`
        : `/replit-objstore-f03cc47e-4647-48c7-a05a-85bd3b031fca/public`;
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${entityType}_${entityId}_${timestamp}_${randomString}${fileExtension}`;
      const filePath = path.join(baseDir, category, fileName);
      
      // Create directory if it doesn't exist
      const dirPath = path.dirname(filePath);
      await fs.mkdir(dirPath, { recursive: true });
      
      // Write file to object storage
      await fs.writeFile(filePath, req.file.buffer);
      
      // Create document record in database
      const documentData = {
        name: req.file.originalname,
        fileUrl: filePath,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: currentUser!,
        propertyId: propertyId || null,
        category,
        entityType,
        entityId,
        isPrivate: isPrivateFile,
      };
      
      const document = await storage.createDocument(documentData);
      
      res.status(201).json({
        success: true,
        document,
        message: "File uploaded successfully"
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload file" });
    }
  });

  // GET /api/documents - List documents with filtering
  app.get("/api/documents", requireAuth, async (req, res) => {
    try {
      const { category, entityType, entityId, propertyId } = req.query;
      const currentUser = req.session!.user;
      
      let documents: Document[];
      
      if (entityType && entityId) {
        documents = await storage.getDocumentsByEntity(
          entityType as string, 
          entityId as string
        );
      } else if (propertyId) {
        documents = await storage.getDocumentsByPropertyId(propertyId as string);
      } else if (category) {
        documents = await storage.getDocumentsByCategory(category as string);
      } else {
        documents = await storage.getAllDocuments();
      }
      
      // Filter documents based on user role
      if (currentUser?.role === "ADMIN" && currentUser.propertyId) {
        documents = documents.filter(doc => 
          doc.propertyId === currentUser.propertyId
        );
      } else if (currentUser?.role === "TENANT") {
        // Tenants can only see their own documents or public documents
        documents = documents.filter(doc => 
          doc.uploadedBy === currentUser.id || !doc.isPrivate
        );
      }
      
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // GET /api/documents/:id - Get specific document details
  app.get("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const document = await storage.getDocumentById(req.params.id);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const currentUser = req.session!.user;
      
      // Check access permissions
      if (currentUser?.role === "ADMIN" && currentUser.propertyId) {
        if (document.propertyId !== currentUser.propertyId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (currentUser?.role === "TENANT") {
        if (document.uploadedBy !== currentUser?.id && document.isPrivate) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // DELETE /api/documents/:id - Delete document
  app.delete("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const document = await storage.getDocumentById(req.params.id);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const currentUser = req.session!.user;
      
      // Check delete permissions
      if (currentUser?.role === "TENANT" && document.uploadedBy !== currentUser.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      if (currentUser?.role === "ADMIN" && currentUser.propertyId) {
        if (document.propertyId !== currentUser.propertyId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      // Delete the file from storage
      try {
        await fs.unlink(document.fileUrl);
      } catch (err) {
        console.error("Error deleting file:", err);
        // Continue even if file deletion fails
      }
      
      // Delete the database record
      const success = await storage.deleteDocument(req.params.id);
      
      if (success) {
        res.json({ message: "Document deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete document" });
      }
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // GET /api/documents/download/:id - Download document
  app.get("/api/documents/download/:id", requireAuth, async (req, res) => {
    try {
      const document = await storage.getDocumentById(req.params.id);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const currentUser = req.session!.user;
      
      // Check download permissions
      if (currentUser?.role === "ADMIN" && currentUser.propertyId) {
        if (document.propertyId !== currentUser.propertyId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (currentUser?.role === "TENANT") {
        if (document.uploadedBy !== currentUser?.id && document.isPrivate) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      // Check if file exists
      try {
        await fs.access(document.fileUrl);
      } catch {
        return res.status(404).json({ error: "File not found" });
      }
      
      // Read and send the file
      const fileBuffer = await fs.readFile(document.fileUrl);
      
      res.set({
        'Content-Type': document.fileType,
        'Content-Disposition': `attachment; filename="${document.name}"`,
        'Content-Length': document.fileSize.toString(),
      });
      
      res.send(fileBuffer);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  // ============= Audit Log Routes =============
  // GET /api/audit-logs - List audit logs with filtering
  app.get("/api/audit-logs", requireRole(["IT", "ADMIN"]), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      const filters: any = {};

      // Parse query parameters
      if (req.query.userId) filters.userId = req.query.userId as string;
      if (req.query.action) filters.action = req.query.action as string;
      if (req.query.entityType) filters.entityType = req.query.entityType as string;
      if (req.query.entityId) filters.entityId = req.query.entityId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      filters.limit = limit;
      filters.offset = offset;

      // If ADMIN, only show logs for their property
      if (currentUser?.role === "ADMIN" && currentUser.propertyId) {
        filters.propertyId = currentUser.propertyId;
      }

      const logs = await storage.getAuditLogs(filters);
      
      // Enrich logs with user names
      const enrichedLogs = await Promise.all(logs.map(async (log) => {
        let userName = 'System';
        if (log.userId) {
          const user = await storage.getUser(log.userId);
          userName = user?.fullName || user?.username || 'Unknown User';
        }
        return { ...log, userName };
      }));

      res.json(enrichedLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // GET /api/audit-logs/stats - Get audit log statistics
  app.get("/api/audit-logs/stats", requireRole(["IT", "ADMIN"]), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      const filters: any = {};

      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      
      // If ADMIN, only show stats for their property
      if (currentUser?.role === "ADMIN" && currentUser.propertyId) {
        filters.propertyId = currentUser.propertyId;
      }

      const stats = await storage.getAuditLogStats(filters);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching audit log stats:", error);
      res.status(500).json({ error: "Failed to fetch audit log statistics" });
    }
  });

  // GET /api/audit-logs/export - Export audit logs to CSV
  app.get("/api/audit-logs/export", requireRole(["IT", "ADMIN"]), async (req, res) => {
    try {
      const currentUser = req.session!.user;
      const filters: any = {};

      // Parse query parameters
      if (req.query.userId) filters.userId = req.query.userId as string;
      if (req.query.action) filters.action = req.query.action as string;
      if (req.query.entityType) filters.entityType = req.query.entityType as string;
      if (req.query.entityId) filters.entityId = req.query.entityId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      // If ADMIN, only export logs for their property
      if (currentUser?.role === "ADMIN" && currentUser.propertyId) {
        filters.propertyId = currentUser.propertyId;
      }

      const logs = await storage.getAuditLogs(filters);

      // Enrich logs with user names
      const enrichedLogs = await Promise.all(logs.map(async (log) => {
        let userName = 'System';
        if (log.userId) {
          const user = await storage.getUser(log.userId);
          userName = user?.fullName || user?.username || 'Unknown User';
        }
        return { ...log, userName };
      }));

      // Create CSV content
      const headers = [
        'Date/Time',
        'User',
        'Action',
        'Entity Type',
        'Entity ID',
        'IP Address',
        'User Agent',
        'Old Values',
        'New Values',
        'Metadata'
      ];

      const csvRows = [headers.join(',')];

      for (const log of enrichedLogs) {
        const row = [
          new Date(log.createdAt).toISOString(),
          log.userName,
          log.action,
          log.entityType,
          log.entityId || '',
          log.ipAddress || '',
          log.userAgent || '',
          log.oldValues ? JSON.stringify(log.oldValues) : '',
          log.newValues ? JSON.stringify(log.newValues) : '',
          log.metadata ? JSON.stringify(log.metadata) : ''
        ];

        // Escape values and wrap in quotes if they contain commas
        const escapedRow = row.map(value => {
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });

        csvRows.push(escapedRow.join(','));
      }

      const csv = csvRows.join('\n');
      const fileName = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;

      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': Buffer.byteLength(csv).toString(),
      });

      res.send(csv);
    } catch (error) {
      console.error("Error exporting audit logs:", error);
      res.status(500).json({ error: "Failed to export audit logs" });
    }
  });

  // GET /api/audit-logs/:id - Get specific audit log
  app.get("/api/audit-logs/:id", requireRole(["IT", "ADMIN"]), async (req, res) => {
    try {
      const log = await storage.getAuditLogById(req.params.id);
      
      if (!log) {
        return res.status(404).json({ error: "Audit log not found" });
      }
      
      const currentUser = req.session!.user;
      
      // If ADMIN, check if log is from their property (if applicable)
      if (currentUser?.role === "ADMIN" && currentUser.propertyId) {
        // Note: We'd need to enhance the audit log schema to include propertyId
        // For now, ADMINs can see all logs related to their managed entities
      }

      // Enrich with user name
      let userName = 'System';
      if (log.userId) {
        const user = await storage.getUser(log.userId);
        userName = user?.fullName || user?.username || 'Unknown User';
      }

      res.json({ ...log, userName });
    } catch (error) {
      console.error("Error fetching audit log:", error);
      res.status(500).json({ error: "Failed to fetch audit log" });
    }
  });
}