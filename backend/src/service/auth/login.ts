import type { LoginDto } from '../../dto/auth.dto.js';
import prisma from '../../prisma/prisma.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const loginUser = async (data: LoginDto) => {
    const { email, password } = data;

    // busco el usuario por email
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error("No existe un usuario con ese email");
    }

    // Comparo las contraseñas
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Contraseña incorrecta");
    }

    // Genero un token JWT
    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1d' }
    );

    // elimino el password del objeto user antes de retornarlo
    const { password: _, ...userWithoutPassword } = user;
    return {
        user: userWithoutPassword,
        token,
    };
}