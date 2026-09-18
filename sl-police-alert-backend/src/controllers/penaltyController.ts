import { Request, Response } from "express";
import { ObjectId } from "mongodb";

import { AppDataSource } from "../config/data-source";

import { Penalty } from "../entities/Penalty";

import { EmailUtil } from "../utils/EmailUtil";

const emailUtil = new EmailUtil();

const penaltyRepository = AppDataSource.getMongoRepository(Penalty);

const normalizeId = (paramId: string | string[]): string =>
  Array.isArray(paramId) ? paramId[0] : paramId;

// CREATE
export const createPenalty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code, violation, fee, vehicle, nic, email, location, date, status, issuedBy } =
      req.body;

    if (!violation || !fee) {
      res.status(400).json({
        success: false,
        message: "Violation and fee are required",
      });
      return;
    }

    const penalty = penaltyRepository.create({
      code: code ?? "",
      violation,
      fee,
      vehicle: vehicle ?? "",
      nic: nic ?? "",
      email: email ?? "",
      location: location ?? "",
      date: date ?? new Date().toISOString().slice(0, 10),
      status: status ?? "Not paid",
      issuedBy: issuedBy ?? "",
      createdAt: new Date().toISOString(),
    });

    const savedPenalty = await penaltyRepository.save(penalty);

    if (savedPenalty.email) {
      try {
        await emailUtil.sendEmail(
          savedPenalty.email,
          "Penalty Issued",
          `Dear Sir/Madam,\n\nA traffic penalty has been issued against you.\n\nPenalty Code: ${savedPenalty.code || "N/A"}\nViolation: ${savedPenalty.violation}\nFee: Rs. ${savedPenalty.fee}\nVehicle: ${savedPenalty.vehicle || "N/A"}\nDate: ${savedPenalty.date}\nLocation: ${savedPenalty.location || "N/A"}\nStatus: ${savedPenalty.status}\n\nPlease settle the penalty before the due date.\n\nBest regards,\nSri Lanka Police`
        );
      } catch (emailError) {
        console.error("Failed to send penalty creation email:", emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: "Penalty created successfully",
      data: savedPenalty,
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
export const getAllPenalties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const penalties = await penaltyRepository.find();

    res.status(200).json({
      success: true,
      count: penalties.length,
      data: penalties,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// SEARCH
export const searchPenalties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const q = String(req.query.q ?? "").trim();

    if (!q) {
      const penalties = await penaltyRepository.find();
      res.status(200).json({
        success: true,
        count: penalties.length,
        data: penalties,
      });
      return;
    }

    const regex = new RegExp(q, "i");

    const penalties = await penaltyRepository.find({
      where: {
        $or: [
          { code: { $regex: regex } },
          { violation: { $regex: regex } },
          { vehicle: { $regex: regex } },
          { nic: { $regex: regex } },
          { email: { $regex: regex } },
          { location: { $regex: regex } },
          { issuedBy: { $regex: regex } },
        ],
      },
    });

    res.status(200).json({
      success: true,
      count: penalties.length,
      data: penalties,
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
export const getPenaltyById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = normalizeId(req.params.id);

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid penalty ID",
      });
      return;
    }

    const penalty = await penaltyRepository.findOne({
      where: {
        _id: new ObjectId(id),
      },
    });

    if (!penalty) {
      res.status(404).json({
        success: false,
        message: "Penalty not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: penalty,
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
export const updatePenalty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = normalizeId(req.params.id);

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid penalty ID",
      });
      return;
    }

    const penalty = await penaltyRepository.findOne({
      where: {
        _id: new ObjectId(id),
      },
    });

    if (!penalty) {
      res.status(404).json({
        success: false,
        message: "Penalty not found",
      });
      return;
    }

    const { code, violation, fee, vehicle, nic, email, location, date, status, issuedBy } =
      req.body;

    const previousStatus = penalty.status;

    if (code !== undefined) penalty.code = code;
    if (violation !== undefined) penalty.violation = violation;
    if (fee !== undefined) penalty.fee = fee;
    if (vehicle !== undefined) penalty.vehicle = vehicle;
    if (nic !== undefined) penalty.nic = nic;
    if (email !== undefined) penalty.email = email;
    if (location !== undefined) penalty.location = location;
    if (date !== undefined) penalty.date = date;
    if (status !== undefined) penalty.status = status;
    if (issuedBy !== undefined) penalty.issuedBy = issuedBy;

    const updatedPenalty = await penaltyRepository.save(penalty);

    if (updatedPenalty.email && updatedPenalty.status === "Paid" && previousStatus !== "Paid") {
      try {
        await emailUtil.sendEmail(
          updatedPenalty.email,
          "Penalty Payment Confirmation",
          `Dear Sir/Madam,\n\nWe confirm that your traffic penalty has been paid successfully.\n\nPenalty Code: ${updatedPenalty.code || "N/A"}\nViolation: ${updatedPenalty.violation}\nFee Paid: Rs. ${updatedPenalty.fee}\nVehicle: ${updatedPenalty.vehicle || "N/A"}\nDate: ${updatedPenalty.date}\nLocation: ${updatedPenalty.location || "N/A"}\nStatus: Paid\n\nThank you for settling the penalty.\n\nBest regards,\nSri Lanka Police`
        );
      } catch (emailError) {
        console.error("Failed to send penalty payment email:", emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Penalty updated successfully",
      data: updatedPenalty,
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
export const deletePenalty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = normalizeId(req.params.id);

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid penalty ID",
      });
      return;
    }

    const result = await penaltyRepository.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        message: "Penalty not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Penalty deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};