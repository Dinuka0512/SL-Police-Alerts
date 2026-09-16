import { http } from "~/lib/http";

import { DepartmentService } from "./department.service";
import { UserService } from "./user.service";
import { MessageService } from "./message.service";
import { AuthService } from "./auth.service";

export const departmentService = new DepartmentService(http);
export const userService = new UserService(http);
export const messageService = new MessageService(http);
export const authService = new AuthService(http);

export { DepartmentService } from "./department.service";
export { UserService } from "./user.service";
export { MessageService } from "./message.service";
export { AuthService } from "./auth.service";