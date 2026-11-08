
export type CheckoutTaxMode =
  | "none"
  | "inclusive"
  | "exclusive";

export type CheckoutPaymentMethod =
  | "cash"
  | "card"
  | "bank"
  | "qr";

export interface CheckoutItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number; // Total discount for this line
}

export interface CheckoutPayment {
  id: string;
  method: CheckoutPaymentMethod;
  amount: number;
  reference?: string;
  confirmed?: boolean;
}

export interface CheckoutSummaryData {
  items: CheckoutItem[];
  billDiscount: number;
  taxRate: number;
  taxMode: CheckoutTaxMode;
  payments: CheckoutPayment[];
}

export interface CheckoutCalculation {
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  itemDiscountTotal: number;
  billDiscount: number;
  taxableAmount: number;
  taxAmount: number;
  totalPayable: number;
  allocatedAmount: number;
  confirmedAmount: number;
  balanceDue: number;
  excessAmount: number;
  cashChange: number;
  isFullyAllocated: boolean;
  isFullyConfirmed: boolean;
  hasInvalidData: boolean;
}
