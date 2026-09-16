import { Request, Response } from "express";
import { ObjectId } from "mongodb";

import { AppDataSource } from "../config/data-source";
import { Message } from "../entities/Message";

const messageRepository = AppDataSource.getMongoRepository(Message);

// CREATE
export const createMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      image,
      title,
      content,
      date,
      time,
      priority,
      status,
      sentBy,
      departments,
    } = req.body;

    if (!title || !content) {
      res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
      return;
    }

    const message = messageRepository.create({
      image: image ?? "",
      title,
      content,
      date: date ? new Date(date) : new Date(),
      time: time ?? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      priority: priority ?? "Medium",
      status: status ?? "Sent",
      sentBy: sentBy ?? "",
      departments: departments ?? [],
    });

    const savedMessage = await messageRepository.save(message);

    res.status(201).json({
      success: true,
      message: "Message created successfully",
      data: savedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
};

// GET ALL
export const getAllMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const messages = await messageRepository.find();

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
};

// GET ONE
export const getMessageById = async (
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
        message: "Invalid message ID",
      });
      return;
    }

    const message = await messageRepository.findOne({
      where: {
        m_id: new ObjectId(id),
      },
    });

    if (!message) {
      res.status(404).json({
        success: false,
        message: "Message not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
};

// UPDATE
export const updateMessage = async (
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
        message: "Invalid message ID",
      });
      return;
    }

    const message = await messageRepository.findOne({
      where: {
        m_id: new ObjectId(id),
      },
    });

    if (!message) {
      res.status(404).json({
        success: false,
        message: "Message not found",
      });
      return;
    }

    const {
      image,
      title,
      content,
      date,
      time,
      priority,
      status,
      sentBy,
      departments,
    } = req.body;

    if (image !== undefined) {
      message.image = image;
    }

    if (title !== undefined) {
      message.title = title;
    }

    if (content !== undefined) {
      message.content = content;
    }

    if (date !== undefined) {
      message.date = new Date(date);
    }

    if (time !== undefined) {
      message.time = time;
    }

    if (priority !== undefined) {
      message.priority = priority;
    }

    if (status !== undefined) {
      message.status = status;
    }

    if (sentBy !== undefined) {
      message.sentBy = sentBy;
    }

    if (departments !== undefined) {
      message.departments = departments;
    }

    const updatedMessage =
      await messageRepository.save(message);

    res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
};

// DELETE
export const deleteMessage = async (
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
        message: "Invalid message ID",
      });
      return;
    }

    const result = await messageRepository.deleteOne({
      m_id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        message: "Message not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
};