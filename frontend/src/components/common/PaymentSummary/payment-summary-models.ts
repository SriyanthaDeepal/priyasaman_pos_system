
export type PaymentSummaryMethod =
  | "cash"
  | "card"
  | "bank"
  | "qr";

export type PaymentStatus =
  | "unpaid"
  | "partial"
  | "paid"
  | "overpaid";

export type PaymentSummaryTaxMode =
  | "none"
  | "inclusive"
  | "exclusive";

export interface PaymentSummaryData {
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxMode: PaymentSummaryTaxMode;
  amountReceived: number;
  paymentMethod: PaymentSummaryMethod | null;
  transactionReference?: string;
}

export interface PaymentSummaryCalculation {
  subtotal: number;
  discountAmount: number;
  taxableBase: number;
  taxAmount: number;
  totalPayable: number;
  amountReceived: number;
  balanceDue: number;
  changeAmount: number;
  status: PaymentStatus;
}
