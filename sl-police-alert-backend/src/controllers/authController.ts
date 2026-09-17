import { Request, Response } from "express";

import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { RefreshToken } from "../entities/RefreshToken";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../middleware/authMiddleware";

const userRepository = AppDataSource.getMongoRepository(User);
const refreshTokenRepository = AppDataSource.getMongoRepository(RefreshToken);

const buildAuthPayload = (user: User) => ({
  id: String(user.u_id),
  email: user.email,
  role: user.role,
});

const storeRefreshToken = async (payload: {
  token: string;
  user_id: string;
}): Promise<void> => {
  const refreshToken = refreshTokenRepository.create({
    token: payload.token,
    user_id: payload.user_id,
    expiresAt: new Date(
      Date.now() +
        (Number(process.env.JWT_REFRESH_EXPIRES_IN?.replace("d", "")) || 7) *
          24 *
          60 *
          60 *
          1000
    ).toISOString(),
    revoked: false,
    createdAt: new Date().toISOString(),
  });
  await refreshTokenRepository.save(refreshToken);
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password, app } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    const user = await userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    if (user.password !== password) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    if (user.status === "Inactive") {
      res.status(403).json({
        success: false,
        message: "This account is inactive. Contact an administrator.",
      });
      return;
    }

    if (app === "admin" && user.role !== "Admin") {
      res.status(403).json({
        success: false,
        message: "Only administrators can sign in to the admin panel.",
      });
      return;
    }

    if (app === "mobile" && user.role === "Admin") {
      res.status(403).json({
        success: false,
        message:
          "User don't have access to the mobile app. Please sign in to the admin panel.",
      });
      return;
    }

    const userId = String(user.u_id);
    const payload = buildAuthPayload(user);
    const refreshToken = generateRefreshToken(payload);

    await storeRefreshToken({ token: refreshToken, user_id: userId });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: generateToken(payload),
        tokenType: "Bearer",
        refreshToken,
        expiresIn: 15 * 60,
        user: {
          id: userId,
          name: user.name,
          police_id: user.police_id,
          department: user.department,
          email: user.email,
          contact: user.contact,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const refresh = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
      return;
    }

    const stored = await refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (!stored || stored.revoked) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
      return;
    }

    if (new Date(stored.expiresAt).getTime() < Date.now()) {
      res.status(401).json({
        success: false,
        message: "Refresh token has expired",
      });
      return;
    }

    const newRefreshToken = generateRefreshToken(payload);
    await refreshTokenRepository.update(stored.rt_id, {
      revoked: true,
    });
    await storeRefreshToken({
      token: newRefreshToken,
      user_id: payload.id,
    });

    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      data: {
        token: generateToken(payload),
        tokenType: "Bearer",
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const logout = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
      return;
    }

    const stored = await refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (stored && !stored.revoked) {
      await refreshTokenRepository.update(stored.rt_id, {
        revoked: true,
      });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};