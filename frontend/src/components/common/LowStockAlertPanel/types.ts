
export type StockAlertStatus =
  | "out_of_stock"
  | "low_stock"
  | "healthy";

export type StockAlertFilter =
  | "all"
  | "alerts"
  | StockAlertStatus;

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  variantId?: string;
  variantName?: string;
  locationId: string;
  locationName: string;
  availableQuantity: number;
  reorderPoint: number;
  targetStockLevel: number;
  isActive: boolean;
}

export interface LowStockAction {
  product: LowStockProduct;
  suggestedQuantity: number;
}

export interface LowStockAlertPanelProps {
  products: LowStockProduct[];

  onAdjustStock?: (
    product: LowStockProduct
  ) => void | Promise<void>;

  onTransferStock?: (
    product: LowStockProduct
  ) => void | Promise<void>;

  onReorder?: (
    action: LowStockAction
  ) => void | Promise<void>;

  onRefresh?: () => void | Promise<void>;

  loading?: boolean;
  error?: string | null;
  canAdjust?: boolean;
  canTransfer?: boolean;
  canReorder?: boolean;
  showHealthyProducts?: boolean;
}
