import { Request, Response } from "express";
import { ObjectId } from "mongodb";

import { AppDataSource } from "../config/data-source";
import { EmergancyContact } from "../entities/EmergancyContact";

const emergancyContactRepository =
  AppDataSource.getMongoRepository(EmergancyContact);

// CREATE
export const createEmergancyContact = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, title, contact, description } = req.body;

    if (!name || !title || !contact || !description) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    const emergancyContact = emergancyContactRepository.create({
      name,
      title,
      contact,
      description,
    });

    const savedContact =
      await emergancyContactRepository.save(emergancyContact);

    res.status(201).json({
      success: true,
      message: "Emergency contact created successfully",
      data: savedContact,
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
export const getAllEmergancyContacts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const contacts = await emergancyContactRepository.find();

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
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
export const getEmergancyContactById = async (
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
        message: "Invalid emergency contact ID",
      });
      return;
    }

    const contact = await emergancyContactRepository.findOne({
      where: {
        _id: new ObjectId(id),
      },
    });

    if (!contact) {
      res.status(404).json({
        success: false,
        message: "Emergency contact not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: contact,
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
export const updateEmergancyContact = async (
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
        message: "Invalid emergency contact ID",
      });
      return;
    }

    const contactData = await emergancyContactRepository.findOne({
      where: {
        _id: new ObjectId(id),
      },
    });

    if (!contactData) {
      res.status(404).json({
        success: false,
        message: "Emergency contact not found",
      });
      return;
    }

    const { name, title, contact, description } = req.body;

    if (name !== undefined) {
      contactData.name = name;
    }

    if (title !== undefined) {
      contactData.title = title;
    }

    if (contact !== undefined) {
      contactData.contact = contact;
    }

    if (description !== undefined) {
      contactData.description = description;
    }

    const updatedContact =
      await emergancyContactRepository.save(contactData);

    res.status(200).json({
      success: true,
      message: "Emergency contact updated successfully",
      data: updatedContact,
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
export const deleteEmergancyContact = async (
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
        message: "Invalid emergency contact ID",
      });
      return;
    }

    const result = await emergancyContactRepository.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        message: "Emergency contact not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Emergency contact deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};