import type { Request, Response } from "express";
export declare const createClientController: (req: Request, res: Response) => Promise<void>;
export declare const getClientController: (req: Request, res: Response) => Promise<void>;
export declare const getAllClientsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getClientByIdController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getClientCollectionReportController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getClientCollectionReportPdfController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateClientController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=client.controller.d.ts.map