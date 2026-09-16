import { Request, Response } from "express";

import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { generateToken } from "../middleware/authMiddleware";

const userRepository = AppDataSource.getMongoRepository(User);

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const user = await userRepository.findOne({
      where: { email: String(email).toLowerCase().trim() },
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

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: generateToken({
          id: String(user.u_id),
          email: user.email,
          role: user.role,
        }),
        tokenType: "Bearer",
        user: {
          id: String(user.u_id),
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