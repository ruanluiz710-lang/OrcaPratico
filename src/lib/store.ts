import { useSyncExternalStore } from "react";
import { emptyProfile, type Doc, type Kind, type Profile, type State, type Status } from "./types";

const KEY = "orcapratico:v1";

const empty = (): State => ({
  profile: { ...emptyProfile },
  docs: [],
  counters: { orcamento: 0, recibo: 0 },
});

function normalize(raw: unknown): State {
  const base = empty();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<State>;
  return {
    profile: { ...base.profile, ...(r.profile ?? {}) },
    docs: Array.isArray(r.docs) ? r.docs : [],
    counters: { ...base.counters, ...(r.counters ?? {}) },
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    /* storage indisponível ou corrompido: começa vazio */
  }
  return empty();
}

let state: State = load();
const listeners = new Set<() => void>();

/** Retorna false se o navegador não conseguiu gravar (ex.: armazenamento cheio ou bloqueado). */
function commit(next: State): boolean {
  state = next;
  let ok = true;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    ok = false;
  }
  listeners.forEach((l) => l());
  return ok;
}

export const useStore = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const saveProfile = (profile: Profile) => commit({ ...state, profile });

export function saveDoc(doc: Doc): { ok: boolean; doc: Doc } {
  const exists = state.docs.some((d) => d.id === doc.id);
  let counters = state.counters;
  let saved = doc;
  if (!exists && !doc.number) {
    const n = counters[doc.kind] + 1;
    counters = { ...counters, [doc.kind]: n };
    saved = { ...doc, number: `${doc.kind === "orcamento" ? "ORC" : "REC"}-${String(n).padStart(4, "0")}` };
  }
  const docs = exists ? state.docs.map((d) => (d.id === saved.id ? saved : d)) : [saved, ...state.docs];
  return { ok: commit({ ...state, docs, counters }), doc: saved };
}

export const deleteDoc = (id: string) => commit({ ...state, docs: state.docs.filter((d) => d.id !== id) });

export const setStatus = (id: string, status: Status) =>
  commit({ ...state, docs: state.docs.map((d) => (d.id === id ? { ...d, status } : d)) });

export const getDoc = (id: string | undefined) => state.docs.find((d) => d.id === id);

export const countOf = (kind: Kind) => state.docs.filter((d) => d.kind === kind).length;

export const exportBackup = () => JSON.stringify({ app: "orcapratico", version: 1, data: state }, null, 2);

export function importBackup(text: string): boolean {
  try {
    const parsed = JSON.parse(text);
    if (parsed?.app !== "orcapratico" || !parsed.data) return false;
    return commit(normalize(parsed.data));
  } catch {
    return false;
  }
}
