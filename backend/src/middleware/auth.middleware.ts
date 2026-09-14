import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/env.js';
import { AuthenticatedRequest, JwtPayload, Role } from '../types/index.js';

/**
 * GovConnect JWT Authentication & Role-Based Authorization Middleware
 */

/**
 * Middleware that authenticates JWT from Authorization Header or Cookie
 */
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required. No token provided.' },
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Verify user exists and is not suspended
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { officerProfile: { include: { department: true } }, citizenProfile: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User account no longer exists.' },
      });
      return;
    }

    if (user.accountStatus === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended. Please contact the administrator.',
        },
      });
      return;
    }

    if (user.accountStatus === 'REJECTED') {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_REJECTED',
          message: 'Your registration request was not approved.',
        },
      });
      return;
    }

    if (!user.isEmailVerified && user.role === 'CITIZEN') {
      res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email before signing in.',
        },
      });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      fullName: user.officerProfile?.fullName || user.citizenProfile?.fullName || 'User',
      departmentCode: user.officerProfile?.department.code,
      departmentId: user.officerProfile?.departmentId,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Session expired. Please log in again.' },
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or malformed authentication token.' },
    });
  }
};

/**
 * Middleware to restrict access to specific roles
 */
export const requireRoles = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of [${allowedRoles.join(', ')}] role.`,
        },
      });
      return;
    }

    next();
  };
};

/**
 * Middleware that strictly enforces Department Isolation for Government Officers
 * e.g. Water Officer cannot view/modify Revenue internal records
 */
export const requireDepartment = (allowedDeptCode: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required.' } });
      return;
    }

    // Central Admin has cross-department oversight
    if (req.user.role === 'CENTRAL_ADMIN') {
      next();
      return;
    }

    if (req.user.role !== 'OFFICER' || req.user.departmentCode !== allowedDeptCode.toUpperCase()) {
      res.status(403).json({
        success: false,
        error: {
          code: 'DEPARTMENT_MISMATCH_FORBIDDEN',
          message: `Department isolation enforced: You are not authorized for ${allowedDeptCode} Department operations.`,
        },
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication: populates req.user if valid token present, does not fail if absent
 */
export const optionalAuthenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { officerProfile: { include: { department: true } }, citizenProfile: true },
    });

    if (user) {
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role as Role,
        fullName: user.officerProfile?.fullName || user.citizenProfile?.fullName || 'User',
        departmentCode: user.officerProfile?.department.code,
        departmentId: user.officerProfile?.departmentId,
      };
    }

    next();
  } catch {
    next();
  }
};

