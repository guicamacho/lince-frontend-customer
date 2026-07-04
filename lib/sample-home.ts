/**
 * SAMPLE / ilustrativo — replace with the Avenia feed.
 *
 * Every value here is placeholder data so the full home dashboard can be seen
 * populated. Real balances / transactions / FX come from Avenia and are NOT
 * wired yet. When they are, swap the exports below for the live feed and delete
 * this notice. All amounts are pre-formatted pt-BR (dot thousands, comma cents)
 * and only reference currencies whose assets exist (USDC/USDT coins, BR/MX flags).
 */

export type CurrencyCode = "USDC" | "USDT" | "BRL" | "MXN";
export type WalletAccent = "gold" | "emerald" | "sky";

export interface Wallet {
  title: string;
  amount: string; // pt-BR, e.g. "84.250,00"
  coins: CurrencyCode[];
  accent: WalletAccent;
}

export const totalNetWorth = {
  whole: "140.750",
  fraction: ",00",
  currency: "USD",
  trend: "+2,3% este mês",
};

export const wallets: Wallet[] = [
  { title: "Carteira stablecoin", amount: "84.250,00", coins: ["USDC", "USDT"], accent: "gold" },
  { title: "Carteira fiat", amount: "44.200,00", coins: ["BRL", "MXN"], accent: "emerald" },
  { title: "Carteira de rendimento", amount: "12.300,00", coins: ["USDC"], accent: "sky" },
];

export type TxType = "in" | "out" | "convert";
export type TxCategory = "crypto" | "fiat";

export interface Transaction {
  type: TxType;
  title: string;
  meta: string;
  date: string;
  amount: string;
  category: TxCategory;
  positive?: boolean;
}

export const transactions: Transaction[] = [
  { type: "in", title: "Depósito · Banco do Brasil", meta: "SWIFT · REF-9872668", date: "12 mai", amount: "+ 12.500,00 BRL", category: "fiat", positive: true },
  { type: "convert", title: "Convertido BRL → USDC", meta: "1 USD = 5,43 BRL", date: "12 mai", amount: "2.301,10 USDC", category: "crypto" },
  { type: "out", title: "Pagamento · Acme Studio", meta: "on-chain · 0xd4…9c5", date: "11 mai", amount: "− 2.000,00 USDC", category: "crypto" },
  { type: "in", title: "Depósito · Mercado Pago", meta: "rede local · MXN", date: "10 mai", amount: "+ 38.400,00 MXN", category: "fiat", positive: true },
  { type: "out", title: "Folha · 14 prestadores", meta: "SWIFT · lote", date: "09 mai", amount: "− 18.250,00 USDC", category: "crypto" },
];

export interface PendingApproval {
  title: string;
  subtitle: string;
  amount: string;
}

export const pendingApprovals: PendingApproval[] = [
  { title: "Pagamento · Acme Studio", subtitle: "Gerente financeiro", amount: "2.000 USDC" },
  { title: "Folha de pagamento", subtitle: "João · há 7h", amount: "18.250 USDC" },
];

export interface FxRate {
  pair: string;
  rate: string;
}

export const fxRates: FxRate[] = [
  { pair: "USD → BRL", rate: "5,43" },
  { pair: "USD → MXN", rate: "18,20" },
  { pair: "BRL → MXN", rate: "3,35" },
];

export type ChartRange = "1A" | "6M" | "3M";

export const chartSeries: Record<ChartRange, number[]> = {
  "1A": [5.2, 5.0, 4.3, 4.0, 5.6, 6.6, 6.7, 6.9, 7.6, 8.4, 9.0, 9.6],
  "6M": [6.7, 6.9, 7.6, 8.4, 9.0, 9.6],
  "3M": [8.4, 9.0, 9.6],
};

export const chartLabels: Record<ChartRange, string[]> = {
  "1A": ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  "6M": ["Jul", "Ago", "Set", "Out", "Nov", "Dez"],
  "3M": ["Out", "Nov", "Dez"],
};
