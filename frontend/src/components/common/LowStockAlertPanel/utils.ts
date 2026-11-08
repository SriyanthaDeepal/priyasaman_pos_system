
import type {
  LowStockProduct,
  StockAlertStatus,
} from "./types";

export function getStockStatus(
  product: LowStockProduct
): StockAlertStatus {
  if (product.availableQuantity <= 0) {
    return "out_of_stock";
  }

  if (product.availableQuantity <= product.reorderPoint) {
    return "low_stock";
  }

  return "healthy";
}

export function getSuggestedReorderQuantity(
  product: LowStockProduct
): number {
  return Math.max(
    0,
    product.targetStockLevel -
      product.availableQuantity
  );
}
