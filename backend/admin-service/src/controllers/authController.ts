import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';

const signToken = (id: string): string =>
  jwt.sign({ id, role: 'admin' }, process.env.JWT_SECRET as string, {
    expiresIn: parseInt(process.env.JWT_EXPIRES_SECONDS ?? '604800', 10),
  });

// POST /api/admin/seed
// Creates the very first admin account. Protected by ADMIN_SEED_SECRET.
// Run once, then remove or lock this route in production.
export const seedAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { seedSecret, name, email, password } = req.body as {
      seedSecret: string;
      name: string;
      email: string;
      password: string;
    };

    if (seedSecret !== process.env.ADMIN_SEED_SECRET) {
      res.status(403).json({ message: 'Invalid seed secret' });
      return;
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'Admin already exists' });
      return;
    }

    const admin = await Admin.create({ name, email, password });
    const token = signToken(admin._id.toString());
    res.status(201).json({ message: 'Admin created', token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// POST /api/admin/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = signToken(admin._id.toString());
    res.status(200).json({
      message: 'Login successful',
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};
