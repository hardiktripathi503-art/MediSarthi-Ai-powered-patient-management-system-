import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
import { PatientProfileModel } from '../models/PatientProfile.js';
import { registerSchema, loginSchema } from '../../../shared/schemas/index.js';
import { AuthRequest } from '../middleware/auth.js';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = registerSchema.parse(req.body);
    const existing = await UserModel.findOne({ email: validated.email.toLowerCase() });

    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    const user = await UserModel.create({
      name: validated.name,
      email: validated.email.toLowerCase(),
      passwordHash,
      role: validated.role,
      language: validated.language,
    });

    if (user.role === 'PATIENT') {
      await PatientProfileModel.create({
        userId: user._id,
        name: user.name,
        age: validated.age !== undefined ? validated.age : 30,
        gender: validated.gender || 'OTHER',
        contact: '',
        allergies: [],
        chronicConditions: [],
        medications: [],
      });
    }

    const secret = process.env.JWT_SECRET || 'medisaarthi_super_secure_jwt_secret_sih2026';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = loginSchema.parse(req.body);
    const user = await UserModel.findOne({ email: validated.email.toLowerCase() });

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'medisaarthi_super_secure_jwt_secret_sih2026';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated' });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: { user: user.toJSON() },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    message: 'User successfully logged out. Session terminated.',
  });
}
