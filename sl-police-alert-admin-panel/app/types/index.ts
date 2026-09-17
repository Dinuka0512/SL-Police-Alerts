export type DeptStatus = "Active" | "Inactive";
export type UserStatus = "Active" | "Inactive";
export type UserRole = "Admin" | "Police Officer" | "Department Officer";
export type AlertPriority = "Low" | "Medium" | "High" | "Critical";
export type AlertStatus = "Sent" | "Delivered" | "Failed";
export type DeliveryStatus = "Delivered" | "Pending" | "Failed";
export type PenaltyStatus = "Not paid" | "Paid";

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  status: DeptStatus;
  createdAt: string;
  userCount: number;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastActive: string;
}

export interface AlertDeptDelivery {
  departmentId: string;
  status: DeliveryStatus;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  priority: AlertPriority;
  status: AlertStatus;
  imageUrl: string | null;
  sentBy: string;
  departments: AlertDeptDelivery[];
  createdAt: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  policeId: string;
  email: string;
  department: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
}

export interface Penalty {
  id: string;
  code: string;
  violation: string;
  fee: string;
  vehicle: string;
  nic: string;
  location: string;
  date: string;
  issuedBy: string;
  status: PenaltyStatus;
  createdAt: string;
}

export type UpdatePenaltyInput = Partial<
  Pick<Penalty, "code" | "violation" | "fee" | "vehicle" | "nic" | "location" | "date" | "issuedBy" | "status">
>;

export type CreateDepartmentInput = Omit<Department, "id" | "createdAt" | "userCount">;
export type UpdateDepartmentInput = Partial<
  Pick<Department, "name" | "code" | "description" | "status">
>;

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  role: UserRole;
  status: UserStatus;
  policeId: string;
  password: string;
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  role?: UserRole;
  status?: UserStatus;
  policeId?: string;
  password?: string;
  lastActive?: string;
}

export type CreateAlertInput = Omit<Alert, "id" | "createdAt">;