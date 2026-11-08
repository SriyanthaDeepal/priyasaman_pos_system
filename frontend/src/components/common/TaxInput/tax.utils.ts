
import type {
  TaxCalculation,
  TaxValue,
} from "./tax-models";

export function roundTaxMoney(
  value: number,
  decimalPlaces = 2
): number {
  const precision = Number.isFinite(decimalPlaces)
    ? Math.min(6, Math.max(0, Math.trunc(decimalPlaces)))
    : 2;

  return Number(value.toFixed(precision));
}

export function formatTaxMoney(
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

export function calculateTax(
  amount: number,
  tax: TaxValue,
  decimalPlaces = 2
): TaxCalculation {
  const safeAmount =
    Number.isFinite(amount)
      ? Math.max(0, amount)
      : 0;

  const safeRate =
    Number.isFinite(tax.rate)
      ? Math.min(100, Math.max(0, tax.rate))
      : 0;

  const baseAmount = roundTaxMoney(
    safeAmount,
    decimalPlaces
  );

  if (tax.mode === "inclusive") {
    // The supplied amount already includes tax.
    const rawTax =
      (baseAmount * safeRate) / (100 + safeRate);

    const taxAmount = roundTaxMoney(
      rawTax,
      decimalPlaces
    );

    const taxableAmount = roundTaxMoney(
      baseAmount - taxAmount,
      decimalPlaces
    );

    return {
      baseAmount,
      taxableAmount,
      taxAmount,
      totalAmount: baseAmount,
      rate: safeRate,
      mode: "inclusive",
    };
  }

  // The supplied amount does not include tax.
  const taxAmount = roundTaxMoney(
    (baseAmount * safeRate) / 100,
    decimalPlaces
  );

  const totalAmount = roundTaxMoney(
    baseAmount + taxAmount,
    decimalPlaces
  );

  return {
    baseAmount,
    taxableAmount: baseAmount,
    taxAmount,
    totalAmount,
    rate: safeRate,
    mode: "exclusive",
  };
}
