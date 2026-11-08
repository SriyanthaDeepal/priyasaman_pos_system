
import type {
  CheckoutCalculation,
  CheckoutSummaryData,
} from "./checkout-summary-models";

export function roundCheckoutMoney(
  value: number,
  decimalPlaces = 2
): number {
  const precision = Number.isFinite(decimalPlaces)
    ? Math.min(6, Math.max(0, Math.trunc(decimalPlaces)))
    : 2;

  return Number(value.toFixed(precision));
}

export function formatCheckoutMoney(
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

export function calculateCheckoutSummary(
  data: CheckoutSummaryData,
  decimalPlaces = 2
): CheckoutCalculation {
  const round = (amount: number) =>
    roundCheckoutMoney(amount, decimalPlaces);

  const validNumber = (amount: number) =>
    Number.isFinite(amount) && amount >= 0;

  const hasInvalidData =
    !validNumber(data.billDiscount) ||
    !validNumber(data.taxRate) ||
    data.taxRate > 100 ||
    data.items.some(
      (item) =>
        !validNumber(item.quantity) ||
        !validNumber(item.unitPrice) ||
        !validNumber(item.discountAmount ?? 0) ||
        (item.discountAmount ?? 0) >
          round(
            Math.max(0, item.quantity) *
              Math.max(0, item.unitPrice)
          )
    ) ||
    data.payments.some(
      (payment) => !validNumber(payment.amount)
    );

  const itemCount = data.items.length;

  const totalQuantity = data.items.reduce(
    (sum, item) =>
      sum +
      (validNumber(item.quantity)
        ? item.quantity
        : 0),
    0
  );

  const subtotal = round(
    data.items.reduce((sum, item) => {
      if (
        !validNumber(item.quantity) ||
        !validNumber(item.unitPrice)
      ) {
        return sum;
      }

      return (
        sum +
        round(item.quantity * item.unitPrice)
      );
    }, 0)
  );

  const itemDiscountTotal = round(
    data.items.reduce((sum, item) => {
      const lineTotal = round(
        Math.max(0, item.quantity) *
          Math.max(0, item.unitPrice)
      );

      const discount = validNumber(
        item.discountAmount ?? 0
      )
        ? item.discountAmount ?? 0
        : 0;

      return sum + Math.min(lineTotal, discount);
    }, 0)
  );

  const afterItemDiscount = round(
    Math.max(0, subtotal - itemDiscountTotal)
  );

  const billDiscount = round(
    Math.min(
      afterItemDiscount,
      validNumber(data.billDiscount)
        ? data.billDiscount
        : 0
    )
  );

  const afterAllDiscounts = round(
    afterItemDiscount - billDiscount
  );

  const taxRate = validNumber(data.taxRate)
    ? Math.min(100, data.taxRate)
    : 0;

  let taxableAmount = afterAllDiscounts;
  let taxAmount = 0;
  let totalPayable = afterAllDiscounts;

  if (data.taxMode === "exclusive") {
    taxAmount = round(
      (afterAllDiscounts * taxRate) / 100
    );

    totalPayable = round(
      afterAllDiscounts + taxAmount
    );
  }

  if (data.taxMode === "inclusive") {
    taxAmount = round(
      (afterAllDiscounts * taxRate) /
        (100 + taxRate)
    );

    taxableAmount = round(
      afterAllDiscounts - taxAmount
    );
  }

  const allocatedAmount = round(
    data.payments.reduce(
      (sum, payment) =>
        sum +
        (validNumber(payment.amount)
          ? payment.amount
          : 0),
      0
    )
  );

  const confirmedAmount = round(
    data.payments.reduce(
      (sum, payment) =>
        sum +
        (payment.confirmed &&
        validNumber(payment.amount)
          ? payment.amount
          : 0),
      0
    )
  );

  const difference = round(
    allocatedAmount - totalPayable
  );

  const balanceDue = Math.max(0, -difference);
  const excessAmount = Math.max(0, difference);

  const cashAllocated = round(
    data.payments
      .filter((payment) => payment.method === "cash")
      .reduce(
        (sum, payment) =>
          sum +
          (validNumber(payment.amount)
            ? payment.amount
            : 0),
        0
      )
  );

  const cashChange = round(
    Math.min(cashAllocated, excessAmount)
  );

  const isFullyAllocated =
    !hasInvalidData &&
    data.items.length > 0 &&
    balanceDue === 0;

  const isFullyConfirmed =
    isFullyAllocated &&
    round(confirmedAmount - totalPayable) >= 0;

  return {
    itemCount,
    totalQuantity,
    subtotal,
    itemDiscountTotal,
    billDiscount,
    taxableAmount,
    taxAmount,
    totalPayable,
    allocatedAmount,
    confirmedAmount,
    balanceDue,
    excessAmount,
    cashChange,
    isFullyAllocated,
    isFullyConfirmed,
    hasInvalidData,
  };
}
