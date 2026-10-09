import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white active:bg-emerald-800 disabled:opacity-60";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 active:bg-slate-100";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-3 font-semibold text-red-700 active:bg-red-50";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function TextField({ label, hint, ...props }: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint}>
      <input {...props} className={inputCls} />
    </Field>
  );
}

export function TextArea({ label, ...props }: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label}>
      <textarea rows={3} {...props} className={inputCls} />
    </Field>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {title && <h2 className="text-base font-bold text-slate-900">{title}</h2>}
      {children}
    </section>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-extrabold text-slate-900">{children}</h1>
      {sub && <p className="text-sm text-slate-600">{sub}</p>}
    </header>
  );
}
