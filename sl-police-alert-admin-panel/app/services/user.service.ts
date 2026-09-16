import { HttpClient } from "~/lib/http";

import type { UserDTO, CreateUserDTO, UpdateUserDTO } from "~/dto";

export class UserService {
  constructor(private readonly http: HttpClient) {}

  findAll(): Promise<UserDTO[]> {
    return this.http.get<UserDTO[]>("/api/users");
  }

  findById(id: string): Promise<UserDTO> {
    return this.http.get<UserDTO>(`/api/users/${id}`);
  }

  create(input: CreateUserDTO): Promise<UserDTO> {
    return this.http.post<UserDTO>("/api/users", input);
  }

  update(id: string, input: UpdateUserDTO): Promise<UserDTO> {
    return this.http.put<UserDTO>(`/api/users/${id}`, input);
  }

  remove(id: string): Promise<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/users/${id}`);
  }
}