export interface DepartmentDTO {
  d_id: string;
  name: string;
  code: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface CreateDepartmentDTO {
  name: string;
  code: string;
  description: string;
  status: string;
}

export type UpdateDepartmentDTO = Partial<CreateDepartmentDTO>;