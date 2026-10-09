import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getDoc, newId, saveDoc, useStore } from "../lib/store";
import { emptyCustomer, type Customer, type Doc, type Kind } from "../lib/types";
import { brl, toNumber, today } from "../lib/format";
import { Card, Field, PageTitle, TextArea, TextField, btnPrimary, btnSecondary, inputCls } from "../components/ui";

interface ItemForm {
  id: string;
  description: string;
  qty: string;
  unitPrice: string;
}

const blankItem = (): ItemForm => ({ id: newId(), description: "", qty: "1", unitPrice: "" });

const PAYMENTS = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito", "Transferência", "Boleto", "50% entrada + 50% na entrega"];

export default function DocFormPage() {
  const { kind: kindParam, id: editId } = useParams();
  const [query] = useSearchParams();
  const nav = useNavigate();
  const { profile, docs } = useStore();

  const editing = getDoc(editId);
  const source = getDoc(query.get("de") ?? query.get("copiar") ?? undefined);
  const converting = Boolean(query.get("de"));

  const kind: Kind | null = editing ? editing.kind : kindParam === "orcamento" || kindParam === "recibo" ? kindParam : null;
  const base = editing ?? source;

  const [customer, setCustomer] = useState<Customer>(base?.customer ?? emptyCustomer);
  const [items, setItems] = useState<ItemForm[]>(
    base ? base.items.map((i) => ({ id: newId(), description: i.description, qty: String(i.qty), unitPrice: String(i.unitPrice) })) : [blankItem()],
  );
  const [discount, setDiscount] = useState(base && base.discount ? String(base.discount) : "");
  const [validity, setValidity] = useState(String(base?.validityDays ?? 15));
  const [payment, setPayment] = useState(base?.payment ?? "");
  const [notes, setNotes] = useState(base?.notes ?? "");
  const [date, setDate] = useState(editing ? editing.date : today());
  const [useSig, setUseSig] = useState(editing ? Boolean(editing.signature) : Boolean(profile.signature));
  const [error, setError] = useState("");

  const customerNames = useMemo(() => [...new Set(docs.map((d) => d.customer.name))].sort(), [docs]);

  if (!kind) return <Navigate to="/" replace />;
  const isOrc = kind === "orcamento";
  const outKind: Kind = converting ? "recibo" : kind;
  const outIsOrc = outKind === "orcamento";

  const parsed = items.map((i) => ({ ...i, q: toNumber(i.qty), p: toNumber(i.unitPrice) }));
  const sub = parsed.reduce((s, i) => s + i.q * i.p, 0);
  const disc = Math.min(toNumber(discount), sub);
  const total = Math.max(0, sub - disc);

  const setC = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement>) => setCustomer({ ...customer, [k]: e.target.value });

  const onName = (name: string) => {
    const prev = docs.find((d) => d.customer.name.toLowerCase() === name.trim().toLowerCase())?.customer;
    setCustomer(prev ? { ...prev, ...Object.fromEntries(Object.entries(customer).filter(([k, v]) => k !== "name" && v)), name } : { ...customer, name });
  };

  const patchItem = (id: string, patch: Partial<ItemForm>) => setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = parsed.filter((i) => i.description.trim() && i.q > 0 && i.p > 0);
    if (!customer.name.trim()) return setError("Informe o nome do cliente.");
    if (valid.length === 0) return setError("Adicione pelo menos um item com descrição e valor.");
    if (parsed.some((i) => (i.description.trim() || i.unitPrice) && !(i.description.trim() && i.q > 0 && i.p > 0)))
      return setError("Há um item incompleto. Preencha descrição, quantidade e valor, ou remova a linha.");

    const doc: Doc = {
      id: editing?.id ?? newId(),
      kind: outKind,
      number: editing?.number ?? "",
      date,
      customer: { ...customer, name: customer.name.trim() },
      items: valid.map((i) => ({ id: i.id, description: i.description.trim(), qty: i.q, unitPrice: i.p })),
      discount: disc,
      validityDays: outIsOrc ? Math.max(1, Math.round(toNumber(validity)) || 15) : undefined,
      payment: payment.trim(),
      notes: notes.trim(),
      status: editing?.status ?? "aberto",
      profile: editing?.profile ?? profile,
      signature: useSig ? (editing?.signature ?? profile.signature) : undefined,
      fromId: converting ? source?.id : editing?.fromId,
    };
    const res = saveDoc(doc);
    if (!res.ok) alert("Salvo só até fechar esta página: o navegador bloqueou o armazenamento. Baixe o PDF agora.");
    nav(`/doc/${res.doc.id}`, { replace: true });
  };

  const title = editing ? `Editar ${editing.number}` : converting ? "Novo recibo" : isOrc ? "Novo orçamento" : "Novo recibo";

  return (
    <>
      <PageTitle sub={converting ? `Criado a partir do orçamento ${source?.number}. Confira e salve.` : undefined}>{title}</PageTitle>

      {!profile.name.trim() && (
        <Link to="/perfil" className="mb-4 block rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Seus dados ainda estão em branco e vão sair vazios no PDF. <strong>Preencher agora</strong>
        </Link>
      )}

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Card title="Cliente">
          <Field label="Nome do cliente">
            <input
              className={inputCls}
              list="clientes"
              value={customer.name}
              onChange={(e) => onName(e.target.value)}
              autoComplete="off"
              placeholder="Digite ou escolha um cliente salvo"
            />
            <datalist id="clientes">
              {customerNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </Field>
          <TextField label="CPF ou CNPJ" value={customer.document} onChange={setC("document")} inputMode="numeric" />
          <TextField label="Telefone / WhatsApp" value={customer.phone} onChange={setC("phone")} inputMode="tel" />
          <TextField label="E-mail" value={customer.email} onChange={setC("email")} type="email" />
          <TextField label="Endereço" value={customer.address} onChange={setC("address")} />
        </Card>

        <Card title={isOrc || converting ? "Serviços e materiais" : "Referente a"}>
          {items.map((it, idx) => (
            <div key={it.id} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">Item {idx + 1}</span>
                {items.length > 1 && (
                  <button type="button" className="text-sm font-semibold text-red-700" onClick={() => setItems(items.filter((x) => x.id !== it.id))}>
                    Remover
                  </button>
                )}
              </div>
              <input
                className={inputCls}
                placeholder="Descrição (ex.: Troca de tomadas)"
                value={it.description}
                onChange={(e) => patchItem(it.id, { description: e.target.value })}
                aria-label={`Descrição do item ${idx + 1}`}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputCls}
                  inputMode="decimal"
                  placeholder="Qtd"
                  value={it.qty}
                  onChange={(e) => patchItem(it.id, { qty: e.target.value })}
                  aria-label={`Quantidade do item ${idx + 1}`}
                />
                <input
                  className={inputCls}
                  inputMode="decimal"
                  placeholder="Valor unit. R$"
                  value={it.unitPrice}
                  onChange={(e) => patchItem(it.id, { unitPrice: e.target.value })}
                  aria-label={`Valor unitário do item ${idx + 1}`}
                />
              </div>
              <p className="text-right text-sm text-slate-600">
                Subtotal: <strong>{brl(toNumber(it.qty) * toNumber(it.unitPrice))}</strong>
              </p>
            </div>
          ))}
          <button type="button" className={`${btnSecondary} w-full`} onClick={() => setItems([...items, blankItem()])}>
            + Adicionar item
          </button>
        </Card>

        <Card title="Valores e condições">
          <TextField label="Desconto (R$)" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0,00" />
          <Field label="Forma de pagamento">
            <input className={inputCls} list="formas" value={payment} onChange={(e) => setPayment(e.target.value)} placeholder="Escolha ou digite" />
            <datalist id="formas">
              {PAYMENTS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>
          {outIsOrc && <TextField label="Validade do orçamento (dias)" inputMode="numeric" value={validity} onChange={(e) => setValidity(e.target.value)} />}
          <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <TextArea label="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Prazo de execução, garantia, materiais por conta do cliente..." />
          <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <input
              type="checkbox"
              className="h-5 w-5 accent-emerald-700"
              checked={useSig}
              disabled={!profile.signature && !editing?.signature}
              onChange={(e) => setUseSig(e.target.checked)}
            />
            <span className="text-sm text-slate-800">
              Incluir minha assinatura
              {!profile.signature && !editing?.signature && (
                <>
                  {" "}
                  — <Link to="/perfil" className="font-semibold text-emerald-700 underline">cadastre a sua</Link>
                </>
              )}
            </span>
          </label>
        </Card>

        <div className="sticky bottom-20 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold text-emerald-900">Total</span>
            <span className="text-2xl font-extrabold text-emerald-900">{brl(total)}</span>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
          <button type="submit" className={`${btnPrimary} mt-3 w-full`}>
            {editing ? "Salvar alterações" : outIsOrc ? "Criar orçamento" : "Criar recibo"}
          </button>
        </div>
      </form>
    </>
  );
}
