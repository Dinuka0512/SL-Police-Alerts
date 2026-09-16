import { Router } from "express";

import { authenticateToken } from "../middleware/authMiddleware";

import {
  createEmergancyContact,
  getAllEmergancyContacts,
  getEmergancyContactById,
  updateEmergancyContact,
  deleteEmergancyContact,
} from "../controllers/emergancyContactController";

const router = Router();

router.use(authenticateToken);

router.post("/", createEmergancyContact);

router.get("/", getAllEmergancyContacts);

router.get("/:id", getEmergancyContactById);

router.put("/:id", updateEmergancyContact);

router.delete("/:id", deleteEmergancyContact);

export default router;