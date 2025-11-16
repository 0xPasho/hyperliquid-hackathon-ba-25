import jwt from "jsonwebtoken";

const JWT_SECRET =
    process.env.JWT_ACCESS_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "30d";

export interface JwtPayload {
    userId: string;
    walletAddress: string;
}

export function generateToken(payload: JwtPayload): string {
    // @ts-ignore - TypeScript overload resolution issue with jsonwebtoken
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}

export function verifyToken(token: string): JwtPayload {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        return decoded;
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
}

export function decodeToken(token: string): JwtPayload | null {
    try {
        const decoded = jwt.decode(token) as JwtPayload;
        return decoded;
    } catch (error) {
        return null;
    }
}
