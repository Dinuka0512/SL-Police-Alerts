import { HttpClient } from "~/lib/http";

import type { LoginCredentialsDTO, LoginResponseDTO } from "~/dto";

export class AuthService {
  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginCredentialsDTO): Promise<LoginResponseDTO> {
    return this.http.post<LoginResponseDTO>("/api/auth/login", credentials);
  }
}