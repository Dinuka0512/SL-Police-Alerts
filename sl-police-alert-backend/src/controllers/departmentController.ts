import { Request, Response } from "express";

import { ObjectId } from "mongodb";

import { AppDataSource } from "../config/data-source";

import { Department } from "../entities/Department";

const departmentRepository = AppDataSource.getMongoRepository(Department);

export const createDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;

    const existingDepartment = await departmentRepository.findOne({
      where: {
        name,
      },
    });

    if (existingDepartment) {
      res.status(400).json({ message: "Department already exists" });
      return;
    }

    const department = departmentRepository.create({ name });
    await departmentRepository.save(department);

    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: "Error creating department", error });
  }
}

// Get all departments
export const getDepartments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const departments = await departmentRepository.find();
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching departments", error });
  }
};

// Get one department by ID
export const getDepartmentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const department = await departmentRepository.findOne({
      where: {
        d_id: id,
      },
    });

    if (!department) {
      res.status(404).json({ message: "Department not found" });
      return;
    }

    res.status(200).json(department);
  } catch (error) {
    res.status(500).json({ message: "Error fetching department", error });
  }
};

// Update a department by ID
export const updateDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const department = await departmentRepository.findOne({
      where: {
        d_id: id,
      },
    });

    if (!department) {
      res.status(404).json({ message: "Department not found" });
      return;
    }

    department.name = name;
    await departmentRepository.save(department);

    res.status(200).json(department);
  } catch (error) {
    res.status(500).json({ message: "Error updating department", error });
  }
};

// Delete a department by ID
export const deleteDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const department = await departmentRepository.findOne({
      where: {
        d_id: id,
      },
    });

    if (!department) {
      res.status(404).json({ message: "Department not found" });
      return;
    }

    await departmentRepository.remove(department);
    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting department", error });
  }
};
