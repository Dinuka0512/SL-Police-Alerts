import { AppDataSource } from "./data-source";
import { seedDatabase } from "./seed";

const runSeed = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("MongoDB Connected Successfully");

    await seedDatabase();

    console.log("Seeding completed");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

runSeed();