import { Link } from "react-router-dom";
import type { Doc } from "../lib/types";
import { brl, formatDate, total } from "../lib/format";

const statusStyle = {
  aberto: "bg-amber-100 text-amber-900",
  aprovado: "bg-emerald-100 text-emerald-900",
  recusado: "bg-red-100 text-red-900",
} as const;

export default function DocCard({ doc }: { doc: Doc }) {
  return (
    <Link
      to={`/doc/${doc.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50"
    >
      <div className="min-w-0">
        <p className="truncate font-bold text-slate-900">{doc.customer.name}</p>
        <p className="text-sm text-slate-600">
          {doc.number} · {formatDate(doc.date)}
        </p>
        {doc.kind === "orcamento" && (
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusStyle[doc.status]}`}>
            {doc.status}
          </span>
        )}
      </div>
      <p className="shrink-0 text-lg font-extrabold text-emerald-800">{brl(total(doc))}</p>
    </Link>
  );
}
