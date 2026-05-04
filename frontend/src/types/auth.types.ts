export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  phone: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  expiresIn: number;
  role: 'user' | 'admin';
  isActive?: boolean;
}