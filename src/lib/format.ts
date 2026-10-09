import type { Doc } from "./types";

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ");

export const toNumber = (s: string) => {
  const n = Number(String(s).trim().replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export const today = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

export const subtotal = (d: Pick<Doc, "items">) =>
  d.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

export const total = (d: Pick<Doc, "items" | "discount">) =>
  Math.max(0, subtotal(d) - Math.min(d.discount, subtotal(d)));

const UN = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CEN = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function ate999(n: number): string {
  if (n === 100) return "cem";
  const parts: string[] = [];
  const c = Math.floor(n / 100);
  const r = n % 100;
  if (c) parts.push(CEN[c]);
  if (r) parts.push(r < 20 ? UN[r] : DEZ[Math.floor(r / 10)] + (r % 10 ? " e " + UN[r % 10] : ""));
  return parts.join(" e ");
}

function inteiroExtenso(n: number): string {
  if (n === 0) return "zero";
  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (milhoes) partes.push(milhoes === 1 ? "um milhão" : `${ate999(milhoes)} milhões`);
  if (milhares) partes.push(milhares === 1 ? "mil" : `${ate999(milhares)} mil`);
  if (resto) partes.push(ate999(resto));
  if (partes.length === 1) return partes[0];
  const ultimo = partes[partes.length - 1];
  const usaE = resto ? resto < 100 || resto % 100 === 0 : true;
  return partes.slice(0, -1).join(" ") + (usaE ? " e " : " ") + ultimo;
}

/** 1250.5 -> "mil duzentos e cinquenta reais e cinquenta centavos" */
export function valorExtenso(valor: number): string {
  const cents = Math.round(valor * 100);
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  const partes: string[] = [];
  if (reais) {
    const unidade = reais === 1 ? "real" : reais % 1_000_000 === 0 ? "de reais" : "reais";
    partes.push(`${inteiroExtenso(reais)} ${unidade}`);
  }
  if (centavos) partes.push(`${inteiroExtenso(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  return partes.length ? partes.join(" e ") : "zero reais";
}
