
import type {
  SplitPaymentCalculation,
  SplitPaymentEntry,
  SplitPaymentMethodOption,
} from "./split-payment-models";

export const DEFAULT_SPLIT_PAYMENT_METHODS:
  SplitPaymentMethodOption[] = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "bank", label: "Bank Transfer" },
    { value: "qr", label: "QR Payment" },
  ];

export function roundSplitMoney(
  value: number,
  decimalPlaces = 2
): number {
  const precision = Number.isFinite(decimalPlaces)
    ? Math.min(6, Math.max(0, Math.trunc(decimalPlaces)))
    : 2;

  return Number(value.toFixed(precision));
}

export function formatSplitMoney(
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

export function calculateSplitPayment(
  totalAmount: number,
  entries: SplitPaymentEntry[],
  decimalPlaces = 2
): SplitPaymentCalculation {
  const safeTotal = roundSplitMoney(
    Number.isFinite(totalAmount)
      ? Math.max(0, totalAmount)
      : 0,
    decimalPlaces
  );

  const hasInvalidEntries =
    !Number.isFinite(totalAmount) ||
    totalAmount < 0 ||
    entries.some(
      (entry) =>
        !Number.isFinite(entry.amount) ||
        entry.amount < 0
    );

  const totalReceived = roundSplitMoney(
    entries.reduce((sum, entry) => {
      const amount =
        Number.isFinite(entry.amount) &&
        entry.amount >= 0
          ? entry.amount
          : 0;

      return sum + amount;
    }, 0),
    decimalPlaces
  );

  const difference = roundSplitMoney(
    totalReceived - safeTotal,
    decimalPlaces
  );

  const balanceDue = Math.max(0, -difference);
  const excessAmount = Math.max(0, difference);

  const cashReceived = roundSplitMoney(
    entries
      .filter((entry) => entry.method === "cash")
      .reduce((sum, entry) => {
        return sum + Math.max(0, entry.amount);
      }, 0),
    decimalPlaces
  );

  // Change cannot exceed the cash tendered.
  const cashChange = Math.min(
    cashReceived,
    excessAmount
  );

  return {
    totalAmount: safeTotal,
    totalReceived,
    balanceDue,
    excessAmount,
    cashChange,
    isFullyAllocated:
      !hasInvalidEntries && balanceDue === 0,
    isExact:
      !hasInvalidEntries && difference === 0,
    hasInvalidEntries,
  };
}
