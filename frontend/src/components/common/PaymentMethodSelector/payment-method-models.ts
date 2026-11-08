
export type PaymentMethodId =
  | "cash"
  | "card"
  | "bank"
  | "qr";

export interface PaymentMethodOption {
  id: PaymentMethodId;
  label: string;
  description?: string;
  disabled?: boolean;
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "cash",
    label: "Cash",
    description: "Physical cash payment",
  },
  {
    id: "card",
    label: "Card",
    description: "Debit or credit card",
  },
  {
    id: "bank",
    label: "Bank Transfer",
    description: "Direct bank transfer",
  },
  {
    id: "qr",
    label: "QR Payment",
    description: "QR-based payment",
  },
];
