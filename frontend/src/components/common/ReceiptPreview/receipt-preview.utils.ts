import type {
  ReceiptData,
  ReceiptPaymentMethod,
  ReceiptTotals,
} from "./receipt-preview-models";

export const RECEIPT_PAYMENT_LABELS:
  Record<ReceiptPaymentMethod, string> = {
    cash: "Cash",
    card: "Card",
    bank: "Bank Transfer",
    qr: "QR Payment",
  };

export function roundReceiptMoney(
  amount: number
): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatReceiptMoney(
  amount: number,
  currencySymbol = "Rs."
): string {
  return `${currencySymbol} ${amount.toLocaleString(
    "en-LK",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

export function calculateReceiptTotals(
  data: ReceiptData
): ReceiptTotals {
  const round = roundReceiptMoney;

  const safe = (value: number) =>
    Number.isFinite(value)
      ? Math.max(0, value)
      : 0;

  const subtotal = round(
    data.items.reduce(
      (sum, item) =>
        sum +
        round(
          safe(item.quantity) *
            safe(item.unitPrice)
        ),
      0
    )
  );

  const itemDiscount = round(
    data.items.reduce((sum, item) => {
      const lineTotal = round(
        safe(item.quantity) *
          safe(item.unitPrice)
      );

      return (
        sum +
        Math.min(
          lineTotal,
          safe(item.discountAmount ?? 0)
        )
      );
    }, 0)
  );

  const afterItemDiscount = round(
    Math.max(0, subtotal - itemDiscount)
  );

  const billDiscount = round(
    Math.min(
      afterItemDiscount,
      safe(data.billDiscount)
    )
  );

  const net = round(
    afterItemDiscount - billDiscount
  );

  const rate = safe(data.taxRate);

  let taxAmount = 0;
  let taxableAmount = net;
  let total = net;

  if (data.taxMode === "exclusive") {
    taxAmount = round((net * rate) / 100);
    total = round(net + taxAmount);
  }

  if (data.taxMode === "inclusive") {
    taxAmount = round(
      (net * rate) / (100 + rate)
    );
    taxableAmount = round(
      net - taxAmount
    );
  }

  const amountReceived = round(
    data.payments.reduce(
      (sum, payment) =>
        sum + safe(payment.amount),
      0
    )
  );

  const difference = round(
    amountReceived - total
  );

  const balanceDue = Math.max(0, -difference);
  const excessAmount = Math.max(0, difference);

  const cashReceived = round(
    data.payments
      .filter((payment) =>
        payment.method === "cash"
      )
      .reduce(
        (sum, payment) =>
          sum + safe(payment.amount),
        0
      )
  );

  const cashChange = round(
    Math.min(cashReceived, excessAmount)
  );

  return {
    subtotal,
    itemDiscount,
    billDiscount,
    taxableAmount,
    taxAmount,
    total,
    amountReceived,
    balanceDue,
    excessAmount,
    cashChange,
  };
}

export function formatReceiptDate(
  value: string | Date
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
