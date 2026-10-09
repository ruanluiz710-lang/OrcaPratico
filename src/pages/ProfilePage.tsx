import { useRef, useState } from "react";
import { exportBackup, importBackup, saveProfile, useStore } from "../lib/store";
import type { Profile } from "../lib/types";
import { Card, PageTitle, TextField, btnPrimary, btnSecondary } from "../components/ui";
import SignaturePad from "../components/SignaturePad";
import { resizeImage } from "../lib/image";

export default function ProfilePage() {
  const { profile: saved } = useStore();
  const [p, setP] = useState<Profile>(saved);
  const [msg, setMsg] = useState("");
  const [drawing, setDrawing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => setP({ ...p, [k]: e.target.value });

  const save = (next: Profile) => {
    setMsg(saveProfile(next) ? "Dados salvos neste aparelho." : "Não foi possível salvar: o navegador bloqueou o armazenamento.");
  };

  const backup = () => {
    const url = URL.createObjectURL(new Blob([exportBackup()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `orcapratico-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    if (!confirm("Restaurar o backup substitui tudo que está neste aparelho. Continuar?")) return;
    const ok = importBackup(await file.text());
    setMsg(ok ? "Backup restaurado." : "Arquivo inválido.");
    if (ok) window.location.reload();
  };

  return (
    <>
      <PageTitle sub="Aparecem no topo dos seus orçamentos e recibos.">Meus dados</PageTitle>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save(p);
        }}
      >
        <Card>
          <TextField label="Seu nome ou empresa" value={p.name} onChange={set("name")} autoComplete="name" required />
          <TextField label="Profissão" placeholder="Ex.: Eletricista, Pedreiro" value={p.trade} onChange={set("trade")} />
          <TextField label="CPF ou CNPJ" value={p.document} onChange={set("document")} inputMode="numeric" />
          <TextField label="Telefone / WhatsApp" value={p.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" />
          <TextField label="E-mail" value={p.email} onChange={set("email")} type="email" autoComplete="email" />
          <TextField label="Endereço" value={p.address} onChange={set("address")} autoComplete="street-address" />
        </Card>

        <Card title="Logo (opcional)">
          <p className="text-sm text-slate-600">Sai no canto superior direito do PDF. Se não quiser, deixe sem logo.</p>
          {p.logo && <img src={p.logo} alt="Sua logo" className="h-24 rounded-xl border border-slate-200 bg-white object-contain p-2" />}
          <div className="flex gap-2">
            <button type="button" className={`${btnSecondary} flex-1`} onClick={() => logoRef.current?.click()}>
              {p.logo ? "Trocar logo" : "Escolher imagem"}
            </button>
            {p.logo && (
              <button
                type="button"
                className={`${btnSecondary} flex-1`}
                onClick={() => {
                  const next = { ...p, logo: undefined };
                  setP(next);
                  save(next);
                }}
              >
                Remover
              </button>
            )}
            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  const next = { ...p, logo: await resizeImage(file) };
                  setP(next);
                  save(next);
                } catch {
                  setMsg("Não foi possível ler essa imagem. Tente um PNG ou JPG.");
                }
              }}
            />
          </div>
        </Card>

        <Card title="Assinatura digital (opcional)">
          {p.signature && !drawing ? (
            <>
              <img src={p.signature} alt="Sua assinatura" className="h-24 rounded-xl border border-slate-200 bg-white object-contain p-2" />
              <div className="flex gap-2">
                <button type="button" className={`${btnSecondary} flex-1`} onClick={() => setDrawing(true)}>
                  Refazer
                </button>
                <button
                  type="button"
                  className={`${btnSecondary} flex-1`}
                  onClick={() => {
                    const next = { ...p, signature: undefined };
                    setP(next);
                    save(next);
                  }}
                >
                  Remover
                </button>
              </div>
            </>
          ) : (
            <SignaturePad
              onSave={(sig) => {
                const next = { ...p, signature: sig };
                setP(next);
                setDrawing(false);
                save(next);
              }}
            />
          )}
        </Card>

        <button type="submit" className={`${btnPrimary} w-full`}>
          Salvar meus dados
        </button>
        {msg && (
          <p role="status" className="text-center text-sm font-medium text-emerald-800">
            {msg}
          </p>
        )}
      </form>

      <div className="mt-6">
        <Card title="Cópia de segurança">
          <p className="text-sm text-slate-600">
            Seus dados ficam guardados <strong>neste aparelho</strong>, no navegador. Se limpar os dados do navegador ou trocar de celular, eles
            somem. Baixe uma cópia de vez em quando e restaure em outro aparelho.
          </p>
          <div className="flex gap-2">
            <button type="button" className={`${btnSecondary} flex-1`} onClick={backup}>
              Baixar cópia
            </button>
            <button type="button" className={`${btnSecondary} flex-1`} onClick={() => fileRef.current?.click()}>
              Restaurar
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => restore(e.target.files?.[0])} />
          </div>
        </Card>
      </div>
    </>
  );
}
