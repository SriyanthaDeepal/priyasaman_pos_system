
import type {
  CashPaymentCalculation,
} from "./cash-payment-models";

export function roundCashMoney(
  value: number,
  decimalPlaces = 2
): number {
  const precision = Number.isFinite(decimalPlaces)
    ? Math.min(6, Math.max(0, Math.trunc(decimalPlaces)))
    : 2;

  return Number(value.toFixed(precision));
}

export function formatCashMoney(
  value: number,
  decimalPlaces = 2
): string {
  const precision = Number.isFinite(decimalPlaces)
    ? Math.min(6, Math.max(0, Math.trunc(decimalPlaces)))
    : 2;

  return value.toLocaleString("en-LK", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

export function calculateCashPayment(
  totalAmount: number,
  receivedAmount: number,
  decimalPlaces = 2
): CashPaymentCalculation {
  const safeTotal = roundCashMoney(
    Number.isFinite(totalAmount)
      ? Math.max(0, totalAmount)
      : 0,
    decimalPlaces
  );

  const safeReceived = roundCashMoney(
    Number.isFinite(receivedAmount)
      ? Math.max(0, receivedAmount)
      : 0,
    decimalPlaces
  );

  const difference = roundCashMoney(
    safeReceived - safeTotal,
    decimalPlaces
  );

  return {
    totalAmount: safeTotal,
    receivedAmount: safeReceived,
    changeAmount: Math.max(0, difference),
    balanceDue: Math.max(0, -difference),
    isFullyPaid: difference >= 0,
  };
}
