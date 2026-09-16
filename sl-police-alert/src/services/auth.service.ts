import { http } from '@/lib/api';

import type { AuthUser } from '@/store/auth';

export type LoginResult = {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};

export class AuthService {
  login(email: string, password: string): Promise<LoginResult> {
    return http.post<LoginResult>('/api/auth/login', { email, password });
  }

  logout(refreshToken: string): Promise<{ message?: string }> {
    return http.post<{ message?: string }>('/api/auth/logout', {
      refreshToken,
    });
  }
}
