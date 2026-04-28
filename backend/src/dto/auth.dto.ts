export interface PreRegisterUserDto{
    cedula: string;
    email: string;
    name: string;
}

export interface CompleteRegisterDto{
    token: string;
    password: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface JwtPayload {
    id: string;
    email: string;
    role: string;
}