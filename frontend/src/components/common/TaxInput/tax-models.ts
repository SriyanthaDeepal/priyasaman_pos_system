
export type TaxMode = "inclusive" | "exclusive" | "none";

export interface TaxValue {
  rate: number;
  mode: TaxMode;
}

export interface TaxCalculation {
  baseAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  rate: number;
  mode: TaxMode;
}
