import { Request } from "express"
import { JwtPayload } from "../dto/auth.dto";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}