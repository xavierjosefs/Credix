declare module "multer" {
  import type { RequestHandler } from "express";

  export interface FileFilterCallback {
    (error: Error): void;
    (error: null, acceptFile: boolean): void;
  }

  export interface MulterInstance {
    single(fieldName: string): RequestHandler;
  }

  export interface MulterOptions {
    storage?: unknown;
    limits?: {
      fileSize?: number;
    };
    fileFilter?: (
      req: Express.Request,
      file: Express.Multer.File,
      callback: FileFilterCallback
    ) => void;
  }

  export interface MulterStatic {
    (options?: MulterOptions): MulterInstance;
    memoryStorage(): unknown;
  }

  const multer: MulterStatic;
  export default multer;
}
