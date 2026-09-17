export interface UserDTO {
  u_id: string;
  name: string;
  police_id: string;
  department: string;
  email: string;
  password?: string;
  contact: string;
  role?: string;
  status?: string;
  createdAt?: string;
  lastActive?: string;
}

export interface CreateUserDTO {
  name: string;
  police_id: string;
  department: string;
  email: string;
  password: string;
  contact: string;
  role: string;
  status: string;
}

export type UpdateUserDTO = Partial<CreateUserDTO> & { lastActive?: string };