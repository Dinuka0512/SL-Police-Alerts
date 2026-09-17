import { HttpClient } from "~/lib/http";

import type { DepartmentDTO, CreateDepartmentDTO, UpdateDepartmentDTO } from "~/dto";

export class DepartmentService {
  constructor(private readonly http: HttpClient) {}

  findAll(): Promise<DepartmentDTO[]> {
    return this.http.get<DepartmentDTO[]>("/api/department");
  }

  findById(id: string): Promise<DepartmentDTO> {
    return this.http.get<DepartmentDTO>(`/api/department/${id}`);
  }

  create(input: CreateDepartmentDTO): Promise<DepartmentDTO> {
    return this.http.post<DepartmentDTO>("/api/department", input);
  }

  update(id: string, input: UpdateDepartmentDTO): Promise<DepartmentDTO> {
    return this.http.put<DepartmentDTO>(`/api/department/${id}`, input);
  }

  remove(id: string): Promise<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/department/${id}`);
  }
}