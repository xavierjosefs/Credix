import type { ClientReportFiltersDto } from "../dto/client.dto.js";
import type { GetCashMovementsDto } from "../dto/cash.dto.js";
type CashReportFilters = GetCashMovementsDto & {
    admin?: string;
    q?: string;
};
type DisbursementReportFilters = {
    movementId?: string;
    amount?: string;
    issuedAt?: string;
    method?: string;
    mode?: string;
};
type PdfDocument = {
    buffer: Buffer;
    fileName: string;
};
export declare function generateClientCollectionReportPdf(filters: ClientReportFiltersDto): Promise<PdfDocument>;
export declare function generateCashReportPdf(filters: CashReportFilters): Promise<PdfDocument>;
export declare function generatePaymentReceiptPdf(input: {
    loanId: string;
    paymentId: string;
    method?: string | undefined;
}): Promise<PdfDocument>;
export declare function generateDisbursementReceiptPdf(loanId: string, filters: DisbursementReportFilters): Promise<PdfDocument>;
export {};
//# sourceMappingURL=report.service.d.ts.map