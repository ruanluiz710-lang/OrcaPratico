import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "../lib/store";
import DocCard from "../components/DocCard";
import { PageTitle, inputCls } from "../components/ui";
import type { Kind } from "../lib/types";

export default function HistoryPage() {
  const { docs } = useStore();
  const [params, setParams] = useSearchParams();
  const kind: Kind = params.get("aba") === "recibos" ? "recibo" : "orcamento";
  const [q, setQ] = useState("");

  const ofKind = docs.filter((d) => d.kind === kind);
  const term = q.trim().toLowerCase();
  const list = term
    ? ofKind.filter((d) => d.customer.name.toLowerCase().includes(term) || d.number.toLowerCase().includes(term))
    : ofKind;
  const count = (k: Kind) => docs.filter((d) => d.kind === k).length;

  const tab = (k: Kind, label: string, aba: string) => (
    <button
      role="tab"
      aria-selected={kind === k}
      onClick={() => setParams({ aba }, { replace: true })}
      className={`flex-1 rounded-lg py-2.5 text-sm font-bold ${kind === k ? "bg-white text-emerald-800 shadow" : "text-slate-600"}`}
    >
      {label} ({count(k)})
    </button>
  );

  return (
    <>
      <PageTitle sub="Tudo que você já emitiu.">Histórico</PageTitle>
      <div role="tablist" className="mb-3 flex gap-1 rounded-xl bg-slate-200 p-1">
        {tab("orcamento", "Orçamentos", "orcamentos")}
        {tab("recibo", "Recibos", "recibos")}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por cliente ou número"
        className={`${inputCls} mb-3`}
        type="search"
      />
      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          {ofKind.length === 0 ? `Nenhum ${kind === "orcamento" ? "orçamento" : "recibo"} ainda.` : "Nada encontrado."}
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((d) => (
            <DocCard key={d.id} doc={d} />
          ))}
        </div>
      )}
    </>
  );
}
