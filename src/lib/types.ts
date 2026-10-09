export type Kind = "orcamento" | "recibo";
export type Status = "aberto" | "aprovado" | "recusado";

export interface Profile {
  name: string;
  trade: string; // profissão, ex.: Eletricista
  document: string; // CPF ou CNPJ
  phone: string;
  email: string;
  address: string;
  signature?: string; // PNG em data URL
  logo?: string; // PNG/JPEG em data URL, sai no canto superior direito do PDF
}

export interface Customer {
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
}

export interface Item {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface Doc {
  id: string;
  kind: Kind;
  number: string;
  date: string; // yyyy-mm-dd
  customer: Customer;
  items: Item[];
  discount: number;
  validityDays?: number; // só orçamento
  payment: string;
  notes: string;
  status: Status; // só faz sentido em orçamento
  profile: Profile; // cópia dos dados do autônomo no momento da emissão
  signature?: string;
  fromId?: string; // recibo gerado a partir de um orçamento
}

export interface State {
  profile: Profile;
  docs: Doc[];
  counters: Record<Kind, number>;
}

export const emptyProfile: Profile = {
  name: "",
  trade: "",
  document: "",
  phone: "",
  email: "",
  address: "",
};

export const emptyCustomer: Customer = { name: "", document: "", phone: "", email: "", address: "" };
