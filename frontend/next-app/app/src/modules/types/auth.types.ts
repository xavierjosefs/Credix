export interface AuthUser {
  id: string;
  email: string;
  cedula: string;
  name: string;
  role: string;
  createdAt?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

export interface LoginResponse {
  message: string;
  data: AuthSession;
}

export interface InviteAdminPayload {
  cedula: string;
  email: string;
  name: string;
}

export interface InviteAdminResponse {
  message: string;
  data: {
    id: string;
    cedula: string;
    email: string;
    name: string;
    token: string;
    expiresAt: string;
    createdAt: string;
  };
}

export interface CompleteRegistrationPayload {
  token: string;
  password: string;
}

export interface CompleteRegistrationResponse {
  message: string;
  data: AuthUser;
}
