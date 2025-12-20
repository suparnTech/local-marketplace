// src/middleware/auth.ts
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface AuthRequest extends Request {
    userId?: string;
    userRole?: string;
}

export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string;
            role: string;
        };

        req.userId = decoded.userId;
        req.userRole = decoded.role;

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }
        next();
    };
};

export const generateToken = (userId: string, role: string): string => {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "30d" });
};
