import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Department } from "../entities/Department";

const userRepository = AppDataSource.getMongoRepository(User);
const departmentRepository = AppDataSource.getMongoRepository(Department);

const PROTECTED_ADMIN_EMAIL = "admin@police.lk";

// CREATE
export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, police_id, department, email, password, contact, role, status } = req.body;

    if (!name || !police_id || !department || !email || !password || !contact) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    const existingUser = await userRepository.findOne({
      where: {
        email,
      },
    });

    const existingDepartment = await departmentRepository.findOne({
      where: {
        name: department,
      },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
      return;
    }

    if (!existingDepartment) {
      res.status(400).json({
        success: false,
        message: "Department not found",
      });
      return;
    }

    const user = userRepository.create({
      name,
      police_id,
      department,
      email,
      password,
      contact,
      role: role ?? "Police Officer",
      status: status ?? "Active",
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });

    const savedUser = await userRepository.save(user);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: savedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// GET ALL
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await userRepository.find();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// GET ONE
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paramId = req.params.id;

    const id = Array.isArray(paramId)
      ? paramId[0]
      : paramId;

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    const user = await userRepository.findOne({
      where: {
        _id: new ObjectId(id),
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// UPDATE
export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paramId = req.params.id;

    const id = Array.isArray(paramId)
      ? paramId[0]
      : paramId;

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    const user = await userRepository.findOne({
      where: {
        _id: new ObjectId(id),
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (user.email.toLowerCase() === PROTECTED_ADMIN_EMAIL) {
      res.status(403).json({
        success: false,
        message: "The default administrator account cannot be modified.",
      });
      return;
    }

    const { name, police_id, department, email, password, contact, role, status, lastActive } = req.body;

    if (name !== undefined) user.name = name;

    if (police_id !== undefined) user.police_id = police_id;

    if (department !== undefined) user.department = department;

    if (email !== undefined) user.email = email;

    if (password !== undefined) user.password = password;

    if (contact !== undefined) user.contact = contact;

    if (role !== undefined) user.role = role;

    if (status !== undefined) user.status = status;

    if (lastActive !== undefined) user.lastActive = lastActive;

    const updatedUser = await userRepository.save(user);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// DELETE
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paramId = req.params.id;

    const id = Array.isArray(paramId)
      ? paramId[0]
      : paramId;

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    const user = await userRepository.findOne({
      where: {
        _id: new ObjectId(id),
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (user.email.toLowerCase() === PROTECTED_ADMIN_EMAIL) {
      res.status(403).json({
        success: false,
        message: "The default administrator account cannot be deleted.",
      });
      return;
    }

    await userRepository.deleteOne({
      _id: new ObjectId(id),
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};