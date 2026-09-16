import { AppDataSource } from "./data-source";

import { Department } from "../entities/Department";
import { User } from "../entities/User";

const departmentRepository = AppDataSource.getMongoRepository(Department);
const userRepository = AppDataSource.getMongoRepository(User);

export const seedDatabase = async (): Promise<void> => {
  const deptCount = await departmentRepository.count();

  if (deptCount === 0) {
    const department = departmentRepository.create({
      name: "Colombo Police Division",
      code: "CPD",
      description: "Main police division covering Colombo district and surrounding areas.",
      status: "Active",
      createdAt: new Date().toISOString(),
    });
    await departmentRepository.save(department);
    console.log("Seeded default department: Colombo Police Division");
  }

  const userCount = await userRepository.count();

  if (userCount === 0) {
    const department = await departmentRepository.findOne({
      where: { name: "Colombo Police Division" },
    });

    const user = userRepository.create({
      name: "Sunil Perera",
      police_id: "NP-1001",
      department: department ? department.name : "Colombo Police Division",
      email: "admin@police.lk",
      password: "Admin@123",
      contact: "+94 71 234 5678",
      role: "Admin",
      status: "Active",
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });
    await userRepository.save(user);
    console.log("Seeded default admin user: admin@police.lk / Admin@123");
  }
};