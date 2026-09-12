import "reflect-metadata";

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { AppDataSource } from "./config/data-source";
import userRoutes from "./routes/userRoute";
import departmentRoutes from "./routes/departmentRoute";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TypeORM + MongoDB API is running",
  });
});

app.use("/api/users", userRoutes);
app.use("/api/department", departmentRoutes);

const PORT = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();

    console.log("MongoDB Connected Successfully");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();