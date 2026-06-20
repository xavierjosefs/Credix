import chromium from "@sparticuz/chromium";
import { CashMovementType, LoanStatus, LoanType, PaymentMethod } from "@prisma/client";
import prisma from "../prisma/prisma.js";
import { getCashMovements } from "./cash.service.js";
import { getClientCollectionReport } from "./client.service.js";
import { enrichLoan, loanRelationsInclude, roundMoney } from "./loan.helpers.js";
import puppeteer, {} from "puppeteer";
import puppeteerCore from "puppeteer-core";
let browserPromise = null;
export async function generateClientCollectionReportPdf(filters) {
    const report = await getClientCollectionReport(filters);
    const html = buildHtmlDocument({
        title: "Reporte tabular de clientes",
        body: `
      ${renderReportHeader({
            title: "REPORTE TABULAR DE CLIENTES",
            subtitle: `Frecuencia: ${formatFrequency(report.filters.frequency)} · Metodo: ${formatCollectionMethod(report.filters.collectionMethod)} · Institucion: ${formatInstitution(report.filters.institution)}`,
        })}
      ${renderSummaryGrid([
            { label: "Clientes", value: String(report.summary.clientsCount) },
            {
                label: "Capital total adeudado",
                value: formatCurrency(report.summary.totalCapitalPending),
            },
            {
                label: "Interes a pagar",
                value: formatCurrency(report.summary.totalInterestPending),
            },
        ])}
      <section class="table-card">
        <table class="compact-report-table">
          <thead>
            <tr>
              <th>Numero de cliente</th>
              <th>Nombre del cliente</th>
              <th class="text-center">Prestamos</th>
              <th class="text-center">En mora</th>
              <th>Proximo vencimiento</th>
              <th class="text-right">Capital total adeudado</th>
              <th class="text-right">Interes a pagar</th>
              <th class="text-right">Total adeudado</th>
              <th class="blank-col-wide"></th>
              <th class="blank-col-wide"></th>
            </tr>
          </thead>
          <tbody>
            ${report.data.length === 0
            ? `<tr><td colspan="7" class="empty-cell">No hay clientes que coincidan con los filtros seleccionados.</td></tr>`
            : report.data
                .map((row) => `
                        <tr>
                          <td>${escapeHtml(row.clientNumber)}</td>
                          <td>
                            <div class="cell-stack">
                              <strong>${escapeHtml(row.clientName)}</strong>
                              <span>${escapeHtml(formatInstitution(row.institution))} · ${escapeHtml(formatCollectionMethod(row.collectionMethod))}</span>
                            </div>
                          </td>
                          <td class="text-center amount-strong">${row.totalLoansCount}</td>
                          <td class="text-center ${row.lateLoansCount > 0 ? "amount-danger" : "amount-muted"}">${row.lateLoansCount}</td>
                          <td>${row.nextDueDate ? escapeHtml(formatShortDate(row.nextDueDate)) : "Sin vencimiento"}</td>
                          <td class="text-right amount-strong">${formatCurrency(row.capitalPending)}</td>
                          <td class="text-right amount-warning">${formatCurrency(row.interestPending)}</td>
                          <td class="text-right amount-strong">${formatCurrency(row.totalDue)}</td>
                          <td><div class="blank-note"></div></td>
                          <td><div class="blank-note"></div></td>
                        </tr>
                      `)
                .join("")}
          </tbody>
        </table>
      </section>
      <section class="report-footer-grid">
        <div class="totals-panel">
          ${renderResumeRow("Capital total", formatCurrency(report.summary.totalCapitalPending))}
          ${renderResumeRow("Interes total", formatCurrency(report.summary.totalInterestPending))}
          <div class="grand-total">
            <span>Total general</span>
            <strong>${formatCurrency(report.summary.totalCapitalPending + report.summary.totalInterestPending)}</strong>
          </div>
        </div>
      </section>
      <p class="footnote">
        Documento operativo para seguimiento de cobros. Los espacios finales quedan libres para anotaciones manuales del equipo.
      </p>
    `,
    });
    return {
        buffer: await renderPdfFromHtml(html),
        fileName: `reporte-clientes-${buildSafeDateStamp(new Date())}.pdf`,
    };
}
export async function generateCashReportPdf(filters) {
    const movements = await getCashMovements(filters);
    const adminScopedMovements = filterCashMovementsByAdmin(movements, filters.admin);
    const filteredMovements = filterCashMovementsByQuery(adminScopedMovements, filters.q);
    const summary = filteredMovements.reduce((accumulator, movement) => {
        if (movement.type === "INCOME") {
            accumulator.totalIncome += movement.amount;
        }
        else {
            accumulator.totalExpense += movement.amount;
        }
        return accumulator;
    }, {
        totalIncome: 0,
        totalExpense: 0,
    });
    const totalIncome = roundMoney(summary.totalIncome);
    const totalExpense = roundMoney(summary.totalExpense);
    const netBalance = roundMoney(totalIncome - totalExpense);
    const html = buildHtmlDocument({
        title: "Reporte de caja",
        orientation: "landscape",
        body: `
      ${renderReportHeader({
            title: "REPORTE DE CAJA",
            subtitle: `${escapeHtml(formatCashRange(filters))} · Administrador: ${escapeHtml(formatCashAdminLabel(filters.admin, adminScopedMovements))}${filters.q?.trim() ? ` · Busqueda: ${escapeHtml(filters.q.trim())}` : ""}`,
        })}
      ${renderSummaryGrid([
            { label: "Total ingresos", value: formatCurrency(totalIncome) },
            { label: "Total egresos", value: formatCurrency(totalExpense) },
            { label: "Balance neto", value: formatCurrency(netBalance), dark: true },
        ])}
      <section class="table-card">
        <table>
          <thead>
            <tr>
              <th>Ref ID</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Metodo</th>
              <th>Administrador</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th class="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMovements.length === 0
            ? `<tr><td colspan="8" class="empty-cell">No hay movimientos registrados para los filtros seleccionados.</td></tr>`
            : filteredMovements
                .map((movement) => {
                const amountLabel = movement.type === "INCOME"
                    ? formatCurrency(movement.amount)
                    : `- ${formatCurrency(movement.amount)}`;
                return `
                        <tr>
                          <td>${escapeHtml(formatCashRefId(movement.id))}</td>
                          <td>${escapeHtml(movement.client?.name ?? "Sin cliente")}</td>
                          <td>${escapeHtml(formatCashMovementType(movement))}</td>
                          <td>${escapeHtml(formatPaymentMethod(movement.method))}</td>
                          <td>${escapeHtml(movement.admin?.name ?? "Sin registro")}</td>
                          <td>${escapeHtml(formatShortDate(movement.createdAt))}</td>
                          <td>${escapeHtml(formatTime(movement.createdAt))}</td>
                          <td class="text-right amount-strong">${amountLabel}</td>
                        </tr>
                      `;
            })
                .join("")}
          </tbody>
        </table>
      </section>
      <section class="report-footer-grid">
        <div class="totals-panel">
          ${renderResumeRow("Total ingresos", formatCurrency(totalIncome))}
          ${renderResumeRow("Total egresos", formatCurrency(totalExpense))}
          <div class="grand-total ${netBalance < 0 ? "danger-total" : ""}">
            <span>Balance neto</span>
            <strong>${netBalance < 0 ? `- ${formatCurrency(Math.abs(netBalance))}` : formatCurrency(netBalance)}</strong>
          </div>
        </div>
      </section>
      <p class="footnote">
        Reporte consolidado de movimientos de caja registrados desde los modulos de prestamos y pagos.
      </p>
    `,
    });
    return {
        buffer: await renderPdfFromHtml(html, "landscape"),
        fileName: `reporte-caja-${buildSafeDateStamp(new Date())}.pdf`,
    };
}
export async function generatePaymentReceiptPdf(input) {
    const payment = await prisma.payment.findUnique({
        where: { id: input.paymentId },
        include: {
            loan: {
                include: loanRelationsInclude,
            },
        },
    });
    if (!payment || payment.loanId !== input.loanId) {
        throw new Error("Payment not found");
    }
    const loan = enrichLoan(payment.loan);
    const paymentMethod = await resolvePaymentMethodForReceipt({
        loanId: input.loanId,
        amount: payment.amount,
        issuedAt: payment.paymentDate,
        ...(input.method ? { fallbackMethod: input.method } : {}),
    });
    const receiptCode = `REC-${payment.id.slice(0, 6).toUpperCase()}-${payment.paymentDate.getFullYear()}`;
    const previousBalance = roundMoney(payment.remainingBalance + payment.principalPaid);
    const conceptRows = [
        payment.principalPaid > 0
            ? {
                label: "Abono a capital",
                amount: payment.principalPaid,
            }
            : null,
        {
            label: "Intereses ordinarios",
            amount: payment.interestPaid,
        },
    ].filter((row) => Boolean(row));
    const html = buildHtmlDocument({
        title: "Comprobante de pago",
        body: renderReceiptLayout({
            title: "COMPROBANTE DE PAGO",
            code: receiptCode,
            issuedAt: payment.paymentDate,
            methodLabel: formatPaymentMethod(paymentMethod),
            clientName: loan.client.name,
            clientCedula: loan.client.cedula,
            clientAddress: loan.client.address,
            clientEmail: loan.client.email,
            loanReference: formatLoanCode(loan.id),
            loanType: formatLoanLabel(loan.type, loan.frequency),
            loanStatus: formatLoanStatus(payment.remainingBalance === 0 ? LoanStatus.PAID : loan.status),
            eventLabel: "Fecha de pago",
            conceptLabel: "Concepto de pago",
            concepts: conceptRows,
            previousBalance,
            newBalance: payment.remainingBalance,
            totalLabel: "TOTAL PAGADO",
            totalValue: payment.amount,
            footerText: "Este documento es un comprobante oficial emitido por Credix. Conservar este recibo para cualquier consulta posterior sobre el pago realizado.",
        }),
    });
    return {
        buffer: await renderPdfFromHtml(html),
        fileName: `recibo-pago-${payment.id.slice(0, 8)}.pdf`,
    };
}
export async function generateDisbursementReceiptPdf(loanId, filters) {
    const loanRecord = await prisma.loan.findUnique({
        where: { id: loanId },
        include: loanRelationsInclude,
    });
    if (!loanRecord) {
        throw new Error("Loan not found");
    }
    const loan = enrichLoan(loanRecord);
    const expenseMovements = await prisma.cashMovement.findMany({
        where: {
            loanId,
            type: CashMovementType.EXPENSE,
        },
        orderBy: {
            createdAt: "asc",
        },
    });
    const movement = resolveDisbursementMovement(expenseMovements, filters);
    const issuedAt = movement?.createdAt ?? parseOptionalDate(filters.issuedAt) ?? loan.startDate;
    const amount = movement?.amount ?? safeParseNumber(filters.amount) ?? loan.principalAmount;
    const method = formatPaymentMethod(movement?.method ?? normalizePaymentMethod(filters.method));
    const mode = filters.mode === "TOPUP" ||
        movement?.description === "Monto agregado a prestamo existente"
        ? "TOPUP"
        : "NEW";
    const laterTopUpAmount = expenseMovements
        .filter((cashMovement) => cashMovement.createdAt > issuedAt &&
        cashMovement.description === "Monto agregado a prestamo existente")
        .reduce((sum, cashMovement) => sum + cashMovement.amount, 0);
    const principalRecoveredAfter = loan.payments
        .filter((payment) => new Date(payment.paymentDate) > issuedAt)
        .reduce((sum, payment) => sum + payment.principalPaid, 0);
    const balanceAfterOperation = roundMoney(loan.remainingBalance + principalRecoveredAfter - laterTopUpAmount);
    const previousBalance = mode === "TOPUP" ? roundMoney(Math.max(balanceAfterOperation - amount, 0)) : 0;
    const receiptCode = `DES-${loan.id.slice(0, 6).toUpperCase()}-${issuedAt.getFullYear()}`;
    const html = buildHtmlDocument({
        title: "Comprobante de desembolso",
        body: renderReceiptLayout({
            title: "COMPROBANTE DE DESEMBOLSO",
            code: receiptCode,
            issuedAt,
            methodLabel: method,
            clientName: loan.client.name,
            clientCedula: loan.client.cedula,
            clientAddress: loan.client.address,
            clientEmail: loan.client.email,
            loanReference: formatLoanCode(loan.id),
            loanType: formatLoanLabel(loan.type, loan.frequency),
            loanStatus: formatLoanStatus(loan.status),
            eventLabel: "Fecha de registro",
            conceptLabel: "Concepto",
            operationLabel: "Operacion",
            operationValue: mode === "TOPUP" ? "Aumento de saldo" : "Nuevo desembolso",
            concepts: [
                {
                    label: mode === "TOPUP" ? "Monto agregado al prestamo" : "Monto desembolsado",
                    amount,
                },
            ],
            previousBalance,
            newBalance: balanceAfterOperation,
            totalLabel: "TOTAL DESEMBOLSADO",
            totalValue: amount,
            footerText: "Este documento respalda la salida de fondos registrada para este prestamo. Conservar este comprobante para cualquier consulta posterior.",
        }),
    });
    return {
        buffer: await renderPdfFromHtml(html),
        fileName: `desembolso-${loan.id.slice(0, 8)}.pdf`,
    };
}
async function renderPdfFromHtml(html, orientation = "portrait") {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
        await page.setContent(html, {
            waitUntil: "load",
        });
        await page.emulateMediaType("screen");
        return Buffer.from(await page.pdf({
            format: "A4",
            landscape: orientation === "landscape",
            printBackground: true,
            margin: {
                top: "12mm",
                right: "12mm",
                bottom: "12mm",
                left: "12mm",
            },
        }));
    }
    finally {
        await page.close();
    }
}
async function getBrowser() {
    if (!browserPromise) {
        browserPromise = launchBrowser();
    }
    return browserPromise;
}
async function launchBrowser() {
    const isVercel = Boolean(process.env.VERCEL || process.env.AWS_REGION);
    if (isVercel) {
        return puppeteerCore.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            defaultViewport: {
                width: 1280,
                height: 720,
                deviceScaleFactor: 1,
            },
            headless: true,
        });
    }
    return puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
}
function buildHtmlDocument({ title, body, orientation = "portrait", }) {
    return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page { size: A4 ${orientation}; margin: 10mm; }
          * { box-sizing: border-box; }
          body { margin: 0; background: #f4f7fb; color: #19324a; font-family: "Times New Roman", Times, serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { background: #ffffff; border-radius: 24px; padding: 22px 22px; box-shadow: 0 18px 50px rgba(29, 46, 77, 0.10); }
          .report-header { border-bottom: 1px solid #e6edf4; padding-bottom: 14px; margin-bottom: 16px; }
          .report-title { margin: 0; font-size: 18px; line-height: 1.15; color: #0f2b47; font-weight: 800; }
          .report-subtitle { margin: 8px 0 0; font-size: 10px; line-height: 1.45; color: #4f6680; text-transform: uppercase; letter-spacing: 0.15em; }
          .report-date { margin: 8px 0 0; font-size: 11px; color: #70839a; }
          .summary-grid { display: grid; gap: 10px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-bottom: 16px; }
          .summary-card { border: 1px solid #d9e3ee; background: #fbfcfe; border-radius: 16px; padding: 12px 14px; }
          .summary-card.dark { background: linear-gradient(180deg, #173755 0%, #18354d 100%); border-color: #173755; color: #ffffff; }
          .summary-card label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #58708a; }
          .summary-card.dark label { color: #bed1e6; }
          .summary-card strong { display: block; margin-top: 6px; font-size: 16px; line-height: 1.1; font-weight: 800; color: #0f2b47; white-space: nowrap; }
          .summary-card.dark strong { color: #ffffff; }
          .table-card { overflow: hidden; border: 1px solid #e2e9f1; border-radius: 20px; }
          table { width: 100%; border-collapse: collapse; }
          thead { background: #f5f7fb; }
          th { padding: 8px 8px; text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #51667f; }
          td { padding: 8px 8px; border-top: 1px solid #edf1f6; font-size: 12px; color: #24384f; vertical-align: middle; }
          .text-right { text-align: right; }
          .amount-strong { font-weight: 800; color: #203752; white-space: nowrap; }
          .amount-warning { font-weight: 800; color: #b07300; white-space: nowrap; }
          .amount-danger { font-weight: 800; color: #b42318; white-space: nowrap; }
          .amount-muted { font-weight: 700; color: #6b7f95; white-space: nowrap; }
          .text-center { text-align: center; }
          .cell-stack strong { display: block; font-size: 12px; color: #203752; }
          .cell-stack span { display: block; margin-top: 2px; color: #7a8ea4; font-size: 10px; line-height: 1.2; }
          .blank-col { width: 24px; }
          .blank-col-wide { width: 28px; }
          .blank-note { height: 24px; border-radius: 8px; border: 1px dashed #d4deea; background: #fcfdff; }
          .report-footer-grid { display: flex; justify-content: flex-end; margin-top: 16px; }
          .totals-panel { width: 100%; max-width: 360px; }
          .resume-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; font-size: 12px; }
          .resume-row span { font-weight: 700; color: #536981; text-transform: uppercase; letter-spacing: 0.1em; }
          .resume-row strong { white-space: nowrap; font-size: 13px; color: #324965; }
          .grand-total { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-radius: 16px; background: #14314d; color: #ffffff; padding: 14px 16px; box-shadow: 0 16px 28px rgba(20, 49, 77, 0.18); }
          .grand-total.danger-total { background: #9b1c1c; }
          .grand-total span { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; }
          .grand-total strong { white-space: nowrap; font-size: 16px; font-weight: 800; }
          .footnote { margin: 16px 0 0; padding-top: 12px; border-top: 1px solid #e6edf4; text-align: center; font-size: 9px; line-height: 1.5; color: #6c8099; }
          .empty-cell { padding: 24px 10px; text-align: center; color: #7b8da2; }
          .compact-report-table th:nth-child(1) { width: 13%; }
          .compact-report-table th:nth-child(2) { width: 29%; }
          .compact-report-table th:nth-child(3) { width: 18%; }
          .compact-report-table th:nth-child(4) { width: 16%; }
          .compact-report-table th:nth-child(5) { width: 16%; }
          .compact-report-table th:nth-child(6) { width: 4%; }
          .compact-report-table th:nth-child(7) { width: 4%; }
          .compact-report-table th:nth-child(8) { width: 12%; }
          .compact-report-table th:nth-child(9) { width: 2%; }
          .compact-report-table th:nth-child(10) { width: 2%; }
          .compact-report-table td { line-height: 1.25; }
          .receipt-shell { border-radius: 24px; padding: 24px 26px; border: 1px solid #e2e8f0; }
          .receipt-top { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
          .brand-box { max-width: 320px; }
          .brand-mark { width: 64px; height: 64px; border-radius: 10px; border: 1px solid #d5dfeb; display: flex; align-items: center; justify-content: center; background: #ffffff; color: #14314d; font-weight: 800; font-size: 12px; margin-bottom: 14px; }
          .brand-title { margin: 0; font-size: 13px; font-weight: 800; color: #102844; }
          .brand-subtitle { margin: 6px 0 0; font-size: 12px; line-height: 1.5; color: #60748d; }
          .receipt-heading { text-align: right; }
          .receipt-heading h1 { margin: 0; font-size: 22px; color: #0f2b47; }
          .receipt-code { display: block; margin-top: 10px; color: #178d2f; font-size: 18px; font-weight: 800; }
          .receipt-meta { margin-top: 8px; display: grid; gap: 4px; justify-items: end; font-size: 12px; color: #4f6680; text-transform: uppercase; letter-spacing: 0.12em; }
          .two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
          .section-label { margin: 0 0 10px; padding-bottom: 10px; border-bottom: 1px solid #e6edf4; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em; color: #102844; }
          .party-name { margin: 0; font-size: 14px; font-weight: 800; color: #102844; }
          .party-lines { margin-top: 8px; display: grid; gap: 5px; font-size: 12px; color: #60748d; }
          .details-grid { display: grid; grid-template-columns: auto 1fr; gap: 8px 18px; font-size: 12px; color: #4f6680; }
          .details-grid strong { text-align: right; color: #102844; }
          .receipt-table { margin-top: 18px; }
          .receipt-summary { margin-top: 18px; display: flex; justify-content: flex-end; }
          .receipt-summary-box { width: 100%; max-width: 340px; }
          .receipt-total-box { margin-top: 14px; display: flex; align-items: center; justify-content: space-between; border-radius: 18px; background: #178d2f; color: #ffffff; padding: 18px 20px; box-shadow: 0 14px 26px rgba(23, 141, 47, 0.20); }
          .receipt-total-box span { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; }
          .receipt-total-box strong { white-space: nowrap; font-size: 18px; font-weight: 800; }
        </style>
      </head>
      <body><main class="page">${body}</main></body>
    </html>
  `;
}
function renderReportHeader({ title, subtitle }) {
    return `<header class="report-header"><h1 class="report-title">${escapeHtml(title)}</h1><p class="report-subtitle">${escapeHtml(subtitle)}</p><p class="report-date">Generado el ${escapeHtml(formatFullDate(new Date()))}</p></header>`;
}
function renderSummaryGrid(cards) {
    return `<section class="summary-grid">${cards
        .map((card) => `<article class="summary-card ${card.dark ? "dark" : ""}"><label>${escapeHtml(card.label)}</label><strong>${escapeHtml(card.value)}</strong></article>`)
        .join("")}</section>`;
}
function renderResumeRow(label, value) {
    return `<div class="resume-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}
function renderReceiptLayout(input) {
    return `
    <section class="receipt-shell">
      <div class="receipt-top">
        <div class="brand-box">
          <div class="brand-mark">CRDX</div>
          <p class="brand-title">INVERSIONES FERNANDEZ S.R.L.</p>
          <p class="brand-subtitle">Sistema de gestion de prestamos<br />Santo Domingo, Rep. Dom.</p>
        </div>
        <div class="receipt-heading">
          <h1>${escapeHtml(input.title)}</h1>
          <span class="receipt-code">${escapeHtml(input.code)}</span>
          <div class="receipt-meta">
            <span>Fecha: ${escapeHtml(formatShortDateTime(input.issuedAt))}</span>
            <span>Metodo: ${escapeHtml(input.methodLabel)}</span>
          </div>
        </div>
      </div>
      <div class="two-columns">
        <section>
          <p class="section-label">Informacion del cliente</p>
          <p class="party-name">${escapeHtml(input.clientName)}</p>
          <div class="party-lines">
            <span>ID: ${escapeHtml(input.clientCedula)}</span>
            <span>${escapeHtml(input.clientAddress)}</span>
            <span>${escapeHtml(input.clientEmail)}</span>
          </div>
        </section>
        <section>
          <p class="section-label">Detalles del prestamo</p>
          <div class="details-grid">
            <span>Referencia:</span><strong>${escapeHtml(input.loanReference)}</strong>
            ${input.operationLabel && input.operationValue ? `<span>${escapeHtml(input.operationLabel)}:</span><strong>${escapeHtml(input.operationValue)}</strong>` : ""}
            <span>Tipo:</span><strong>${escapeHtml(input.loanType)}</strong>
            <span>Estado:</span><strong>${escapeHtml(input.loanStatus)}</strong>
            <span>${escapeHtml(input.eventLabel)}:</span><strong>${escapeHtml(formatShortDateTime(input.issuedAt))}</strong>
          </div>
        </section>
      </div>
      <section class="table-card receipt-table">
        <table>
          <thead>
            <tr>
              <th>${escapeHtml(input.conceptLabel)}</th>
              <th class="text-right">Monto parcial</th>
              <th class="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${input.concepts
        .map((concept) => `
                  <tr>
                    <td>${escapeHtml(concept.label)}</td>
                    <td class="text-right">${formatCurrency(concept.amount)}</td>
                    <td class="text-right amount-strong">${formatCurrency(concept.amount)}</td>
                  </tr>
                `)
        .join("")}
          </tbody>
        </table>
      </section>
      <section class="receipt-summary">
        <div class="receipt-summary-box">
          ${renderResumeRow("Saldo anterior", formatCurrency(input.previousBalance))}
          ${renderResumeRow("Nuevo saldo", formatCurrency(input.newBalance))}
          <div class="receipt-total-box">
            <span>${escapeHtml(input.totalLabel)}</span>
            <strong>${formatCurrency(input.totalValue)}</strong>
          </div>
        </div>
      </section>
      <p class="footnote">${escapeHtml(input.footerText)}</p>
    </section>
  `;
}
function filterCashMovementsByAdmin(movements, adminFilter) {
    if (!adminFilter || adminFilter === "ALL") {
        return movements;
    }
    if (adminFilter === "UNASSIGNED") {
        return movements.filter((movement) => !movement.admin?.id);
    }
    return movements.filter((movement) => movement.admin?.id === adminFilter);
}
function filterCashMovementsByQuery(movements, searchQuery) {
    const trimmedQuery = searchQuery?.trim().toLowerCase();
    if (!trimmedQuery) {
        return movements;
    }
    return movements.filter((movement) => {
        const refId = formatCashRefId(movement.id).toLowerCase();
        const customerName = movement.client?.name.toLowerCase() ?? "";
        const loanCode = movement.loanId ? formatLoanCode(movement.loanId).toLowerCase() : "";
        return (refId.includes(trimmedQuery) ||
            customerName.includes(trimmedQuery) ||
            loanCode.includes(trimmedQuery));
    });
}
async function resolvePaymentMethodForReceipt(input) {
    const normalizedFallbackMethod = normalizePaymentMethod(input.fallbackMethod);
    if (normalizedFallbackMethod) {
        return normalizedFallbackMethod;
    }
    const startOfDay = new Date(input.issuedAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const movement = await prisma.cashMovement.findFirst({
        where: {
            loanId: input.loanId,
            type: CashMovementType.INCOME,
            amount: roundMoney(input.amount),
            createdAt: {
                gte: startOfDay,
                lt: endOfDay,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return movement?.method ?? PaymentMethod.CASH;
}
function resolveDisbursementMovement(expenseMovements, filters) {
    if (filters.movementId) {
        return expenseMovements.find((movement) => movement.id === filters.movementId) ?? null;
    }
    const parsedIssuedAt = parseOptionalDate(filters.issuedAt);
    const parsedAmount = safeParseNumber(filters.amount);
    if (parsedIssuedAt) {
        const targetTimestamp = parsedIssuedAt.getTime();
        const closestByDate = expenseMovements
            .filter((movement) => parsedAmount === null ? true : roundMoney(movement.amount) === roundMoney(parsedAmount))
            .sort((firstMovement, secondMovement) => Math.abs(firstMovement.createdAt.getTime() - targetTimestamp) -
            Math.abs(secondMovement.createdAt.getTime() - targetTimestamp))[0];
        if (closestByDate) {
            return closestByDate;
        }
    }
    if (parsedAmount !== null) {
        const latestByAmount = [...expenseMovements]
            .reverse()
            .find((movement) => roundMoney(movement.amount) === roundMoney(parsedAmount));
        if (latestByAmount) {
            return latestByAmount;
        }
    }
    return expenseMovements.at(-1) ?? null;
}
function formatCashRange(filters) {
    if (filters.day) {
        return `Dia: ${formatInputDay(filters.day)}`;
    }
    if (filters.month) {
        return `Mes: ${formatInputMonth(filters.month)}`;
    }
    if (filters.year) {
        return `Año: ${filters.year}`;
    }
    return "Todos los movimientos";
}
function formatCashAdminLabel(adminFilter, movements) {
    if (!adminFilter || adminFilter === "ALL") {
        return "Todos";
    }
    if (adminFilter === "UNASSIGNED") {
        return "Sin registro";
    }
    return movements.find((movement) => movement.admin?.id === adminFilter)?.admin?.name ?? "No encontrado";
}
function formatLoanCode(loanId) {
    return `#PR-${loanId.slice(0, 4).toUpperCase()}`;
}
function formatCashRefId(id) {
    return `TRX-${id.replace(/^(legacy-payment-|legacy-loan-)/, "").slice(0, 4).toUpperCase()}`;
}
function formatCashMovementType(movement) {
    if (movement.type === "INCOME") {
        return "Pago";
    }
    return movement.description === "Monto agregado a prestamo existente"
        ? "Aumento de saldo"
        : "Nuevo prestamo";
}
function formatPaymentMethod(method) {
    if (method === PaymentMethod.TRANSFER) {
        return "Transferencia";
    }
    if (method === "UNKNOWN") {
        return "Sin registro";
    }
    return "Efectivo";
}
function normalizePaymentMethod(method) {
    if (method === PaymentMethod.CASH || method === PaymentMethod.TRANSFER) {
        return method;
    }
    return null;
}
function formatLoanLabel(type, frequency) {
    if (type === LoanType.INSTALLMENT) {
        return frequency === "MONTHLY" ? "Prestamo por cuotas mensual" : "Prestamo por cuotas quincenal";
    }
    return frequency === "MONTHLY" ? "Prestamo mensual" : "Prestamo quincenal";
}
function formatLoanStatus(status) {
    switch (status) {
        case LoanStatus.PAID:
            return "Liquidado";
        case LoanStatus.LATE:
            return "En mora";
        default:
            return "Al dia";
    }
}
function formatFrequency(value) {
    if (value === "MONTHLY") {
        return "Mensual";
    }
    if (value === "BIWEEKLY") {
        return "Quincenal";
    }
    return "Todos";
}
function formatCollectionMethod(value) {
    switch (value) {
        case "CAJERO":
            return "Cajero";
        case "DEPOSITO":
            return "Deposito";
        case "EFECTIVO":
            return "Efectivo";
        case "TRANSFERENCIA":
            return "Transferencia";
        default:
            return "No registrado";
    }
}
function formatInstitution(value) {
    switch (value) {
        case "POLICIA":
            return "Policia";
        case "PENSIONADO":
            return "Pensionado";
        case "EDUCACION":
            return "Profesores";
        case "MEDICO":
            return "Medico";
        case "GUARDIA":
            return "Guardia";
        case "PARTICULAR":
            return "Particular";
        default:
            return "No registrado";
    }
}
function parseOptionalDate(value) {
    if (!value) {
        return null;
    }
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}
function safeParseNumber(value) {
    if (!value) {
        return null;
    }
    const parsedValue = Number.parseFloat(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
}
function formatCurrency(value) {
    return new Intl.NumberFormat("es-DO", {
        style: "currency",
        currency: "DOP",
        minimumFractionDigits: 2,
    }).format(roundMoney(value));
}
function formatShortDate(value) {
    return new Intl.DateTimeFormat("es-DO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}
function formatShortDateTime(value) {
    return new Intl.DateTimeFormat("es-DO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}
function formatFullDate(value) {
    return new Intl.DateTimeFormat("es-DO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(value);
}
function formatInputDay(value) {
    return formatShortDate(new Date(`${value}T00:00:00`));
}
function formatInputMonth(value) {
    const [year, month] = value.split("-");
    const parsedDate = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat("es-DO", {
        month: "long",
        year: "numeric",
    }).format(parsedDate);
}
function formatTime(value) {
    return new Intl.DateTimeFormat("es-DO", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}
function buildSafeDateStamp(date) {
    return date.toISOString().slice(0, 10);
}
function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
//# sourceMappingURL=report.service.js.map