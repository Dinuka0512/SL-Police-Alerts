import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "mysql",

    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "0512",
    database: process.env.DB_DATABASE || "my_database",

    entities: ["src/entities/**/*.ts"],

    synchronize: true,

    logging: false,
});