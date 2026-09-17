import { Request, Response } from "express";

import { ObjectId, ObjectId as MongoObjectId } from "mongodb";

import { AppDataSource } from "../config/data-source";

import { Department } from "../entities/Department";

const departmentRepository = AppDataSource.getMongoRepository(Department);

type IdParam = string | string[];

function normalizeId(paramId: string | string[]): string {
  return Array.isArray(paramId) ? paramId[0] : paramId;
}

export const createDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, code, description, status } = req.body;

    if (!name) {
      res.status(400).json({ message: "Department name is required" });
      return;
    }

    const existingDepartment = await departmentRepository.findOne({
      where: {
        name,
      },
    });

    if (existingDepartment) {
      res.status(400).json({ message: "Department already exists" });
      return;
    }

    const department = departmentRepository.create({
      name,
      code: code ?? "",
      description: description ?? "",
      status: status ?? "Active",
      createdAt: new Date().toISOString(),
    });
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
    const id = normalizeId(req.params.id as IdParam);

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid department ID" });
      return;
    }

    const department = await departmentRepository.findOne({
      where: {
        _id: new MongoObjectId(id),
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
    const id = normalizeId(req.params.id as IdParam);

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid department ID" });
      return;
    }

    const { name, code, description, status } = req.body;

    const department = await departmentRepository.findOne({
      where: {
        _id: new MongoObjectId(id),
      },
    });

    if (!department) {
      res.status(404).json({ message: "Department not found" });
      return;
    }

    if (name !== undefined) department.name = name;
    if (code !== undefined) department.code = code;
    if (description !== undefined) department.description = description;
    if (status !== undefined) department.status = status;

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
    const id = normalizeId(req.params.id as IdParam);

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid department ID" });
      return;
    }

    const result = await departmentRepository.deleteOne({
      _id: new MongoObjectId(id),
    });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: "Department not found" });
      return;
    }

    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting department", error });
  }
};