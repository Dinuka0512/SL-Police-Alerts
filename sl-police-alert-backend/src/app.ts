import "dotenv/config";
import express, { Request, Response } from "express";

const app = express();

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
    res.json({ message: "SL Police Alert API is running" });
});

export default app;