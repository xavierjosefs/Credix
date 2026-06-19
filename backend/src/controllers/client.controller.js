import { createClient, getAllClients, getClient, getClientById, getClientCollectionReport, updateClient } from "../service/client.service.js";
import { uploadProfileImage } from "../service/upload.service.js";
import { generateClientCollectionReportPdf } from "../service/report.service.js";
export const createClientController = async (req, res) => {
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
    }
    catch (error) {
        res.status(400).json({
            message: "Error creating client",
            error: error.message
        });
    }
};
export const getClientController = async (req, res) => {
    try {
        const result = await getClient(req.query);
        res.status(200).json({
            message: "Client retrieved successfully",
            data: result
        });
    }
    catch (error) {
        if (error.message == "Client not found") {
            res.status(404).json({
                message: "Client not found",
                error: error.message
            });
        }
        else {
            res.status(400).json({
                message: "Error retrieving client",
                error: error.message
            });
        }
    }
};
export const getAllClientsController = async (req, res) => {
    try {
        const result = await getAllClients(req.query);
        return res.status(200).json({
            message: "Clients retrived successfully",
            data: result
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Error retrieving clients"
        });
    }
};
export const getClientByIdController = async (req, res) => {
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
    }
    catch (error) {
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
};
export const getClientCollectionReportController = async (req, res) => {
    try {
        const result = await getClientCollectionReport(req.query);
        return res.status(200).json({
            message: "Client collection report retrieved successfully",
            ...result
        });
    }
    catch (error) {
        return res.status(400).json({
            message: "Error retrieving client collection report",
            error: error.message
        });
    }
};
export const getClientCollectionReportPdfController = async (req, res) => {
    try {
        const pdf = await generateClientCollectionReportPdf(req.query);
        return sendPdfResponse(res, pdf.buffer, pdf.fileName);
    }
    catch (error) {
        return res.status(400).json({
            message: "Error generating client collection report",
            error: error.message
        });
    }
};
export const updateClientController = async (req, res) => {
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
    }
    catch (error) {
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
};
function normalizeRouteParam(value) {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
function normalizeCreateClientPayload(body) {
    return normalizeClientPayload(body);
}
function normalizeUpdateClientPayload(body) {
    return normalizeClientPayload(body);
}
function normalizeClientPayload(body) {
    const credentials = typeof body.credentials === "string"
        ? JSON.parse(body.credentials)
        : body.credentials;
    const bankAccounts = typeof body.bankAccounts === "string"
        ? JSON.parse(body.bankAccounts)
        : body.bankAccounts;
    return {
        ...body,
        credentials,
        bankAccounts,
        profileImage: typeof body.profileImage === "string" && body.profileImage.trim().length > 0
            ? body.profileImage
            : undefined,
    };
}
function sendPdfResponse(res, pdfBuffer, fileName) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    return res.status(200).send(pdfBuffer);
}
//# sourceMappingURL=client.controller.js.map