
import { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AssignmentReturnOutlined,
  CheckCircleOutlineOutlined,
  PaymentsOutlined,
  RestartAltOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type RefundPaymentMethod =
  | "cash"
  | "card"
  | "bank-transfer"
  | "store-credit";

export type RefundType = "full" | "partial";

export type RefundReason =
  | "damaged"
  | "wrong-item"
  | "customer-request"
  | "quality-issue"
  | "other";

export type RefundCashTrackingMode =
  | "standard"
  | "advanced";

export interface RefundSaleItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;

  quantitySold: number;
  quantityRefunded: number;

  unitRefundableAmount: number;
}

export interface RefundSale {
  id: string;
  invoiceNumber: string;
  soldAt: string;

  customerName?: string;
  cashierName?: string;

  paymentMethods: RefundPaymentMethod[];
  items: RefundSaleItem[];
}

export interface RefundDenomination {
  value: number;
  type: "note" | "coin";
  quantity: number;
  total: number;
}

export interface RefundItemPayload {
  saleItemId: string;
  productId: string;
  quantity: number;
  amount: number;
}

export interface RefundPayload {
  saleId: string;
  invoiceNumber: string;

  refundType: RefundType;
  paymentMethod: RefundPaymentMethod;
  reason: RefundReason;
  notes: string;

  items: RefundItemPayload[];
  totalAmount: number;

  denominations?: RefundDenomination[];
}

export interface RefundManagerProps {
  sale: RefundSale;

  trackingMode?: RefundCashTrackingMode;
  denominations?: Array<{
    value: number;
    type: "note" | "coin";
  }>;

  canRefund?: boolean;
  requiresApproval?: boolean;
  approvalGranted?: boolean;

  processing?: boolean;
  error?: string | null;

  onRefund: (
    payload: RefundPayload
  ) => void | Promise<void>;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_DENOMINATIONS = [
  { value: 5000, type: "note" as const },
  { value: 2000, type: "note" as const },
  { value: 1000, type: "note" as const },
  { value: 500, type: "note" as const },
  { value: 100, type: "note" as const },
  { value: 50, type: "note" as const },
  { value: 20, type: "note" as const },
  { value: 10, type: "coin" as const },
  { value: 5, type: "coin" as const },
  { value: 2, type: "coin" as const },
  { value: 1, type: "coin" as const },
];

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const formatMoney = (value: number) =>
  `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const denominationKey = (item: {
  value: number;
  type: "note" | "coin";
}) => `${item.type}-${item.value}`;

// ============================================
// COMPONENT
// ============================================

export default function RefundManager({
  sale,
  trackingMode = "standard",
  denominations = DEFAULT_DENOMINATIONS,
  canRefund = true,
  requiresApproval = false,
  approvalGranted = false,
  processing = false,
  error = null,
  onRefund,
}: RefundManagerProps) {
  const [refundType, setRefundType] =
    useState<RefundType>("partial");

  const [selectedQuantities, setSelectedQuantities] =
    useState<Record<string, number>>({});

  const [paymentMethod, setPaymentMethod] =
    useState<RefundPaymentMethod>(
      sale.paymentMethods[0] ?? "cash"
    );

  const [reason, setReason] =
    useState<RefundReason>("customer-request");

  const [notes, setNotes] = useState("");

  const [denominationCounts, setDenominationCounts] =
    useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] =
    useState<string | null>(null);

  const busy = processing || submitting;

  // ==========================================
  // REFUNDABLE QUANTITIES
  // ==========================================

  const remainingQuantity = (item: RefundSaleItem) =>
    Math.max(
      0,
      item.quantitySold - item.quantityRefunded
    );

  const refundableItems = useMemo(
    () =>
      sale.items.filter(
        (item) =>
          item.quantitySold > item.quantityRefunded
      ),
    [sale.items]
  );

  const selectedItems = useMemo(() => {
    return refundableItems
      .map((item) => {
        const remaining = remainingQuantity(item);

        const quantity =
          refundType === "full"
            ? remaining
            : Math.min(
                selectedQuantities[item.id] ?? 0,
                remaining
              );

        return {
          item,
          quantity,
          amount: roundMoney(
            quantity * item.unitRefundableAmount
          ),
        };
      })
      .filter((entry) => entry.quantity > 0);
  }, [
    refundableItems,
    refundType,
    selectedQuantities,
  ]);

  const totalRefund = roundMoney(
    selectedItems.reduce(
      (sum, entry) => sum + entry.amount,
      0
    )
  );

  // ==========================================
  // DENOMINATIONS
  // ==========================================

  const denominationLines = denominations.map(
    (item) => {
      const key = denominationKey(item);
      const quantity = Number(
        denominationCounts[key] || 0
      );

      return {
        ...item,
        quantity,
        total: roundMoney(item.value * quantity),
      };
    }
  );

  const denominationTotal = roundMoney(
    denominationLines.reduce(
      (sum, line) => sum + line.total,
      0
    )
  );

  const needsDenominations =
    trackingMode === "advanced" &&
    paymentMethod === "cash";

  // ==========================================
  // QUANTITY CHANGE
  // ==========================================

  const updateQuantity = (
    item: RefundSaleItem,
    value: number
  ) => {
    if (
      !Number.isSafeInteger(value) ||
      value < 0
    ) {
      return;
    }

    setSelectedQuantities((previous) => ({
      ...previous,
      [item.id]: Math.min(
        value,
        remainingQuantity(item)
      ),
    }));
  };

  // ==========================================
  // SUBMIT REFUND
  // ==========================================

  const handleRefund = async () => {
    if (busy || !canRefund) return;

    if (requiresApproval && !approvalGranted) {
      setLocalError(
        "Manager approval is required."
      );
      return;
    }

    if (selectedItems.length === 0 || totalRefund <= 0) {
      setLocalError(
        "Select at least one refundable item."
      );
      return;
    }

    if (!sale.paymentMethods.includes(paymentMethod)) {
      setLocalError(
        "Selected refund method is not available for this sale."
      );
      return;
    }

    if (!notes.trim()) {
      setLocalError(
        "Please provide refund details."
      );
      return;
    }

    if (needsDenominations) {
      const validQuantities = denominationLines.every(
        (line) =>
          Number.isSafeInteger(line.quantity) &&
          line.quantity >= 0
      );

      if (
        !validQuantities ||
        Math.abs(
          denominationTotal - totalRefund
        ) > 0.001
      ) {
        setLocalError(
          "Cash denomination total must match the refund amount."
        );
        return;
      }
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      await onRefund({
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        refundType,
        paymentMethod,
        reason,
        notes: notes.trim(),
        items: selectedItems.map((entry) => ({
          saleItemId: entry.item.id,
          productId: entry.item.productId,
          quantity: entry.quantity,
          amount: entry.amount,
        })),
        totalAmount: totalRefund,
        denominations: needsDenominations
          ? denominationLines.filter(
              (line) => line.quantity > 0
            )
          : undefined,
      });

      setSelectedQuantities({});
      setDenominationCounts({});
      setNotes("");
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to process refund."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

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
            <AssignmentReturnOutlined color="primary" />

            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Refund Manager
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
            label={
              trackingMode === "advanced"
                ? "Advanced Cash Tracking"
                : "Standard Cash Tracking"
            }
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
            processing this refund.
          </Alert>
        )}

        {/* SALE DETAILS */}

        <Stack spacing={0.5}>
          <Typography>
            <strong>Invoice:</strong>{" "}
            {sale.invoiceNumber}
          </Typography>

          <Typography>
            <strong>Customer:</strong>{" "}
            {sale.customerName ?? "Walk-in Customer"}
          </Typography>

          <Typography>
            <strong>Cashier:</strong>{" "}
            {sale.cashierName ?? "Not available"}
          </Typography>
        </Stack>

        <Divider />

        {/* REFUND TYPE */}

        <TextField
          select
          fullWidth
          label="Refund Type"
          value={refundType}
          disabled={busy}
          onChange={(event) =>
            setRefundType(
              event.target.value as RefundType
            )
          }
        >
          <MenuItem value="partial">
            Partial Refund
          </MenuItem>
          <MenuItem value="full">
            Full Remaining Refund
          </MenuItem>
        </TextField>

        {/* ITEMS */}

        <Stack spacing={2}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700 }}
          >
            Refundable Items
          </Typography>

          {refundableItems.length === 0 ? (
            <Alert severity="info">
              No refundable items remain.
            </Alert>
          ) : (
            refundableItems.map((item) => {
              const remaining =
                remainingQuantity(item);

              const quantity =
                refundType === "full"
                  ? remaining
                  : selectedQuantities[item.id] ?? 0;

              return (
                <Paper
                  key={item.id}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2 }}
                >
                  <Stack spacing={2}>
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{ fontWeight: 600 }}
                        >
                          {item.productName}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          SKU: {item.sku ?? "N/A"}
                        </Typography>
                      </Box>

                      <Typography
                        sx={{ fontWeight: 700 }}
                      >
                        {formatMoney(
                          item.unitRefundableAmount
                        )}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Sold: {item.quantitySold} ·
                      Previously Refunded:{" "}
                      {item.quantityRefunded} ·
                      Available: {remaining}
                    </Typography>

                    {refundType === "partial" ? (
                      <Stack
                        direction="row"
                        sx={{
                          alignItems: "center",
                          justifyContent:
                            "space-between",
                          gap: 2,
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={quantity > 0}
                              disabled={busy}
                              onChange={(event) =>
                                updateQuantity(
                                  item,
                                  event.target.checked
                                    ? 1
                                    : 0
                                )
                              }
                            />
                          }
                          label="Refund"
                        />

                        <TextField
                          type="number"
                          size="small"
                          label="Quantity"
                          value={quantity}
                          disabled={busy}
                          onChange={(event) =>
                            updateQuantity(
                              item,
                              Number(
                                event.target.value
                              )
                            )
                          }
                          slotProps={{
                            htmlInput: {
                              min: 0,
                              max: remaining,
                              step: 1,
                            },
                          }}
                          sx={{ width: 120 }}
                        />
                      </Stack>
                    ) : (
                      <Chip
                        label={`Refund ${remaining} item(s)`}
                        color="primary"
                        size="small"
                        sx={{
                          alignSelf: "flex-start",
                        }}
                      />
                    )}
                  </Stack>
                </Paper>
              );
            })
          )}
        </Stack>

        <Divider />

        {/* PAYMENT METHOD */}

        <TextField
          select
          label="Refund Payment Method"
          value={paymentMethod}
          disabled={busy}
          onChange={(event) =>
            setPaymentMethod(
              event.target.value as RefundPaymentMethod
            )
          }
        >
          {sale.paymentMethods.map((method) => (
            <MenuItem key={method} value={method}>
              {method
                .replace("-", " ")
                .replace(/\b\w/g, (letter) =>
                  letter.toUpperCase()
                )}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Refund Reason"
          value={reason}
          disabled={busy}
          onChange={(event) =>
            setReason(
              event.target.value as RefundReason
            )
          }
        >
          <MenuItem value="damaged">
            Damaged Product
          </MenuItem>
          <MenuItem value="wrong-item">
            Wrong Item
          </MenuItem>
          <MenuItem value="customer-request">
            Customer Request
          </MenuItem>
          <MenuItem value="quality-issue">
            Quality Issue
          </MenuItem>
          <MenuItem value="other">
            Other
          </MenuItem>
        </TextField>

        <TextField
          label="Refund Notes"
          multiline
          minRows={2}
          required
          disabled={busy}
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          placeholder="Explain why the refund is being issued..."
        />

        {/* ADVANCED CASH DENOMINATIONS */}

        {needsDenominations && (
          <Stack spacing={2}>
            <Divider />

            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700 }}
            >
              Cash Refund Denominations
            </Typography>

            <Alert severity="info">
              Record the exact notes and coins
              handed to the customer.
            </Alert>

            {denominations.map((item) => {
              const key = denominationKey(item);

              return (
                <Stack
                  key={key}
                  direction="row"
                  sx={{
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Typography>
                    {formatMoney(item.value)}
                  </Typography>

                  <TextField
                    type="number"
                    size="small"
                    value={
                      denominationCounts[key] ?? ""
                    }
                    disabled={busy}
                    onChange={(event) => {
                      const value =
                        event.target.value;

                      if (
                        value !== "" &&
                        !/^\d+$/.test(value)
                      ) {
                        return;
                      }

                      setDenominationCounts(
                        (previous) => ({
                          ...previous,
                          [key]: value,
                        })
                      );
                    }}
                    slotProps={{
                      htmlInput: {
                        min: 0,
                        step: 1,
                      },
                    }}
                    sx={{ width: 110 }}
                  />
                </Stack>
              );
            })}

            <Typography
              sx={{ fontWeight: 700 }}
            >
              Denomination Total:{" "}
              {formatMoney(denominationTotal)}
            </Typography>
          </Stack>
        )}

        <Divider />

        {/* REFUND SUMMARY */}

        <Box
          sx={{
            p: 2,
            bgcolor: "action.hover",
            borderRadius: 2,
          }}
        >
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Stack direction="row" spacing={1}>
              <PaymentsOutlined color="primary" />

              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700 }}
              >
                Total Refund
              </Typography>
            </Stack>

            <Typography
              variant="h5"
              sx={{ fontWeight: 700 }}
            >
              {formatMoney(totalRefund)}
            </Typography>
          </Stack>
        </Box>

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
              setSelectedQuantities({});
              setDenominationCounts({});
              setNotes("");
              setLocalError(null);
            }}
          >
            Reset
          </Button>

          <Button
            variant="contained"
            color="warning"
            startIcon={
              submitting ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <CheckCircleOutlineOutlined />
              )
            }
            disabled={
              busy ||
              !canRefund ||
              refundableItems.length === 0 ||
              (requiresApproval && !approvalGranted)
            }
            onClick={() => {
              void handleRefund();
            }}
          >
            {submitting
              ? "Processing..."
              : "Process Refund"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
