
import { useMemo, useState } from "react";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddOutlined,
  CompareArrowsOutlined,
  DeleteOutlineOutlined,
  RestartAltOutlined,
  SwapHorizOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type ExchangePaymentMethod =
  | "cash"
  | "card"
  | "bank-transfer"
  | "store-credit";

export type ExchangeReturnCondition =
  | "sealed"
  | "opened"
  | "damaged"
  | "defective";

export type ExchangeDisposition =
  | "restock"
  | "quarantine"
  | "write-off"
  | "return-to-supplier";

export type ExchangeReason =
  | "wrong-size"
  | "wrong-item"
  | "damaged"
  | "defective"
  | "customer-request"
  | "other";

export interface ExchangeSaleItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  quantitySold: number;
  quantityPreviouslyReturned: number;
  unitExchangeCredit: number;
}

export interface ExchangeSale {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  soldAt: string;
  items: ExchangeSaleItem[];
}

export interface ExchangeProduct {
  id: string;
  name: string;
  sku?: string;
  price: number;
  availableQuantity: number;
}

export interface ExchangeReturnedItem {
  saleItemId: string;
  productId: string;
  quantity: number;
  unitCredit: number;
  amount: number;
  condition: ExchangeReturnCondition;
  disposition: ExchangeDisposition;
}

export interface ExchangeReplacementItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ExchangePayload {
  saleId: string;
  invoiceNumber: string;
  reason: ExchangeReason;
  notes: string;

  returnedItems: ExchangeReturnedItem[];
  replacementItems: ExchangeReplacementItem[];

  returnedTotal: number;
  replacementTotal: number;
  difference: number;

  settlementType:
    | "additional-payment"
    | "refund"
    | "even";

  paymentMethod?: ExchangePaymentMethod;
}

export interface ExchangeManagerProps {
  sale: ExchangeSale;
  products: ExchangeProduct[];

  canExchange?: boolean;
  requiresApproval?: boolean;
  approvalGranted?: boolean;

  processing?: boolean;
  error?: string | null;

  paymentMethods?: ExchangePaymentMethod[];

  onExchange: (
    payload: ExchangePayload
  ) => void | Promise<void>;
}

interface ReturnDraft {
  quantity: number;
  condition: ExchangeReturnCondition;
  disposition: ExchangeDisposition;
}

interface ReplacementDraft {
  productId: string;
  quantity: number;
}

// ============================================
// HELPERS
// ============================================

const toCents = (value: number): number =>
  Math.round(value * 100);

const fromCents = (value: number): number =>
  value / 100;

const formatMoney = (value: number): string =>
  `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getAllowedDispositions = (
  condition: ExchangeReturnCondition
): ExchangeDisposition[] =>
  condition === "sealed"
    ? ["restock", "quarantine", "return-to-supplier"]
    : ["quarantine", "write-off", "return-to-supplier"];

const defaultDisposition = (
  condition: ExchangeReturnCondition
): ExchangeDisposition =>
  condition === "sealed" ? "restock" : "quarantine";

const defaultReturnDraft = (): ReturnDraft => ({
  quantity: 0,
  condition: "sealed",
  disposition: "restock",
});

// ============================================
// COMPONENT
// ============================================

export default function ExchangeManager({
  sale,
  products,
  canExchange = true,
  requiresApproval = false,
  approvalGranted = false,
  processing = false,
  error = null,
  paymentMethods = [
    "cash",
    "card",
    "bank-transfer",
    "store-credit",
  ],
  onExchange,
}: ExchangeManagerProps) {
  const [returns, setReturns] = useState<
    Record<string, ReturnDraft>
  >({});

  const [replacements, setReplacements] = useState<
    ReplacementDraft[]
  >([]);

  const [selectedProduct, setSelectedProduct] =
    useState<ExchangeProduct | null>(null);

  const [reason, setReason] =
    useState<ExchangeReason>("customer-request");

  const [notes, setNotes] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<ExchangePaymentMethod>("cash");

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] =
    useState<string | null>(null);

  const busy = processing || submitting;

  const availableSaleItems = sale.items.filter(
    (item) =>
      item.quantitySold > item.quantityPreviouslyReturned
  );

  // ==========================================
  // RETURNED ITEMS
  // ============================================

  const returnedItems = useMemo(
    () =>
      availableSaleItems
        .map((item) => {
          const draft =
            returns[item.id] ?? defaultReturnDraft();

          const remaining = Math.max(
            0,
            item.quantitySold -
              item.quantityPreviouslyReturned
          );

          const quantity = Math.min(
            remaining,
            Math.max(0, draft.quantity)
          );

          return {
            saleItemId: item.id,
            productId: item.productId,
            quantity,
            unitCredit: item.unitExchangeCredit,
            amount: fromCents(
              quantity * toCents(item.unitExchangeCredit)
            ),
            condition: draft.condition,
            disposition: draft.disposition,
          };
        })
        .filter((item) => item.quantity > 0),
    [availableSaleItems, returns]
  );

  // ==========================================
  // REPLACEMENT ITEMS
  // ============================================

  const replacementItems = useMemo(
    () =>
      replacements
        .map((entry) => {
          const product = products.find(
            (item) => item.id === entry.productId
          );

          if (!product) return null;

          return {
            productId: product.id,
            quantity: entry.quantity,
            unitPrice: product.price,
            amount: fromCents(
              entry.quantity * toCents(product.price)
            ),
          };
        })
        .filter(
          (item): item is ExchangeReplacementItem =>
            item !== null
        ),
    [replacements, products]
  );

  const returnedCents = returnedItems.reduce(
    (sum, item) => sum + toCents(item.amount),
    0
  );

  const replacementCents = replacementItems.reduce(
    (sum, item) => sum + toCents(item.amount),
    0
  );

  const differenceCents =
    replacementCents - returnedCents;

  const returnedTotal = fromCents(returnedCents);
  const replacementTotal = fromCents(replacementCents);
  const difference = fromCents(differenceCents);

  const settlementType =
    differenceCents > 0
      ? ("additional-payment" as const)
      : differenceCents < 0
        ? ("refund" as const)
        : ("even" as const);

  // ==========================================
  // UPDATE RETURN
  // ============================================

  const updateReturn = (
    itemId: string,
    patch: Partial<ReturnDraft>
  ) => {
    setReturns((previous) => ({
      ...previous,
      [itemId]: {
        ...(previous[itemId] ?? defaultReturnDraft()),
        ...patch,
      },
    }));
    setLocalError(null);
  };

  // ==========================================
  // ADD REPLACEMENT
  // ============================================

  const addReplacement = () => {
    if (!selectedProduct || busy) return;

    const alreadySelected = replacements.find(
      (item) => item.productId === selectedProduct.id
    );

    const nextQuantity =
      (alreadySelected?.quantity ?? 0) + 1;

    if (
      nextQuantity > selectedProduct.availableQuantity
    ) {
      setLocalError(
        "Insufficient stock for this replacement."
      );
      return;
    }

    setReplacements((previous) =>
      alreadySelected
        ? previous.map((item) =>
            item.productId === selectedProduct.id
              ? { ...item, quantity: nextQuantity }
              : item
          )
        : [
            ...previous,
            {
              productId: selectedProduct.id,
              quantity: 1,
            },
          ]
    );

    setSelectedProduct(null);
    setLocalError(null);
  };

  const updateReplacementQuantity = (
    productId: string,
    quantity: number
  ) => {
    const product = products.find(
      (item) => item.id === productId
    );

    if (
      !product ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      return;
    }

    setReplacements((previous) =>
      previous.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.min(
                quantity,
                product.availableQuantity
              ),
            }
          : item
      )
    );
  };

  // ==========================================
  // SUBMIT EXCHANGE
  // ============================================

  const handleExchange = async () => {
    if (busy || !canExchange) return;

    if (requiresApproval && !approvalGranted) {
      setLocalError("Manager approval is required.");
      return;
    }

    if (returnedItems.length === 0) {
      setLocalError(
        "Select at least one returned product."
      );
      return;
    }

    if (replacementItems.length === 0) {
      setLocalError(
        "Select at least one replacement product."
      );
      return;
    }

    if (
      returnedItems.some(
        (item) =>
          !Number.isSafeInteger(item.quantity) ||
          item.quantity <= 0 ||
          !getAllowedDispositions(
            item.condition
          ).includes(item.disposition)
      )
    ) {
      setLocalError("Invalid returned item details.");
      return;
    }

    if (
      replacementItems.some((item) => {
        const product = products.find(
          (entry) => entry.id === item.productId
        );

        return (
          !product ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity <= 0 ||
          item.quantity > product.availableQuantity
        );
      })
    ) {
      setLocalError(
        "Replacement quantities exceed available stock."
      );
      return;
    }

    if (!notes.trim()) {
      setLocalError(
        "Please provide exchange details."
      );
      return;
    }

    if (
      differenceCents !== 0 &&
      !paymentMethods.includes(paymentMethod)
    ) {
      setLocalError("Invalid settlement method.");
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      await onExchange({
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        reason,
        notes: notes.trim(),
        returnedItems,
        replacementItems,
        returnedTotal,
        replacementTotal,
        difference,
        settlementType,
        paymentMethod:
          differenceCents === 0
            ? undefined
            : paymentMethod,
      });

      setReturns({});
      setReplacements([]);
      setSelectedProduct(null);
      setNotes("");
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to process exchange."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // RENDER
  // ============================================

  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, borderRadius: 2 }}
    >
      <Stack spacing={3}>
        {/* HEADER */}

        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={1.5}>
            <SwapHorizOutlined color="primary" />

            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Exchange Manager
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Invoice: {sale.invoiceNumber}
              </Typography>
            </Box>
          </Stack>

          <Chip
            label={`${returnedItems.length} Returned / ${replacementItems.length} Replacements`}
            variant="outlined"
          />
        </Stack>

        {(error || localError) && (
          <Alert severity="error">
            {localError || error}
          </Alert>
        )}

        {requiresApproval && !approvalGranted && (
          <Alert severity="warning">
            Manager approval is required before
            processing this exchange.
          </Alert>
        )}

        <Typography variant="body2">
          <strong>Customer:</strong>{" "}
          {sale.customerName ?? "Walk-in Customer"}
        </Typography>

        <Divider />

        {/* RETURNED PRODUCTS */}

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700 }}
        >
          1. Select Returned Products
        </Typography>

        {availableSaleItems.length === 0 ? (
          <Alert severity="info">
            No returnable products remain.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {availableSaleItems.map((item) => {
              const remaining =
                item.quantitySold -
                item.quantityPreviouslyReturned;

              const draft =
                returns[item.id] ?? defaultReturnDraft();

              return (
                <Paper
                  key={item.id}
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Stack spacing={2}>
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent:
                          "space-between",
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{ fontWeight: 700 }}
                        >
                          {item.productName}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {item.sku ?? "No SKU"} ·
                          Available to return:{" "}
                          {remaining}
                        </Typography>
                      </Box>

                      <Typography>
                        {formatMoney(
                          item.unitExchangeCredit
                        )}
                      </Typography>
                    </Stack>

                    <TextField
                      label="Return Quantity"
                      type="number"
                      size="small"
                      value={draft.quantity}
                      disabled={busy || !canExchange}
                      onChange={(event) => {
                        const quantity = Number(
                          event.target.value
                        );

                        if (
                          Number.isSafeInteger(quantity) &&
                          quantity >= 0
                        ) {
                          updateReturn(item.id, {
                            quantity: Math.min(
                              quantity,
                              remaining
                            ),
                          });
                        }
                      }}
                      slotProps={{
                        htmlInput: {
                          min: 0,
                          max: remaining,
                          step: 1,
                        },
                      }}
                    />

                    {draft.quantity > 0 && (
                      <>
                        <TextField
                          select
                          label="Condition"
                          value={draft.condition}
                          disabled={busy || !canExchange}
                          onChange={(event) => {
                            const condition =
                              event.target.value as
                                ExchangeReturnCondition;

                            updateReturn(item.id, {
                              condition,
                              disposition:
                                defaultDisposition(
                                  condition
                                ),
                            });
                          }}
                        >
                          <MenuItem value="sealed">
                            Sealed
                          </MenuItem>
                          <MenuItem value="opened">
                            Opened
                          </MenuItem>
                          <MenuItem value="damaged">
                            Damaged
                          </MenuItem>
                          <MenuItem value="defective">
                            Defective
                          </MenuItem>
                        </TextField>

                        <TextField
                          select
                          label="Inventory Disposition"
                          value={draft.disposition}
                          disabled={busy || !canExchange}
                          onChange={(event) =>
                            updateReturn(item.id, {
                              disposition:
                                event.target.value as
                                  ExchangeDisposition,
                            })
                          }
                        >
                          {getAllowedDispositions(
                            draft.condition
                          ).map((option) => (
                            <MenuItem
                              key={option}
                              value={option}
                            >
                              {option.replace(
                                /-/g,
                                " "
                              )}
                            </MenuItem>
                          ))}
                        </TextField>
                      </>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}

        <Divider />

        {/* REPLACEMENT PRODUCTS */}

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700 }}
        >
          2. Select Replacement Products
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ gap: 2 }}
        >
          <Autocomplete
            options={products.filter(
              (product) =>
                product.availableQuantity > 0
            )}
            value={selectedProduct}
            onChange={(_, value) =>
              setSelectedProduct(value)
            }
            getOptionLabel={(option) =>
              `${option.name} (${option.sku ?? option.id})`
            }
            isOptionEqualToValue={(option, value) =>
              option.id === value.id
            }
            disabled={busy || !canExchange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Replacement Product"
                size="small"
              />
            )}
            sx={{ flex: 1 }}
          />

          <Button
            variant="outlined"
            startIcon={<AddOutlined />}
            disabled={
              busy ||
              !canExchange ||
              !selectedProduct
            }
            onClick={addReplacement}
          >
            Add Product
          </Button>
        </Stack>

        {replacements.map((entry) => {
          const product = products.find(
            (item) => item.id === entry.productId
          );

          if (!product) return null;

          return (
            <Paper
              key={entry.productId}
              variant="outlined"
              sx={{ p: 2 }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                sx={{
                  justifyContent: "space-between",
                  alignItems: {
                    xs: "stretch",
                    sm: "center",
                  },
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{ fontWeight: 700 }}
                  >
                    {product.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {formatMoney(product.price)} ·
                    Available:{" "}
                    {product.availableQuantity}
                  </Typography>
                </Box>

                <TextField
                  type="number"
                  label="Quantity"
                  size="small"
                  value={entry.quantity}
                  disabled={busy || !canExchange}
                  onChange={(event) =>
                    updateReplacementQuantity(
                      product.id,
                      Number(event.target.value)
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 1,
                      max: product.availableQuantity,
                      step: 1,
                    },
                  }}
                  sx={{ width: 120 }}
                />

                <Button
                  color="error"
                  disabled={busy || !canExchange}
                  startIcon={<DeleteOutlineOutlined />}
                  onClick={() =>
                    setReplacements((previous) =>
                      previous.filter(
                        (item) =>
                          item.productId !== product.id
                      )
                    )
                  }
                >
                  Remove
                </Button>
              </Stack>
            </Paper>
          );
        })}

        <Divider />

        {/* REASON */}

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700 }}
        >
          3. Exchange Details
        </Typography>

        <TextField
          select
          label="Exchange Reason"
          value={reason}
          disabled={busy || !canExchange}
          onChange={(event) =>
            setReason(
              event.target.value as ExchangeReason
            )
          }
        >
          <MenuItem value="wrong-size">
            Wrong Size
          </MenuItem>
          <MenuItem value="wrong-item">
            Wrong Item
          </MenuItem>
          <MenuItem value="damaged">
            Damaged Product
          </MenuItem>
          <MenuItem value="defective">
            Defective Product
          </MenuItem>
          <MenuItem value="customer-request">
            Customer Request
          </MenuItem>
          <MenuItem value="other">
            Other
          </MenuItem>
        </TextField>

        <TextField
          label="Exchange Notes"
          multiline
          minRows={2}
          required
          value={notes}
          disabled={busy || !canExchange}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          placeholder="Describe the exchange..."
        />

        {/* SETTLEMENT */}

        {differenceCents !== 0 && (
          <TextField
            select
            label={
              differenceCents > 0
                ? "Additional Payment Method"
                : "Refund Method"
            }
            value={paymentMethod}
            disabled={busy || !canExchange}
            onChange={(event) =>
              setPaymentMethod(
                event.target.value as
                  ExchangePaymentMethod
              )
            }
          >
            {paymentMethods.map((method) => (
              <MenuItem key={method} value={method}>
                {method.replace(/-/g, " ")}
              </MenuItem>
            ))}
          </TextField>
        )}

        <Divider />

        {/* SUMMARY */}

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            bgcolor: "action.hover",
          }}
        >
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
              }}
            >
              <Typography>
                Returned Product Value
              </Typography>

              <Typography>
                {formatMoney(returnedTotal)}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
              }}
            >
              <Typography>
                Replacement Product Value
              </Typography>

              <Typography>
                {formatMoney(replacementTotal)}
              </Typography>
            </Stack>

            <Divider />

            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography
                  sx={{ fontWeight: 700 }}
                >
                  {differenceCents > 0
                    ? "Customer Pays"
                    : differenceCents < 0
                      ? "Refund to Customer"
                      : "Even Exchange"}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Replacement minus return value
                </Typography>
              </Box>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color:
                    differenceCents > 0
                      ? "warning.main"
                      : differenceCents < 0
                        ? "info.main"
                        : "success.main",
                }}
              >
                {formatMoney(
                  Math.abs(difference)
                )}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* ACTIONS */}

        <Stack
          direction="row"
          sx={{
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<RestartAltOutlined />}
            disabled={busy}
            onClick={() => {
              setReturns({});
              setReplacements([]);
              setSelectedProduct(null);
              setNotes("");
              setLocalError(null);
            }}
          >
            Reset
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
                <CompareArrowsOutlined />
              )
            }
            disabled={
              busy ||
              !canExchange ||
              returnedItems.length === 0 ||
              replacementItems.length === 0 ||
              (requiresApproval && !approvalGranted)
            }
            onClick={() => {
              void handleExchange();
            }}
          >
            {submitting
              ? "Processing..."
              : "Process Exchange"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
