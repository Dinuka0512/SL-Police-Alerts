import type { DepartmentDTO, CreateDepartmentDTO } from "./department.dto";
import type { UserDTO, CreateUserDTO, UpdateUserDTO } from "./user.dto";
import type { MessageDTO, CreateMessageDTO } from "./message.dto";
import type { AuthUserDTO } from "./auth.dto";

import type {
  Department,
  User,
  Alert,
  AuthUser,
  DeptStatus,
  UserRole,
  UserStatus,
  AlertPriority,
  AlertStatus,
  DeliveryStatus,
  CreateUserInput,
  UpdateUserInput,
  CreateAlertInput,
} from "~/types";

// ===== Department =====
export function departmentFromDTO(dto: DepartmentDTO, userCount = 0): Department {
  return {
    id: String(dto.d_id),
    name: dto.name,
    code: dto.code ?? "",
    description: dto.description ?? "",
    status: (dto.status ?? "Active") as DeptStatus,
    createdAt: dto.createdAt ?? "",
    userCount,
  };
}

export function toCreateDepartmentDTO(
  input: Omit<Department, "id" | "createdAt" | "userCount">
): CreateDepartmentDTO {
  return {
    name: input.name,
    code: input.code,
    description: input.description,
    status: input.status,
  };
}

// ===== User =====
export function userFromDTO(dto: UserDTO, deptNameToId: Map<string, string>): User {
  return {
    id: String(dto.u_id),
    fullName: dto.name,
    email: dto.email,
    phone: dto.contact,
    departmentId: deptNameToId.get(dto.department) ?? "",
    role: (dto.role ?? "Police Officer") as UserRole,
    status: (dto.status ?? "Active") as UserStatus,
    createdAt: dto.createdAt ?? "",
    lastActive: dto.lastActive ?? "",
  };
}

export function toCreateUserDTO(input: CreateUserInput, departmentName: string): CreateUserDTO {
  return {
    name: input.fullName,
    police_id: input.policeId,
    department: departmentName,
    email: input.email,
    password: input.password,
    contact: input.phone,
    role: input.role,
    status: input.status,
  };
}

export function toUpdateUserDTO(
  input: UpdateUserInput,
  departmentName: string | undefined
): UpdateUserDTO {
  const dto: UpdateUserDTO = {};
  if (input.fullName !== undefined) dto.name = input.fullName;
  if (input.email !== undefined) dto.email = input.email;
  if (input.phone !== undefined) dto.contact = input.phone;
  if (departmentName !== undefined) dto.department = departmentName;
  if (input.role !== undefined) dto.role = input.role;
  if (input.status !== undefined) dto.status = input.status;
  if (input.policeId !== undefined) dto.police_id = input.policeId;
  if (input.password !== undefined) dto.password = input.password;
  if (input.lastActive !== undefined) dto.lastActive = input.lastActive;
  return dto;
}

// ===== Alert (Message) =====
export function alertFromDTO(dto: MessageDTO): Alert {
  return {
    id: String(dto.m_id),
    title: dto.title,
    description: dto.content,
    priority: (dto.priority ?? "Medium") as AlertPriority,
    status: (dto.status ?? "Sent") as AlertStatus,
    imageUrl: dto.image ? dto.image : null,
    sentBy: dto.sentBy ?? "",
    departments: (dto.departments ?? []).map((d) => ({
      departmentId: d.departmentId,
      status: (d.status ?? "Pending") as DeliveryStatus,
    })),
    createdAt: dto.date ?? "",
  };
}

export function toCreateMessageDTO(input: CreateAlertInput): CreateMessageDTO {
  const now = new Date();
  return {
    title: input.title,
    content: input.description,
    image: input.imageUrl ?? "",
    date: now.toISOString(),
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    priority: input.priority,
    status: input.status,
    sentBy: input.sentBy,
    departments: input.departments.map((d) => ({
      departmentId: d.departmentId,
      status: d.status,
    })),
  };
}

// ===== Auth =====
export function authUserFromDTO(dto: AuthUserDTO): AuthUser {
  return {
    id: dto.id,
    fullName: dto.name,
    policeId: dto.police_id,
    email: dto.email,
    department: dto.department,
    phone: dto.contact,
    role: (dto.role ?? "Police Officer") as UserRole,
    status: (dto.status ?? "Active") as UserStatus,
  };
}