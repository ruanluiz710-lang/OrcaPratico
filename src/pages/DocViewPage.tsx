import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { deleteDoc, getDoc, setStatus, useStore } from "../lib/store";
import { brl, formatDate, subtotal, total } from "../lib/format";
import { downloadPdf, sharePdf } from "../lib/pdf";
import { Card, btnDanger, btnPrimary, btnSecondary } from "../components/ui";
import type { Status } from "../lib/types";

const STATUSES: { value: Status; label: string }[] = [
  { value: "aberto", label: "Aberto" },
  { value: "aprovado", label: "Aprovado" },
  { value: "recusado", label: "Recusado" },
];

export default function DocViewPage() {
  const { id } = useParams();
  useStore(); // re-renderiza quando o status muda
  const nav = useNavigate();
  const doc = getDoc(id);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!doc) return <Navigate to="/historico" replace />;
  const isOrc = doc.kind === "orcamento";
  const back = `/historico?aba=${isOrc ? "orcamentos" : "recibos"}`;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr("");
    try {
      await fn();
    } catch {
      setErr("Não foi possível gerar o PDF. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link to={back} className="mb-3 inline-block text-sm font-semibold text-emerald-700">
        ← Voltar ao histórico
      </Link>

      <header className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{isOrc ? "Orçamento" : "Recibo"}</p>
        <h1 className="text-2xl font-extrabold">{doc.number}</h1>
        <p className="text-slate-600">
          {doc.customer.name} · {formatDate(doc.date)}
        </p>
      </header>

      <div className="space-y-4">
        <div className="grid gap-2">
          <button className={btnPrimary} disabled={busy} onClick={() => run(() => sharePdf(doc))}>
            {busy ? "Gerando PDF..." : "Compartilhar PDF (WhatsApp, e-mail...)"}
          </button>
          <button className={btnSecondary} disabled={busy} onClick={() => run(() => downloadPdf(doc))}>
            Baixar PDF
          </button>
          {err && (
            <p role="alert" className="text-sm font-semibold text-red-700">
              {err}
            </p>
          )}
        </div>

        {isOrc && (
          <Card title="Situação do orçamento">
            <div role="radiogroup" className="flex gap-1 rounded-xl bg-slate-200 p-1">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  role="radio"
                  aria-checked={doc.status === s.value}
                  onClick={() => setStatus(doc.id, s.value)}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold ${doc.status === s.value ? "bg-white text-emerald-800 shadow" : "text-slate-600"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <Link to={`/novo/recibo?de=${doc.id}`} className={`${btnSecondary} w-full`}>
              Gerar recibo deste orçamento
            </Link>
          </Card>
        )}

        <Card title="Itens">
          <ul className="divide-y divide-slate-100">
            {doc.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-2">
                <span>
                  {i.description}
                  <span className="block text-xs text-slate-500">
                    {String(i.qty).replace(".", ",")} × {brl(i.unitPrice)}
                  </span>
                </span>
                <strong className="shrink-0">{brl(i.qty * i.unitPrice)}</strong>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-slate-200 pt-3 text-right">
            {doc.discount > 0 && (
              <p className="text-sm text-slate-600">
                Subtotal {brl(subtotal(doc))} · Desconto − {brl(doc.discount)}
              </p>
            )}
            <p className="text-2xl font-extrabold text-emerald-800">{brl(total(doc))}</p>
          </div>
        </Card>

        <Card title="Detalhes">
          <dl className="space-y-1 text-sm">
            {doc.customer.document && <Row k="CPF/CNPJ" v={doc.customer.document} />}
            {doc.customer.phone && <Row k="Telefone" v={doc.customer.phone} />}
            {doc.customer.email && <Row k="E-mail" v={doc.customer.email} />}
            {doc.customer.address && <Row k="Endereço" v={doc.customer.address} />}
            {doc.payment && <Row k="Pagamento" v={doc.payment} />}
            {isOrc && doc.validityDays && <Row k="Validade" v={`${doc.validityDays} dias`} />}
            {doc.notes && <Row k="Observações" v={doc.notes} />}
            <Row k="Assinatura" v={doc.signature ? "Incluída" : "Sem assinatura"} />
          </dl>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Link to={`/editar/${doc.id}`} className={btnSecondary}>
            Editar
          </Link>
          <Link to={`/novo/${doc.kind}?copiar=${doc.id}`} className={btnSecondary}>
            Duplicar
          </Link>
        </div>
        <button
          className={`${btnDanger} w-full`}
          onClick={() => {
            if (confirm(`Excluir ${doc.number}? Isso não pode ser desfeito.`)) {
              deleteDoc(doc.id);
              nav(back, { replace: true });
            }
          }}
        >
          Excluir
        </button>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-slate-500">{k}</dt>
      <dd className="min-w-0 break-words text-slate-900">{v}</dd>
    </div>
  );
}
