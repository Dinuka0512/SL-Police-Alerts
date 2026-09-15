import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../entities/User";
import { Department } from "../entities/Department";
import { Message } from "../entities/Message";
import { EmergancyContact } from "../entities/EmergancyContact";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mongodb",

  url: process.env.MONGO_URI,

  entities: [User, Department, Message, EmergancyContact],

  synchronize: true,

  logging: false,
});