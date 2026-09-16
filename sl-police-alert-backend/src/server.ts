import "reflect-metadata";

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { AppDataSource } from "./config/data-source";
import { seedDatabase } from "./config/seed";
import userRoutes from "./routes/userRoute";
import departmentRoutes from "./routes/departmentRoute";
import messageRoutes from "./routes/messageRoute";
import emergancyContactRoutes from "./routes/emergancyContactRoute";
import penaltyRoutes from "./routes/penaltyRoute";
import authRoutes from "./routes/authRoute";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TypeORM + MongoDB API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/emergancyContacts", emergancyContactRoutes);
app.use("/api/penalties", penaltyRoutes);

const PORT = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();

    console.log("MongoDB Connected Successfully");

    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();