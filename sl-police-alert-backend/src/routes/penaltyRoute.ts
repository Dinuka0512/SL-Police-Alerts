import { Router } from "express";

import { authenticateToken } from "../middleware/authMiddleware";

import {
  createPenalty,
  getAllPenalties,
  getPenaltyById,
  updatePenalty,
  deletePenalty,
  searchPenalties,
} from "../controllers/penaltyController";

const router = Router();

router.use(authenticateToken);

router.post("/", createPenalty);

router.get("/", getAllPenalties);

router.get("/search", searchPenalties);

router.get("/:id", getPenaltyById);

router.put("/:id", updatePenalty);

router.delete("/:id", deletePenalty);

export default router;