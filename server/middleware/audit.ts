import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import type { InsertAuditLog } from "@shared/schema";

// Helper to get IP address
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// Helper to extract entity info from URL
function extractEntityInfo(url: string): { entityType?: string; entityId?: string } {
  const patterns = [
    { regex: /\/api\/properties\/([^/]+)/, entityType: 'property' },
    { regex: /\/api\/units\/([^/]+)/, entityType: 'unit' },
    { regex: /\/api\/tenants\/([^/]+)/, entityType: 'tenant' },
    { regex: /\/api\/owners\/([^/]+)/, entityType: 'owner' },
    { regex: /\/api\/users\/([^/]+)/, entityType: 'user' },
    { regex: /\/api\/maintenance-requests\/([^/]+)/, entityType: 'maintenance_request' },
    { regex: /\/api\/transactions\/([^/]+)/, entityType: 'transaction' },
    { regex: /\/api\/announcements\/([^/]+)/, entityType: 'announcement' },
    { regex: /\/api\/projects\/([^/]+)/, entityType: 'project' },
    { regex: /\/api\/contractors\/([^/]+)/, entityType: 'contractor' },
    { regex: /\/api\/vendors\/([^/]+)/, entityType: 'vendor' },
    { regex: /\/api\/settings\/([^/]+)/, entityType: 'settings' },
    { regex: /\/api\/documents\/([^/]+)/, entityType: 'document' },
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern.regex);
    if (match) {
      return { entityType: pattern.entityType, entityId: match[1] };
    }
  }

  // Extract entity type from POST requests to collections
  const collectionPatterns = [
    { regex: /\/api\/properties\/?$/, entityType: 'property' },
    { regex: /\/api\/units\/?$/, entityType: 'unit' },
    { regex: /\/api\/tenants\/?$/, entityType: 'tenant' },
    { regex: /\/api\/owners\/?$/, entityType: 'owner' },
    { regex: /\/api\/users\/?$/, entityType: 'user' },
    { regex: /\/api\/maintenance-requests\/?$/, entityType: 'maintenance_request' },
    { regex: /\/api\/transactions\/?$/, entityType: 'transaction' },
    { regex: /\/api\/announcements\/?$/, entityType: 'announcement' },
    { regex: /\/api\/projects\/?$/, entityType: 'project' },
    { regex: /\/api\/contractors\/?$/, entityType: 'contractor' },
    { regex: /\/api\/vendors\/?$/, entityType: 'vendor' },
    { regex: /\/api\/documents\/?$/, entityType: 'document' },
  ];

  for (const pattern of collectionPatterns) {
    if (pattern.regex.test(url)) {
      return { entityType: pattern.entityType };
    }
  }

  return {};
}

// Map HTTP method to action
function getActionFromMethod(method: string, url: string): string {
  if (url.includes('/login')) return 'LOGIN';
  if (url.includes('/logout')) return 'LOGOUT';
  if (url.includes('/export')) return 'EXPORT';
  
  switch (method.toUpperCase()) {
    case 'POST': return 'CREATE';
    case 'PUT':
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    case 'GET': 
      if (url.includes('/api/audit-logs')) return 'VIEW';
      return 'VIEW';
    default: return 'UNKNOWN';
  }
}

// Store original body for comparison
export function captureOriginalBody(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'PUT' || req.method === 'PATCH') {
    // Store the original body for later comparison
    req.originalBody = req.body ? JSON.parse(JSON.stringify(req.body)) : null;
  }
  next();
}

// Main audit logging middleware
export function auditLog(options?: { 
  skipRoutes?: string[];
  includeGetRequests?: boolean;
}) {
  const skipRoutes = options?.skipRoutes || ['/api/auth/me', '/api/notifications'];
  const includeGetRequests = options?.includeGetRequests || false;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if route is in skip list
    if (skipRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    // Skip GET requests unless explicitly included
    if (req.method === 'GET' && !includeGetRequests && !req.path.includes('/api/audit-logs')) {
      return next();
    }

    // Capture the original send function
    const originalSend = res.send;
    const originalJson = res.json;
    let responseBody: any = null;

    // Override send function to capture response
    res.send = function(data: any) {
      responseBody = data;
      res.send = originalSend;
      return originalSend.call(this, data);
    };

    // Override json function to capture response
    res.json = function(data: any) {
      responseBody = data;
      res.json = originalJson;
      return originalJson.call(this, data);
    };

    // Continue with the request
    const originalEnd = res.end;
    res.end = async function(...args: any[]) {
      // Only log if request was successful or it's an auth failure
      const shouldLog = res.statusCode < 400 || 
                       res.statusCode === 401 || 
                       res.statusCode === 403 ||
                       req.path.includes('/login');

      if (shouldLog && req.session?.userId) {
        try {
          const { entityType, entityId } = extractEntityInfo(req.path);
          const action = getActionFromMethod(req.method, req.path);
          
          const auditEntry: InsertAuditLog = {
            userId: req.session.userId,
            action,
            entityType: entityType || 'unknown',
            entityId: entityId || (responseBody?.id || responseBody?.data?.id),
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent'] || 'unknown',
            metadata: {
              method: req.method,
              path: req.path,
              query: req.query,
              statusCode: res.statusCode,
            }
          };

          // Add old/new values for updates
          if (action === 'UPDATE' && req.originalBody) {
            auditEntry.oldValues = req.originalBody;
            auditEntry.newValues = req.body;
          } else if (action === 'CREATE' && req.body) {
            auditEntry.newValues = req.body;
          } else if (action === 'DELETE' && responseBody) {
            auditEntry.oldValues = responseBody;
          }

          // Log to database
          await storage.createAuditLog(auditEntry);
        } catch (error) {
          console.error('Failed to create audit log:', error);
          // Don't fail the request if audit logging fails
        }
      }

      // Call the original end function
      return originalEnd.apply(res, args);
    };

    next();
  };
}

// Specific middleware for auth events
export async function auditAuthEvent(
  userId: string | undefined, 
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED',
  req: Request,
  metadata?: any
) {
  try {
    const auditEntry: InsertAuditLog = {
      userId: userId || null,
      action,
      entityType: 'user',
      entityId: userId,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: {
        ...metadata,
        username: req.body?.username,
        timestamp: new Date().toISOString()
      }
    };

    await storage.createAuditLog(auditEntry);
  } catch (error) {
    console.error('Failed to audit auth event:', error);
  }
}

// Declare module to add custom properties to Request
declare module 'express-serve-static-core' {
  interface Request {
    originalBody?: any;
  }
}