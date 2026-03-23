import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.model";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const getAccessTokenSecret = () => process.env.JWT_SECRET;
const getRefreshTokenSecret = () =>
  process.env.JWT_REFRESH_SECRET!;

const buildAccessToken = (id: string, role: string) =>
  jwt.sign({ id, role }, getAccessTokenSecret()!, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

const buildRefreshToken = (id: string, role: string) =>
  jwt.sign({ id, role }, getRefreshTokenSecret()!, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

const getCookieValue = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!target) return null;
  return decodeURIComponent(target.split("=")[1] || "");
};

/* ================= REGISTER ================= */
export const register = async (req: Request, res: Response) => {
  try {
    const { firstname, lastname, email, password, role, employeeId } = req.body;

    if (!firstname || !lastname || !email || !password || !role || !employeeId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    await User.create({
      firstname,
      lastname,
      email,
      password,
      role,
      employeeId,
    });

    return res.json({ message: "User registered successfully" });
  } catch (err: any) {
    console.error("REGISTER ERROR:", err);

    // Mongoose validation error (e.g. missing required field, minlength)
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    // Duplicate key (email or employeeId already taken)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      return res
        .status(400)
        .json({ message: `${field} already exists` });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= LOGIN ================= */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!getAccessTokenSecret() || !getRefreshTokenSecret()) {
      return res.status(500).json({ message: "JWT secrets are not configured" });
    }

    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email credentials" });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: "ACCOUNT_INACTIVE",
        error: "Your account has been deactivated. Please contact an administrator to reactivate your account."
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password mismatch" });
    }

    const accessToken = buildAccessToken(String(user._id), user.role);
    const refreshToken = buildRefreshToken(String(user._id), user.role);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    return res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: "backend server error" });
  }
};

/* ================= REFRESH ================= */
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshSecret = getRefreshTokenSecret();
    if (!refreshSecret) {
      return res.status(500).json({ message: "JWT secrets are not configured" });
    }

    const refreshToken = getCookieValue(req.headers.cookie, "refreshToken");
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(
      refreshToken,
      refreshSecret
    ) as { id: string; role: string };

    const user = await User.findById(decoded.id).select("_id role");
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = buildAccessToken(String(user._id), user.role);
    return res.status(200).json({ accessToken });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

/* ================= LOGOUT ================= */
export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
  });

  return res.status(200).json({ message: "Logged out successfully" });
};

/* ================= GET LOGGED-IN USER ================= */
export const getMe = async (req: Request, res: Response) => {
  try {
    const { id } = (req as any).user;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user._id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      jobRole: user.jobRole,
      jobLevel: user.jobLevel,
    });
  } catch (err) {
    console.error("GET ME ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= RESET PASSWORD (LOGGED-IN USER) ================= */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { id } = (req as any).user;
    const { newPassword, confirmPassword } = req.body as {
      newPassword?: string;
      confirmPassword?: string;
    };

    if (!newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "newPassword and confirmPassword are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
