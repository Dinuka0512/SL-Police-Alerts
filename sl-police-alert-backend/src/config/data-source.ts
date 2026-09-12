import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../entities/User";
import { Department } from "../entities/Department";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mongodb",

  url: process.env.MONGO_URI,

  entities: [User, Department],

  synchronize: true,

  logging: false,
});