
import type {
  PaymentSummaryCalculation,
  PaymentSummaryData,
  PaymentSummaryMethod,
  PaymentStatus,
} from "./payment-summary-models";

export const PAYMENT_METHOD_LABELS: Record<
  PaymentSummaryMethod,
  string
> = {
  cash: "Cash",
  card: "Card",
  bank: "Bank Transfer",
  qr: "QR Payment",
};

export const PAYMENT_STATUS_LABELS: Record<
  PaymentStatus,
  string
> = {
  unpaid: "Unpaid",
  partial: "Partially Paid",
  paid: "Paid",
  overpaid: "Overpaid",
};

export function roundPaymentMoney(
  value: number,
  decimalPlaces = 2
): number {
  const precision = Number.isFinite(decimalPlaces)
    ? Math.min(6, Math.max(0, Math.trunc(decimalPlaces)))
    : 2;

  return Number(value.toFixed(precision));
}

export function formatPaymentMoney(
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

export function calculatePaymentSummary(
  data: PaymentSummaryData,
  decimalPlaces = 2
): PaymentSummaryCalculation {
  const safeSubtotal = roundPaymentMoney(
    Number.isFinite(data.subtotal)
      ? Math.max(0, data.subtotal)
      : 0,
    decimalPlaces
  );

  const requestedDiscount = Number.isFinite(
    data.discountAmount
  )
    ? Math.max(0, data.discountAmount)
    : 0;

  const discountAmount = roundPaymentMoney(
    Math.min(safeSubtotal, requestedDiscount),
    decimalPlaces
  );

  const amountAfterDiscount = roundPaymentMoney(
    safeSubtotal - discountAmount,
    decimalPlaces
  );

  const taxRate = Number.isFinite(data.taxRate)
    ? Math.min(100, Math.max(0, data.taxRate))
    : 0;

  let taxAmount = 0;
  let taxableBase = amountAfterDiscount;
  let totalPayable = amountAfterDiscount;

  if (data.taxMode === "exclusive") {
    taxAmount = roundPaymentMoney(
      (amountAfterDiscount * taxRate) / 100,
      decimalPlaces
    );

    totalPayable = roundPaymentMoney(
      amountAfterDiscount + taxAmount,
      decimalPlaces
    );
  }

  if (data.taxMode === "inclusive") {
    taxAmount = roundPaymentMoney(
      (amountAfterDiscount * taxRate) /
        (100 + taxRate),
      decimalPlaces
    );

    taxableBase = roundPaymentMoney(
      amountAfterDiscount - taxAmount,
      decimalPlaces
    );
  }

  const amountReceived = roundPaymentMoney(
    Number.isFinite(data.amountReceived)
      ? Math.max(0, data.amountReceived)
      : 0,
    decimalPlaces
  );

  const difference = roundPaymentMoney(
    amountReceived - totalPayable,
    decimalPlaces
  );

  const balanceDue = Math.max(0, -difference);
  const changeAmount = Math.max(0, difference);

  let status: PaymentStatus = "unpaid";

  if (amountReceived > 0 && difference < 0) {
    status = "partial";
  } else if (difference === 0 && totalPayable > 0) {
    status = "paid";
  } else if (difference > 0) {
    status = "overpaid";
  }

  return {
    subtotal: safeSubtotal,
    discountAmount,
    taxableBase,
    taxAmount,
    totalPayable,
    amountReceived,
    balanceDue,
    changeAmount,
    status,
  };
}
