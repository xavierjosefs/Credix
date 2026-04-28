"use client";

import { useState } from "react";
import { createClientService } from "../services/client.service";
import type { CreateClientPayload } from "../types/client.types";

export function useCreateClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const createClient = async (data: CreateClientPayload) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await createClientService(data);
      setSuccessMessage(response.message || "Cliente creado correctamente.");

      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo crear el cliente.";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createClient,
    loading,
    error,
    successMessage,
    clearMessages: () => {
      setError(null);
      setSuccessMessage(null);
    },
  };
}
