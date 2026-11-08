
import type {
  DiscountCalculation,
  DiscountValue,
} from "./discount-models";

export function roundMoney(
  value: number,
  decimalPlaces = 2
): number {
  const precision = Number.isFinite(decimalPlaces)
    ? Math.min(6, Math.max(0, Math.trunc(decimalPlaces)))
    : 2;

  return Number(value.toFixed(precision));
}

export function formatMoney(
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

export function calculateDiscount(
  baseAmount: number,
  discount: DiscountValue,
  maxPercentage = 100,
  maxFixedAmount = Number.MAX_SAFE_INTEGER,
  decimalPlaces = 2
): DiscountCalculation {
  const safeBase = Number.isFinite(baseAmount)
    ? Math.max(0, baseAmount)
    : 0;

  const allowedPercentage = Number.isFinite(maxPercentage)
    ? Math.min(100, Math.max(0, maxPercentage))
    : 0;

  const allowedFixed = Number.isFinite(maxFixedAmount)
    ? Math.min(safeBase, Math.max(0, maxFixedAmount))
    : 0;

  const requested = Number.isFinite(discount.value)
    ? Math.max(0, discount.value)
    : 0;

  const effectiveValue =
    discount.type === "percentage"
      ? Math.min(requested, allowedPercentage)
      : Math.min(requested, allowedFixed);

  const rawDiscount =
    discount.type === "percentage"
      ? (safeBase * effectiveValue) / 100
      : effectiveValue;

  const discountAmount = Math.min(
    safeBase,
    roundMoney(rawDiscount, decimalPlaces)
  );

  const finalAmount = roundMoney(
    Math.max(0, safeBase - discountAmount),
    decimalPlaces
  );

  return {
    discountAmount,
    finalAmount,
    effectiveValue,
  };
}
