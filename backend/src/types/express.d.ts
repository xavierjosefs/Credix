import { Request } from "express"
import { JwtPayload } from "../dto/auth.dto";

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string
        originalname: string
        encoding: string
        mimetype: string
        size: number
        buffer: Buffer
      }
    }

    interface Request {
      user?: JwtPayload
      file?: Multer.File
    }
  }
}
