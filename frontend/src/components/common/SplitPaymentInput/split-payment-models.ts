
export type SplitPaymentMethod =
  | "cash"
  | "card"
  | "bank"
  | "qr";

export interface SplitPaymentEntry {
  id: string;
  method: SplitPaymentMethod;
  amount: number;
  reference?: string;
}

export interface SplitPaymentCalculation {
  totalAmount: number;
  totalReceived: number;
  balanceDue: number;
  excessAmount: number;
  cashChange: number;
  isFullyAllocated: boolean;
  isExact: boolean;
  hasInvalidEntries: boolean;
}

export interface SplitPaymentMethodOption {
  value: SplitPaymentMethod;
  label: string;
  disabled?: boolean;
}
