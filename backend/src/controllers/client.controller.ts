import type { Request, Response } from "express";
import { createClient, getAllClients, getClient, getClientById, updateClient } from "../service/client.service.js";
import type { CreateClientDto, GetClientDto, UpdateClientDto } from "../dto/client.dto.js";
import { uploadProfileImage } from "../service/upload.service.js";

export const createClientController = async (req: Request, res: Response) => {
    try {
        const clientData = normalizeCreateClientPayload(req.body);

        if (req.file) {
            clientData.profileImage = await uploadProfileImage(req.file);
        }

        const result = await createClient(clientData);
        res.status(201).json({
            message: "Client created successfully",
            data: result
        });
    } catch (error: any) {
        res.status(400).json({
            message: "Error creating client",
            error: error.message
        });
    }
}

export const getClientController = async (req: Request, res: Response) => {
    try {
        const result = await getClient(req.query as GetClientDto);
        res.status(200).json({
            message: "Client retrieved successfully",
            data: result
        });
    } catch (error: any) {
        if (error.message == "Client not found") {
            res.status(404).json({
                message: "Client not found",
                error: error.message
            });
        } else {
            res.status(400).json({
                message: "Error retrieving client",
                error: error.message
            });
        }
    }
}

export const getAllClientsController = async (req: Request, res: Response) => {
    try {
        const result = await getAllClients(req.query as GetClientDto)
        return res.status(200).json({
            message: "Clients retrived successfully",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving clients"
        })
    }
}

export const getClientByIdController = async (req: Request, res: Response) => {
    try {
        const clientId = normalizeRouteParam(req.params.id);

        if (!clientId) {
            return res.status(400).json({
                message: "Client id is required"
            });
        }

        const result = await getClientById(clientId);
        return res.status(200).json({
            message: "Client retrieved successfully",
            data: result
        });
    } catch (error: any) {
        if (error.message === "Client not found") {
            return res.status(404).json({
                message: "Client not found",
                error: error.message
            });
        }

        return res.status(400).json({
            message: "Error retrieving client",
            error: error.message
        });
    }
}

export const updateClientController = async (req: Request, res: Response) => {
    try {
        const clientId = normalizeRouteParam(req.params.id);

        if (!clientId) {
            return res.status(400).json({
                message: "Client id is required"
            });
        }

        const clientData = normalizeUpdateClientPayload(req.body);

        if (req.file) {
            clientData.profileImage = await uploadProfileImage(req.file);
        }

        const result = await updateClient(clientId, clientData);
        return res.status(200).json({
            message: "Client updated successfully",
            data: result
        });
    } catch (error: any) {
        if (error.message === "Client not found") {
            return res.status(404).json({
                message: "Client not found",
                error: error.message
            });
        }

        return res.status(400).json({
            message: "Error updating client",
            error: error.message
        });
    }
}

function normalizeRouteParam(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
        return value[0];
    }

    return value;
}

function normalizeCreateClientPayload(body: Request["body"]): CreateClientDto {
    return normalizeClientPayload(body);
}

function normalizeUpdateClientPayload(body: Request["body"]): UpdateClientDto {
    return normalizeClientPayload(body);
}

function normalizeClientPayload(body: Request["body"]): CreateClientDto | UpdateClientDto {
    const credentials =
        typeof body.credentials === "string"
            ? JSON.parse(body.credentials)
            : body.credentials;

    const bankAccounts =
        typeof body.bankAccounts === "string"
            ? JSON.parse(body.bankAccounts)
            : body.bankAccounts;

    return {
        ...body,
        credentials,
        bankAccounts,
        profileImage:
            typeof body.profileImage === "string" && body.profileImage.trim().length > 0
                ? body.profileImage
                : undefined,
    };
}
