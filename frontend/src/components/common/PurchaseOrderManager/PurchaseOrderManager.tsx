
import { useMemo, useState } from "react";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddOutlined,
  DeleteOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  SaveOutlined,
  SendOutlined,
  ShoppingCartOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export interface PurchaseSupplier {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  isActive: boolean;
}

export interface PurchaseProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  variantId?: string;
  variantName?: string;
  purchasePrice: number;
  isActive: boolean;
}

export interface PurchaseOrderItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitCost: number;
}

export type PurchaseOrderStatus =
  | "draft"
  | "pending_approval"
  | "ordered"
  | "partially_received"
  | "received"
  | "cancelled";

export type PurchaseOrderAction =
  | "save_draft"
  | "submit";

export interface PurchaseOrderPayload {
  supplierId: string;
  destinationLocationId: string;
  items: PurchaseOrderItem[];
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  notes: string;
  action: PurchaseOrderAction;
  requiresApproval: boolean;
}

export interface PurchaseOrderRecord {
  id: string;
  reference: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  createdAt: string;
}

export interface PurchaseDestination {
  id: string;
  name: string;
  isActive: boolean;
}

export interface PurchaseOrderManagerProps {
  suppliers: PurchaseSupplier[];
  products: PurchaseProduct[];
  destinations: PurchaseDestination[];

  orders?: PurchaseOrderRecord[];

  onSubmit: (
    payload: PurchaseOrderPayload
  ) => void | Promise<void>;

  onViewOrder?: (
    order: PurchaseOrderRecord
  ) => void;

  initialProductId?: string;
  initialVariantId?: string;
  initialQuantity?: number;

  requireApproval?: boolean;
  canCreate?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  maxItems?: number;
}

interface DraftItem {
  key: string;
  product: PurchaseProduct;
  quantityInput: string;
  unitCostInput: string;
}

// ============================================
// PRIVATE HELPERS
// ============================================

function productKey(
  productId: string,
  variantId?: string
): string {
  return JSON.stringify([
    productId,
    variantId ?? null,
  ]);
}

function productLabel(
  product: PurchaseProduct
): string {
  return product.variantName
    ? `${product.name} — ${product.variantName}`
    : product.name;
}

function money(value: number): string {
  return `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function validMoney(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= 0 &&
    Math.round(value * 100) / 100 === value
  );
}

function parseAmount(value: string): number {
  return Number(value);
}

function statusColor(
  status: PurchaseOrderStatus
):
  | "default"
  | "warning"
  | "info"
  | "success"
  | "error" {
  switch (status) {
    case "draft":
      return "default";
    case "pending_approval":
      return "warning";
    case "ordered":
      return "info";
    case "partially_received":
      return "warning";
    case "received":
      return "success";
    case "cancelled":
      return "error";
  }
}

// ============================================
// COMPONENT
// ============================================

export default function PurchaseOrderManager({
  suppliers,
  products,
  destinations,
  orders = [],
  onSubmit,
  onViewOrder,
  initialProductId,
  initialVariantId,
  initialQuantity = 1,
  requireApproval = false,
  canCreate = true,
  disabled = false,
  loading = false,
  error = null,
  maxItems = 100,
}: PurchaseOrderManagerProps) {
  const [supplierId, setSupplierId] = useState("");
  const [destinationId, setDestinationId] =
    useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<PurchaseProduct | null>(null);

  // ==========================================
  // INITIAL ITEMS - NO useEffect
  // ============================================

  const [items, setItems] = useState<DraftItem[]>(() => {
    if (!initialProductId || maxItems < 1) {
      return [];
    }

    const product = products.find(
      (item) =>
        item.id === initialProductId &&
        item.variantId === initialVariantId &&
        item.isActive
    );

    if (!product) {
      return [];
    }

    return [
      {
        key: productKey(
          product.id,
          product.variantId
        ),
        product,
        quantityInput: String(
          Number.isSafeInteger(initialQuantity) &&
          initialQuantity > 0
            ? initialQuantity
            : 1
        ),
        unitCostInput: String(product.purchasePrice),
      },
    ];
  });

  const [discountInput, setDiscountInput] =
    useState("0");

  const [taxInput, setTaxInput] = useState("0");

  const [shippingInput, setShippingInput] =
    useState("0");

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [localError, setLocalError] =
    useState<string | null>(null);

  const busy = disabled || loading || submitting;
  const readOnly = busy || !canCreate;

  // ==========================================
  // ACTIVE OPTIONS
  // ============================================

  const activeSuppliers = useMemo(
    () =>
      suppliers.filter(
        (supplier) => supplier.isActive
      ),
    [suppliers]
  );

  const activeDestinations = useMemo(
    () =>
      destinations.filter(
        (location) => location.isActive
      ),
    [destinations]
  );

  const availableProducts = useMemo(() => {
    const selected = new Set(
      items.map((item) => item.key)
    );

    return products.filter(
      (product) =>
        product.isActive &&
        !selected.has(
          productKey(product.id, product.variantId)
        )
    );
  }, [products, items]);

  // ==========================================
  // ITEM CALCULATIONS
  // ============================================

  const calculatedItems = items.map((item) => {
    const quantity = Number(item.quantityInput);
    const unitCost = parseAmount(item.unitCostInput);

    const quantityValid =
      item.quantityInput.trim() !== "" &&
      Number.isSafeInteger(quantity) &&
      quantity > 0;

    const costValid =
      item.unitCostInput.trim() !== "" &&
      validMoney(unitCost);

    const lineTotal = quantity * unitCost;

    return {
      ...item,
      quantity,
      unitCost,
      lineTotal,
      valid:
        quantityValid &&
        costValid &&
        Number.isFinite(lineTotal),
    };
  });

  const itemsValid =
    calculatedItems.length > 0 &&
    calculatedItems.every((item) => item.valid);

  const subtotal = calculatedItems.reduce(
    (sum, item) =>
      sum + (item.valid ? item.lineTotal : 0),
    0
  );

  const discount = parseAmount(discountInput);
  const tax = parseAmount(taxInput);
  const shipping = parseAmount(shippingInput);

  const amountsValid =
    discountInput.trim() !== "" &&
    taxInput.trim() !== "" &&
    shippingInput.trim() !== "" &&
    validMoney(discount) &&
    validMoney(tax) &&
    validMoney(shipping) &&
    discount <= subtotal;

  const total =
    subtotal - discount + tax + shipping;

  const selectedSupplier = activeSuppliers.find(
    (supplier) => supplier.id === supplierId
  );

  const selectedDestination = activeDestinations.find(
    (destination) =>
      destination.id === destinationId
  );

  const canSubmit =
    !readOnly &&
    Boolean(selectedSupplier) &&
    Boolean(selectedDestination) &&
    itemsValid &&
    amountsValid &&
    Number.isFinite(total) &&
    total >= 0;

  // ==========================================
  // ITEM ACTIONS
  // ============================================

  const addProduct = () => {
    if (!selectedProduct || readOnly) return;

    if (items.length >= maxItems) {
      setLocalError(
        `Maximum ${maxItems} products per order.`
      );
      return;
    }

    const key = productKey(
      selectedProduct.id,
      selectedProduct.variantId
    );

    if (items.some((item) => item.key === key)) {
      return;
    }

    setItems((previous) => [
      ...previous,
      {
        key,
        product: selectedProduct,
        quantityInput: "1",
        unitCostInput: String(
          selectedProduct.purchasePrice
        ),
      },
    ]);

    setSelectedProduct(null);
    setLocalError(null);
  };

  const updateItem = (
    key: string,
    field: "quantityInput" | "unitCostInput",
    value: string
  ) => {
    setItems((previous) =>
      previous.map((item) =>
        item.key === key
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const removeItem = (key: string) => {
    setItems((previous) =>
      previous.filter((item) => item.key !== key)
    );
  };

  const resetForm = () => {
    if (readOnly) return;

    setSupplierId("");
    setDestinationId("");
    setSelectedProduct(null);
    setItems([]);
    setDiscountInput("0");
    setTaxInput("0");
    setShippingInput("0");
    setNotes("");
    setLocalError(null);
  };

  // ==========================================
  // SUBMIT
  // ============================================

  const handleSubmit = async (
    action: PurchaseOrderAction
  ) => {
    if (!canSubmit) return;

    setSubmitting(true);
    setLocalError(null);

    try {
      await onSubmit({
        supplierId,
        destinationLocationId: destinationId,

        items: calculatedItems.map((item) => ({
          productId: item.product.id,
          variantId: item.product.variantId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),

        discountAmount: discount,
        taxAmount: tax,
        shippingAmount: shipping,
        notes: notes.trim(),
        action,
        requiresApproval:
          action === "submit" && requireApproval,
      });

      setSupplierId("");
      setDestinationId("");
      setSelectedProduct(null);
      setItems([]);
      setDiscountInput("0");
      setTaxInput("0");
      setShippingInput("0");
      setNotes("");
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save purchase order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // RENDER
  // ============================================

  return (
    <Stack spacing={3}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3,
        }}
      >
        <Stack spacing={3}>
          {/* HEADER */}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              justifyContent: "space-between",
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
              gap: 2,
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "center" }}
            >
              <ShoppingCartOutlined
                color="primary"
                fontSize="large"
              />

              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  Purchase Order Manager
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Create supplier purchase orders
                </Typography>
              </Box>
            </Stack>

            <Chip
              label={
                requireApproval
                  ? "Approval Required"
                  : "New Purchase Order"
              }
              color={
                requireApproval ? "warning" : "primary"
              }
              variant="outlined"
            />
          </Stack>

          {(error || localError) && (
            <Alert severity="error">
              {localError || error}
            </Alert>
          )}

          {!canCreate && (
            <Alert severity="warning">
              You do not have permission to create
              purchase orders.
            </Alert>
          )}

          <Divider />

          {/* ORDER INFORMATION */}

          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700 }}
          >
            Order Information
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            sx={{ gap: 2 }}
          >
            <TextField
              select
              fullWidth
              label="Supplier"
              value={supplierId}
              disabled={readOnly}
              onChange={(event) =>
                setSupplierId(event.target.value)
              }
              required
            >
              {activeSuppliers.map((supplier) => (
                <MenuItem
                  key={supplier.id}
                  value={supplier.id}
                >
                  {supplier.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Receiving Location"
              value={destinationId}
              disabled={readOnly}
              onChange={(event) =>
                setDestinationId(event.target.value)
              }
              required
            >
              {activeDestinations.map((location) => (
                <MenuItem
                  key={location.id}
                  value={location.id}
                >
                  {location.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Divider />

          {/* PRODUCT SELECTION */}

          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700 }}
          >
            Order Items
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              alignItems: "center",
              gap: 2,
            }}
          >
            <Autocomplete
              fullWidth
              options={availableProducts}
              value={selectedProduct}
              disabled={
                readOnly || items.length >= maxItems
              }
              getOptionLabel={(option) =>
                `${productLabel(option)} (${option.sku})`
              }
              isOptionEqualToValue={(option, value) =>
                productKey(
                  option.id,
                  option.variantId
                ) ===
                productKey(
                  value.id,
                  value.variantId
                )
              }
              onChange={(_, value) =>
                setSelectedProduct(value)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Product"
                  placeholder="Name, SKU or barcode"
                />
              )}
              filterOptions={(options, state) => {
                const query =
                  state.inputValue.toLowerCase().trim();

                return options.filter((product) =>
                  [
                    product.name,
                    product.sku,
                    product.barcode ?? "",
                    product.variantName ?? "",
                  ]
                    .join(" ")
                    .toLowerCase()
                    .includes(query)
                );
              }}
            />

            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              disabled={
                readOnly ||
                !selectedProduct ||
                items.length >= maxItems
              }
              onClick={addProduct}
              sx={{ whiteSpace: "nowrap" }}
            >
              Add Product
            </Button>
          </Stack>

          {/* ITEMS */}

          {calculatedItems.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: "center",
                borderStyle: "dashed",
              }}
            >
              <Inventory2Outlined
                sx={{
                  fontSize: 42,
                  color: "text.disabled",
                  mb: 1,
                }}
              />

              <Typography color="text.secondary">
                No products added to the order.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {calculatedItems.map((item) => (
                <Paper
                  key={item.key}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                  }}
                >
                  <Stack spacing={2}>
                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      sx={{
                        justifyContent: "space-between",
                        alignItems: {
                          xs: "flex-start",
                          sm: "center",
                        },
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{ fontWeight: 700 }}
                        >
                          {productLabel(item.product)}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          SKU: {item.product.sku}
                        </Typography>
                      </Box>

                      <IconButton
                        color="error"
                        disabled={readOnly}
                        onClick={() =>
                          removeItem(item.key)
                        }
                      >
                        <DeleteOutlined />
                      </IconButton>
                    </Stack>

                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      sx={{
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Quantity"
                        value={item.quantityInput}
                        disabled={readOnly}
                        error={
                          !Number.isSafeInteger(
                            item.quantity
                          ) ||
                          item.quantity <= 0
                        }
                        onChange={(event) =>
                          updateItem(
                            item.key,
                            "quantityInput",
                            event.target.value
                          )
                        }
                        slotProps={{
                          htmlInput: {
                            min: 1,
                            step: 1,
                          },
                        }}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Unit Cost (Rs.)"
                        value={item.unitCostInput}
                        disabled={readOnly}
                        error={!validMoney(item.unitCost)}
                        onChange={(event) =>
                          updateItem(
                            item.key,
                            "unitCostInput",
                            event.target.value
                          )
                        }
                        slotProps={{
                          htmlInput: {
                            min: 0,
                            step: 0.01,
                          },
                        }}
                      />

                      <Typography
                        sx={{
                          minWidth: 140,
                          textAlign: {
                            xs: "left",
                            sm: "right",
                          },
                          fontWeight: 700,
                        }}
                      >
                        {item.valid
                          ? money(item.lineTotal)
                          : "Invalid amount"}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}

          <Divider />

          {/* COST SUMMARY */}

          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700 }}
          >
            Order Summary
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            sx={{ gap: 2 }}
          >
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Discount (Rs.)"
              value={discountInput}
              disabled={readOnly}
              onChange={(event) =>
                setDiscountInput(event.target.value)
              }
              slotProps={{
                htmlInput: { min: 0, step: 0.01 },
              }}
            />

            <TextField
              fullWidth
              size="small"
              type="number"
              label="Tax (Rs.)"
              value={taxInput}
              disabled={readOnly}
              onChange={(event) =>
                setTaxInput(event.target.value)
              }
              slotProps={{
                htmlInput: { min: 0, step: 0.01 },
              }}
            />

            <TextField
              fullWidth
              size="small"
              type="number"
              label="Shipping (Rs.)"
              value={shippingInput}
              disabled={readOnly}
              onChange={(event) =>
                setShippingInput(event.target.value)
              }
              slotProps={{
                htmlInput: { min: 0, step: 0.01 },
              }}
            />
          </Stack>

          {!amountsValid && (
            <Alert severity="warning">
              Enter valid amounts. Discount cannot
              exceed the subtotal.
            </Alert>
          )}

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: "action.hover",
            }}
          >
            <Stack spacing={1}>
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                }}
              >
                <Typography>Subtotal</Typography>
                <Typography>
                  {money(subtotal)}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                }}
              >
                <Typography>Discount</Typography>
                <Typography>
                  - {money(validMoney(discount) ? discount : 0)}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                }}
              >
                <Typography>Tax</Typography>
                <Typography>
                  {money(validMoney(tax) ? tax : 0)}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                }}
              >
                <Typography>Shipping</Typography>
                <Typography>
                  {money(validMoney(shipping) ? shipping : 0)}
                </Typography>
              </Stack>

              <Divider />

              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                }}
              >
                <Typography sx={{ fontWeight: 700 }}>
                  Grand Total
                </Typography>

                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  {amountsValid && itemsValid
                    ? money(total)
                    : "—"}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          {/* NOTES */}

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Order Notes"
            placeholder="Supplier instructions, expected delivery..."
            value={notes}
            disabled={readOnly}
            onChange={(event) =>
              setNotes(event.target.value)
            }
          />

          {requireApproval && (
            <Alert severity="info">
              Submitted purchase orders require
              approval before being sent to suppliers.
            </Alert>
          )}

          {/* ACTIONS */}

          <Divider />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              disabled={readOnly}
              onClick={resetForm}
            >
              Clear
            </Button>

            <Button
              variant="outlined"
              startIcon={<SaveOutlined />}
              disabled={!canSubmit}
              onClick={() => {
                void handleSubmit("save_draft");
              }}
            >
              Save Draft
            </Button>

            <Button
              variant="contained"
              startIcon={
                submitting ? (
                  <CircularProgress
                    size={18}
                    color="inherit"
                  />
                ) : (
                  <SendOutlined />
                )
              }
              disabled={!canSubmit}
              onClick={() => {
                void handleSubmit("submit");
              }}
            >
              {submitting
                ? "Submitting..."
                : requireApproval
                  ? "Request Approval"
                  : "Submit Order"}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* PURCHASE ORDER HISTORY */}

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3,
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              gap: 1,
            }}
          >
            <LocalShippingOutlined color="primary" />

            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              Purchase Order History
            </Typography>
          </Stack>

          {orders.length === 0 ? (
            <Alert severity="info">
              No purchase orders available.
            </Alert>
          ) : (
            orders.map((order) => (
              <Paper
                key={order.id}
                variant="outlined"
                sx={{ p: 2 }}
              >
                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  sx={{
                    justifyContent: "space-between",
                    alignItems: {
                      xs: "flex-start",
                      sm: "center",
                    },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{ fontWeight: 700 }}
                    >
                      {order.reference}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {order.supplierName}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {new Date(
                        order.createdAt
                      ).toLocaleString()}
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    sx={{
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Chip
                      size="small"
                      label={order.status.replaceAll(
                        "_",
                        " "
                      )}
                      color={statusColor(order.status)}
                    />

                    <Typography
                      sx={{ fontWeight: 700 }}
                    >
                      {money(order.totalAmount)}
                    </Typography>

                    {onViewOrder && (
                      <Button
                        size="small"
                        onClick={() =>
                          onViewOrder(order)
                        }
                      >
                        View
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
