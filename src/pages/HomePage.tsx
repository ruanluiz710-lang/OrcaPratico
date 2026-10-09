import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import DocCard from "../components/DocCard";
import { PageTitle } from "../components/ui";

export default function HomePage() {
  const { profile, docs } = useStore();
  const hasProfile = profile.name.trim().length > 0;

  return (
    <>
      <PageTitle sub="Orçamentos e recibos em poucos toques.">
        {hasProfile ? `Olá, ${profile.name.split(" ")[0]}!` : "OrçaPrático"}
      </PageTitle>

      {!hasProfile && (
        <Link to="/perfil" className="mb-4 block rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <strong>Primeiro, preencha seus dados.</strong> Eles saem no topo de todo orçamento e recibo. Toque aqui.
        </Link>
      )}

      <div className="grid gap-3">
        <Link to="/novo/orcamento" className="rounded-2xl bg-emerald-700 p-5 text-white shadow active:bg-emerald-800">
          <p className="text-xl font-extrabold">Novo orçamento</p>
          <p className="text-sm text-emerald-50">Monte a lista de serviços e materiais e mande para o cliente.</p>
        </Link>
        <Link to="/novo/recibo" className="rounded-2xl border-2 border-emerald-700 bg-white p-5 text-emerald-900 active:bg-emerald-50">
          <p className="text-xl font-extrabold">Novo recibo</p>
          <p className="text-sm text-slate-600">Comprove o pagamento recebido, com valor por extenso.</p>
        </Link>
      </div>

      {docs.length > 0 && (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Recentes</h2>
            <Link to="/historico" className="text-sm font-semibold text-emerald-700">
              Ver tudo
            </Link>
          </div>
          <div className="space-y-2">
            {docs.slice(0, 4).map((d) => (
              <DocCard key={d.id} doc={d} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
