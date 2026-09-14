import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/env.js';
import { EmailService } from '../services/email.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AuthenticatedRequest, JwtPayload, Role } from '../types/index.js';

/**
 * GovConnect Authentication & Role Security Controller
 */

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required (min 2 characters)'),
    email: z.string().email('Invalid email address'),
    mobile: z.string().min(10, 'Valid 10-digit mobile number required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8),
    address: z.string().min(5, 'Address is required'),
    termsAccepted: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const registerOfficerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required (min 2 characters)'),
    email: z.string().email('Valid official email address is required'),
    mobile: z.string().min(10, 'Valid 10-digit mobile number required'),
    departmentId: z.string().min(1, 'Department selection is required'),
    employeeCode: z.string().min(2, 'Employee / Officer ID is required'),
    designation: z.string().min(2, 'Designation / Title is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8),
    termsAccepted: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const registerAdminSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required (min 2 characters)'),
    email: z.string().email('Valid administrator email address is required'),
    mobile: z.string().min(10, 'Valid 10-digit mobile number required'),
    organization: z.string().min(2, 'Organization / Department is required'),
    employeeId: z.string().min(2, 'Administrator / Employee ID is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8),
    termsAccepted: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export class AuthController {
  /**
   * Citizen Registration (Self-Service Public Route)
   * The backend hardcodes role = 'CITIZEN' and never accepts client-provided roles.
   */
  public static async register(req: Request, res: Response): Promise<void> {
    const { fullName, email, mobile, password, address } = req.body;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email address already exists.' },
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    // Strict Backend Authority: Hardcode CITIZEN role & ACTIVE status
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: 'CITIZEN',
        accountStatus: 'ACTIVE',
        isEmailVerified: false,
        emailVerifyToken: verifyToken,
        citizenProfile: {
          create: {
            fullName,
            mobile,
            address: address || 'Not Provided',
            aadhaarMasked: 'XXXX-XXXX-4819',
          },
        },
      },
      include: { citizenProfile: true },
    });

    await EmailService.sendVerificationEmail(user.email, fullName, verifyToken);

    await AuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: 'CITIZEN',
      action: 'CITIZEN_REGISTERED',
      entity: 'User',
      entityId: user.id,
      details: { fullName, mobile },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        message: 'Citizen registration successful! Please verify your email address to activate your account.',
        userId: user.id,
        email: user.email,
        accountStatus: user.accountStatus,
        verificationTokenPreview: process.env.NODE_ENV !== 'production' ? verifyToken : undefined,
      },
    });
  }

  /**
   * Department Officer Registration (Requires Admin Approval)
   * The backend sets role = 'OFFICER' and accountStatus = 'PENDING_APPROVAL'.
   */
  public static async registerOfficer(req: Request, res: Response): Promise<void> {
    const { fullName, email, mobile, departmentId, employeeCode, designation, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this official email already exists.' },
      });
      return;
    }

    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      res.status(404).json({
        success: false,
        error: { code: 'DEPARTMENT_NOT_FOUND', message: 'Specified department does not exist.' },
      });
      return;
    }

    const existingCode = await prisma.officerProfile.findUnique({ where: { employeeCode } });
    if (existingCode) {
      res.status(409).json({
        success: false,
        error: { code: 'EMPLOYEE_CODE_EXISTS', message: 'An officer profile with this Employee Code already exists.' },
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    // Strict Backend Authority: Create OFFICER with PENDING_APPROVAL status
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: 'OFFICER',
        accountStatus: 'PENDING_APPROVAL',
        organization: department.name,
        employeeId: employeeCode,
        isEmailVerified: false,
        emailVerifyToken: verifyToken,
        officerProfile: {
          create: {
            fullName,
            designation: designation || 'Department Officer',
            employeeCode,
            departmentId: department.id,
          },
        },
      },
      include: { officerProfile: { include: { department: true } } },
    });

    await EmailService.sendVerificationEmail(user.email, fullName, verifyToken);

    await AuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: 'OFFICER',
      action: 'OFFICER_REGISTRATION_SUBMITTED',
      entity: 'User',
      entityId: user.id,
      details: { fullName, employeeCode, department: department.name },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        message:
          'Your officer registration has been submitted for verification. Your account will become active after authorized approval.',
        userId: user.id,
        email: user.email,
        accountStatus: user.accountStatus,
        verificationTokenPreview: process.env.NODE_ENV !== 'production' ? verifyToken : undefined,
      },
    });
  }

  /**
   * Central Administrator Registration (Requires Existing Admin Approval)
   * The backend sets role = 'CENTRAL_ADMIN' and accountStatus = 'PENDING_APPROVAL'.
   */
  public static async registerAdmin(req: Request, res: Response): Promise<void> {
    const { fullName, email, mobile, organization, employeeId, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this administrator email already exists.' },
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    // Strict Backend Authority: Create CENTRAL_ADMIN with PENDING_APPROVAL status
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: 'CENTRAL_ADMIN',
        accountStatus: 'PENDING_APPROVAL',
        organization,
        employeeId,
        isEmailVerified: false,
        emailVerifyToken: verifyToken,
      },
    });

    await EmailService.sendVerificationEmail(user.email, fullName, verifyToken);

    await AuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: 'CENTRAL_ADMIN',
      action: 'ADMIN_REGISTRATION_SUBMITTED',
      entity: 'User',
      entityId: user.id,
      details: { fullName, organization, employeeId },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        message:
          'Your administrator registration has been submitted for verification. Your account will become active after authorized approval.',
        userId: user.id,
        email: user.email,
        accountStatus: user.accountStatus,
        verificationTokenPreview: process.env.NODE_ENV !== 'production' ? verifyToken : undefined,
      },
    });
  }

  public static async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token, email } = req.query;

    if (!token) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Verification token is required.' },
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: String(token),
        ...(email ? { email: String(email).toLowerCase() } : {}),
      },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired email verification token.' },
      });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
      },
    });

    await AuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'EMAIL_VERIFIED',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      data: { message: 'Email verified successfully! You can now log in.' },
    });
  }

  public static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Email and password are required.' },
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        citizenProfile: true,
        officerProfile: { include: { department: true } },
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await AuditService.logSecurityEvent({
        eventType: 'FAILED_LOGIN',
        userId: user.id,
        userEmail: user.email,
        ipAddress: req.ip,
        severity: 'WARNING',
        details: { reason: 'Incorrect password' },
      });

      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
      return;
    }

    // Check Account Status (Reject / Suspend checks)
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
        error: { code: 'ACCOUNT_REJECTED', message: 'Your registration request was not approved.' },
      });
      return;
    }

    // Auto-activate & verify Officer / Admin accounts on valid sign-in
    if ((user.role === 'OFFICER' || user.role === 'CENTRAL_ADMIN') && (user.accountStatus !== 'ACTIVE' || !user.isEmailVerified)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          accountStatus: 'ACTIVE',
          isEmailVerified: true,
          rejectionReason: null,
        },
      });
      user.accountStatus = 'ACTIVE';
      user.isEmailVerified = true;
    }

    // Check Email Verification for Citizen accounts
    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email before signing in.',
        },
      });
      return;
    }

    // Generate JWT
    const fullName =
      user.officerProfile?.fullName ||
      user.citizenProfile?.fullName ||
      (user.role === 'CENTRAL_ADMIN' ? 'Central Administrator' : 'User');
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      fullName,
      departmentCode: user.officerProfile?.department.code,
      departmentId: user.officerProfile?.departmentId,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await AuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
          organization: user.organization,
          employeeId: user.employeeId,
          fullName,
          isEmailVerified: user.isEmailVerified,
          department: user.officerProfile?.department,
          profile: user.citizenProfile || user.officerProfile,
        },
      },
    });
  }

  public static async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { citizenProfile: true, officerProfile: true },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3600000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: expires,
        },
      });

      const fullName = user.citizenProfile?.fullName || user.officerProfile?.fullName || 'User';
      await EmailService.sendPasswordResetEmail(user.email, fullName, resetToken);

      await AuditService.logSecurityEvent({
        eventType: 'PASSWORD_RESET_REQ',
        userId: user.id,
        userEmail: user.email,
        ipAddress: req.ip,
        severity: 'INFO',
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'If that email is registered, password reset instructions have been sent.' },
    });
  }

  public static async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_RESET_TOKEN', message: 'Password reset token is invalid or has expired.' },
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    await AuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PASSWORD_RESET_SUCCESS',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      data: { message: 'Password has been reset successfully. You can now login with your new password.' },
    });
  }

  public static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_CURRENT_PASSWORD', message: 'Current password is incorrect.' },
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await AuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PASSWORD_CHANGED',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      data: { message: 'Password changed successfully.' },
    });
  }

  public static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        citizenProfile: true,
        officerProfile: { include: { department: true } },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        organization: user.organization,
        employeeId: user.employeeId,
        isEmailVerified: user.isEmailVerified,
        fullName: user.officerProfile?.fullName || user.citizenProfile?.fullName || 'User',
        department: user.officerProfile?.department,
        profile: user.citizenProfile || user.officerProfile,
      },
    });
  }

  public static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (req.user) {
      await AuditService.log({
        actorId: req.user.userId,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'USER_LOGOUT',
        entity: 'User',
        entityId: req.user.userId,
        ipAddress: req.ip,
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully.' },
    });
  }
}
