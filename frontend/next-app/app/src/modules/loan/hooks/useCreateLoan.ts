"use client";

import { useState } from "react";
import { createLoanService } from "../services/loan.service";
import type { CreateLoanPayload } from "../types/loan.types";

export function useCreateLoan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const createLoan = async (data: CreateLoanPayload) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await createLoanService(data);
      setSuccessMessage(response.message || "Prestamo creado correctamente.");

      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo crear el prestamo.";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createLoan,
    loading,
    error,
    successMessage,
    clearMessages: () => {
      setError(null);
      setSuccessMessage(null);
    },
  };
}
