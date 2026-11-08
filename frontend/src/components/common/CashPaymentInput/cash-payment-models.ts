
export interface CashPaymentCalculation {
  totalAmount: number;
  receivedAmount: number;
  changeAmount: number;
  balanceDue: number;
  isFullyPaid: boolean;
}

export type CashQuickAmountMode = "set" | "add";
