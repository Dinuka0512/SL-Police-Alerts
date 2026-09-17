export interface LoginCredentialsDTO {
  email: string;
  password: string;
}

export interface AuthUserDTO {
  id: string;
  name: string;
  police_id: string;
  department: string;
  email: string;
  contact: string;
  role: string;
  status: string;
}

export interface LoginResponseDTO {
  token: string;
  tokenType: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUserDTO;
}

export interface RefreshTokensDTO {
  token: string;
  tokenType: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LogoutResponseDTO {
  message: string;
}