import prisma from '../../prisma/prisma.js'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import type { CompleteRegisterDto, PreRegisterUserDto } from '../../dto/auth.dto.js'
import { sendEmail } from '../../utils/mailer.js'
import { isValidCedula } from '../../utils/validators/cedula.js'

export const softRegisterUser = async (data: PreRegisterUserDto) => {
    const cedula = data.cedula.trim();
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();

    if (!isValidCedula(cedula)) {
        throw new Error("Invalid cedula format");
    }

    const existingPreRegisterByCedula = await prisma.preUser.findUnique({
        where: { cedula },
    });

    if (existingPreRegisterByCedula) {
        if (existingPreRegisterByCedula.expiresAt < new Date()) {
            await prisma.preUser.delete({
                where: { id: existingPreRegisterByCedula.id },
            });
        } else {
            throw new Error("There is already a pending invitation for this cedula");
        }
    }

    const existingPreRegisterByEmail = await prisma.preUser.findUnique({
        where: { email },
    });

    if (existingPreRegisterByEmail) {
        if (existingPreRegisterByEmail.expiresAt < new Date()) {
            await prisma.preUser.delete({
                where: { id: existingPreRegisterByEmail.id },
            });
        } else {
            throw new Error("There is already a pending invitation for this email");
        }
    }

    const existingUserByCedula = await prisma.user.findUnique({
        where: { cedula },
    });

    if (existingUserByCedula) {
        throw new Error("There is already a registered administrator with this cedula");
    }

    const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUserByEmail) {
        throw new Error("There is already a registered administrator with this email");
    }

    //si todo pasa creo el preRegistrop
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // El token expira en 24 horas

    const preUser = await prisma.preUser.create({
        data: {
            cedula,
            email,
            name,
            token,
            expiresAt,
        }
    })

    const link = `${process.env.FRONTEND_URL}/auth/complete-registration?token=${preUser.token}`;
    const to = preUser.email;
    const subject = "Complete your registration";
    const text = `Hello ${preUser.name},\n\nPlease click the following link to complete your registration:\n\n${link}\n\nThis link will expire in 24 hours.\n\nBest regards,\nYour Company`;
    await sendEmail(to, subject, text);

    return preUser;
}

export const completeRegistration = async (data: CompleteRegisterDto) => {
    const { token, password } = data;

    if(!token || !password) {
        throw new Error("Token and password are required");
    }

    //busco el preRegistro con el token
    const preUser = await prisma.preUser.findUnique({
        where : {token},
    })

    if (!preUser) {
        throw new Error("Invalid token");
    }

    //verificar que el token no este vencido
    if (preUser.expiresAt < new Date()) {
        throw new Error("Token has expired");
    }

    //hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    //creo el usuario real
    const user = await prisma.user.create({
        data: {
            cedula: preUser.cedula,
            email: preUser.email,
            name: preUser.name,
            password: hashedPassword,
        }
    })

    //eliminar el preRegistro
    await prisma.preUser.delete({
        where : {id: preUser.id},
    })

    //elimar el password del objeto user antes de retornarlo
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}
