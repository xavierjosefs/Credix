import { getAuthToken } from "@/app/src/modules/auth/services/session.service";
import { buildApiUrl } from "@/app/src/modules/shared/config/api";

export async function openPdfReport(path: string) {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const previewWindow =
    typeof window !== "undefined" ? window.open("", "_blank", "noopener,noreferrer") : null;

  try {
    const response = await fetch(buildApiUrl(path), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorMessage = await readPdfError(response);
      throw new Error(errorMessage || "No se pudo generar el reporte.");
    }

    const pdfBlob = await response.blob();
    const objectUrl = URL.createObjectURL(pdfBlob);

    if (previewWindow) {
      previewWindow.location.href = objectUrl;
    } else {
      window.open(objectUrl, "_blank", "noopener,noreferrer");
    }

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 60_000);
  } catch (error) {
    if (previewWindow) {
      previewWindow.close();
    }

    throw error;
  }
}

export async function downloadPdfReport(path: string, fileName?: string) {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const response = await fetch(buildApiUrl(path), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorMessage = await readPdfError(response);
    throw new Error(errorMessage || "No se pudo generar el reporte.");
  }

  const pdfBlob = await response.blob();
  const objectUrl = URL.createObjectURL(pdfBlob);
  const anchor = document.createElement("a");
  const resolvedFileName =
    fileName || getFileNameFromDisposition(response.headers.get("content-disposition")) || "reporte.pdf";

  anchor.href = objectUrl;
  anchor.download = resolvedFileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

async function readPdfError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as {
      message?: string;
      error?: string;
    };

    return payload.error || payload.message;
  }

  return response.text();
}

function getFileNameFromDisposition(contentDisposition: string | null) {
  if (!contentDisposition) {
    return null;
  }

  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? null;
}
