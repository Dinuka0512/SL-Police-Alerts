import { Router } from "express";

import {
  createEmergancyContact,
  getAllEmergancyContacts,
  getEmergancyContactById,
  updateEmergancyContact,
  deleteEmergancyContact,
} from "../controllers/emergancyContactController";

const router = Router();

router.post("/", createEmergancyContact);

router.get("/", getAllEmergancyContacts);

router.get("/:id", getEmergancyContactById);

router.put("/:id", updateEmergancyContact);

router.delete("/:id", deleteEmergancyContact);

export default router;