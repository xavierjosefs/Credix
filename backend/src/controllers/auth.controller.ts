import type { Request, Response } from "express";
import { softRegisterUser, completeRegistration } from "../service/auth/register.js";
import { loginUser } from "../service/auth/login.js";

export const inviteAdmin = async (req: Request, res: Response) => {
    try {
        const { cedula, email, name } = req.body;
        const result = await softRegisterUser({ cedula, email, name });

        return res.status(201).json({
            message: "Admin invited successfully",
            data: result,
        });
    } catch (error: any) {
        return res.status(400).json({
            message: error.message || 'An error occurred during pre-registration.',
        });
    }
} 

export const completeRegister = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;
        const result = await completeRegistration({ token, password });

        return res.status(201).json({
            message: "Registration completed successfully",
            data: result,
        })
    } catch (error: any) {
        return res.status(400).json({
            message: error.message || 'An error occurred during registration.',
        });
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await loginUser({ email, password });
        
        return res.status(200).json({
            message: "Login successful",
            data: result,
        });
    } catch (error: any) {
        return res.status(400).json({
            message: error.message || 'An error occurred during login.',
        });
    }
}