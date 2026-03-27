import type { Request, Response, NextFunction } from "express";
import  jwt from "jsonwebtoken";

export const authMiddleware = ( req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        //veificar si viene algo en el header
        if(!authHeader){
            return res.status(401).json({
                message: "No token provided"
            })
        }
        //separar el Bearer del token
        const token = authHeader.split(" ")[1];

        //verificar si el token existe
        if(!token){
            return res.status(401).json({
                message: "Invalid token format"
            })
        }

        //decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        })
    }
}