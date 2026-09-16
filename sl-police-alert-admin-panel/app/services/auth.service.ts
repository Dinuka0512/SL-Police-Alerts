import { HttpClient } from "~/lib/http";

import type {
  LoginCredentialsDTO,
  LoginResponseDTO,
  LogoutResponseDTO,
  RefreshTokensDTO,
} from "~/dto";

export class AuthService {
  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginCredentialsDTO): Promise<LoginResponseDTO> {
    return this.http.post<LoginResponseDTO>("/api/auth/login", credentials);
  }

  refresh(refreshToken: string): Promise<RefreshTokensDTO> {
    return this.http.post<RefreshTokensDTO>("/api/auth/refresh", { refreshToken });
  }

  logout(refreshToken: string): Promise<LogoutResponseDTO> {
    return this.http.post<LogoutResponseDTO>("/api/auth/logout", { refreshToken });
  }
}