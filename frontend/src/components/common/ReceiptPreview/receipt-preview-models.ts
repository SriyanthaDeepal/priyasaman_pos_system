
export type ReceiptPaperSize = "58mm" | "80mm" | "a4";

export type ReceiptTaxMode =
  | "none"
  | "inclusive"
  | "exclusive";

export type ReceiptPaymentMethod =
  | "cash"
  | "card"
  | "bank"
  | "qr";

export interface ReceiptBusiness {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  taxRegistrationNumber?: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  sku?: string;
}

export interface ReceiptPayment {
  id: string;
  method: ReceiptPaymentMethod;
  amount: number;
  reference?: string;
}

export interface ReceiptData {
  receiptNumber: string;
  issuedAt: string | Date;

  business: ReceiptBusiness;

  cashier?: string;
  customerName?: string;

  items: ReceiptItem[];

  billDiscount: number;
  taxRate: number;
  taxMode: ReceiptTaxMode;

  payments: ReceiptPayment[];

  footerMessage?: string;
}

export interface ReceiptTotals {
  subtotal: number;
  itemDiscount: number;
  billDiscount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
  amountReceived: number;
  balanceDue: number;
  excessAmount: number;
  cashChange: number;
}
