
export type DiscountType = "percentage" | "fixed";

export interface DiscountValue {
  type: DiscountType;
  value: number;
}

export interface DiscountCalculation {
  discountAmount: number;
  finalAmount: number;
  effectiveValue: number;
}
