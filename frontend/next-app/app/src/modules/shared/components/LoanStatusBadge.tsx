import type { LoanStatus } from "@/app/src/modules/client/types/client.types";

const loanStatusStyles: Record<LoanStatus, string> = {
  ACTIVE:
    "border border-[#d8e3f2] bg-[#f2f6fb] text-[#42648b] dark:border-[#234f84] dark:bg-[#0f2742] dark:text-[#7bb0ff]",
  LATE:
    "border border-[#f0ddd3] bg-[#fcf5f1] text-[#b46036] dark:border-[#6c2c2c] dark:bg-[#33181a] dark:text-[#ff8a8a]",
  PAID:
    "border border-[#dbe8d3] bg-[#f2f7ef] text-[#547848] dark:border-[#345a2e] dark:bg-[#162917] dark:text-[#8fe06f]",
};

const loanStatusLabels: Record<LoanStatus, string> = {
  ACTIVE: "Activo",
  LATE: "En Mora",
  PAID: "Liquidado",
};

export default function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${loanStatusStyles[status]}`}
    >
      {loanStatusLabels[status]}
    </span>
  );
}
