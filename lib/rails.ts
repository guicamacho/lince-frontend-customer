/**
 * Beneficiary rail catalog (client). Drives the add-payee form's conditional fields. The backend
 * (modules/beneficiaries/rails.ts) is the authoritative validator; this mirrors labels + the
 * crypto network list (which MUST match the Depositar catalog and the backend).
 */
export type Rail = "pix" | "ach" | "fedwire" | "sepa" | "swift" | "crypto";
export type RailGroup = "fiat" | "crypto";

export const CRYPTO_NETWORKS: Record<string, string[]> = {
  USDT: ["TRON (TRC-20)", "Polygon", "Ethereum (ERC-20)"],
  USDC: ["Polygon", "Ethereum (ERC-20)", "Base"],
};

export type FieldKind = "text" | "select";
export interface RailField {
  name: string; // key inside `destination`
  label: string;
  kind: FieldKind;
  options?: { value: string; label: string }[];
  placeholder?: string;
  optional?: boolean;
}

export interface RailMeta {
  rail: Rail;
  group: RailGroup;
  label: string; // chip label
  sub: string; // one-line helper
  /** asset is fixed (fiat single-currency rails) or picked (swift/crypto). */
  asset: string | null; // fixed asset, else null
  assetOptions?: string[]; // when picked
  needsNetwork?: boolean; // crypto
  /** whether the payee's country is asked (fiat rails with a fixed country derive it). */
  asksPayeeCountry: boolean;
  fields: RailField[]; // rail-specific destination fields
}

export const RAILS: RailMeta[] = [
  {
    rail: "pix",
    group: "fiat",
    label: "PIX",
    sub: "Reais (BRL) via PIX",
    asset: "BRL",
    asksPayeeCountry: false,
    fields: [
      {
        name: "pixKeyType",
        label: "Tipo de chave",
        kind: "select",
        options: [
          { value: "cpf", label: "CPF" },
          { value: "cnpj", label: "CNPJ" },
          { value: "email", label: "E-mail" },
          { value: "phone", label: "Telefone" },
          { value: "random", label: "Chave aleatória" },
        ],
      },
      { name: "pixKey", label: "Chave PIX", kind: "text", placeholder: "CPF/CNPJ, e-mail, telefone ou chave" },
    ],
  },
  {
    rail: "ach",
    group: "fiat",
    label: "ACH",
    sub: "Dólar (USD) · EUA",
    asset: "USD",
    asksPayeeCountry: false,
    fields: [
      { name: "routingNumber", label: "Routing number (ABA)", kind: "text", placeholder: "9 dígitos" },
      { name: "accountNumber", label: "Número da conta", kind: "text" },
    ],
  },
  {
    rail: "fedwire",
    group: "fiat",
    label: "Fedwire",
    sub: "Dólar (USD) · EUA",
    asset: "USD",
    asksPayeeCountry: false,
    fields: [
      { name: "routingNumber", label: "Routing number (ABA)", kind: "text", placeholder: "9 dígitos" },
      { name: "accountNumber", label: "Número da conta", kind: "text" },
    ],
  },
  {
    rail: "sepa",
    group: "fiat",
    label: "SEPA",
    sub: "Euro (EUR) · Europa",
    asset: "EUR",
    asksPayeeCountry: false,
    fields: [
      { name: "iban", label: "IBAN", kind: "text", placeholder: "DE89 3704 0044 0532 0130 00" },
      { name: "bic", label: "BIC / SWIFT", kind: "text" },
    ],
  },
  {
    rail: "swift",
    group: "fiat",
    label: "SWIFT",
    sub: "Internacional (quase o mundo todo)",
    asset: null,
    assetOptions: ["USD", "EUR", "GBP"],
    asksPayeeCountry: true,
    fields: [
      { name: "swiftBic", label: "SWIFT / BIC", kind: "text" },
      { name: "iban", label: "IBAN", kind: "text", optional: true, placeholder: "se aplicável" },
      { name: "accountNumber", label: "Número da conta", kind: "text", optional: true, placeholder: "se não houver IBAN" },
      { name: "bankName", label: "Banco", kind: "text" },
      { name: "bankCountry", label: "País do banco", kind: "text", placeholder: "Ex.: SG" },
    ],
  },
  {
    rail: "crypto",
    group: "crypto",
    label: "Stablecoin",
    sub: "USDT ou USDC · on-chain",
    asset: null,
    assetOptions: ["USDT", "USDC"],
    needsNetwork: true,
    asksPayeeCountry: true,
    fields: [
      { name: "walletAddress", label: "Endereço da carteira", kind: "text", placeholder: "0x… ou T…" },
      { name: "memoTag", label: "Memo / tag de destino", kind: "text", optional: true },
    ],
  },
];

export const railByKey = (r: Rail) => RAILS.find((x) => x.rail === r)!;
