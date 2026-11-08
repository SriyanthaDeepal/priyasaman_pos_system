
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
  RestartAltOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type ReturnItemCondition =
  | "sealed"
  | "opened"
  | "damaged"
  | "defective";

export type ReturnInventoryDisposition =
  | "restock"
  | "quarantine"
  | "write-off"
  | "return-to-supplier";

export type ReturnItemReason =
  | "wrong-item"
  | "damaged"
  | "defective"
  | "customer-request"
  | "other";

export interface ReturnSaleItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;

  quantitySold: number;
  quantityPreviouslyReturned: number;

  unitRefundableAmount: number;
}

export interface ReturnSale {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  items: ReturnSaleItem[];
}

export interface ReturnItemSelection {
  saleItemId: string;
  productId: string;

  quantity: number;
  condition: ReturnItemCondition;
  disposition: ReturnInventoryDisposition;
  reason: ReturnItemReason;

  notes: string;
  estimatedRefundAmount: number;
}

export interface ReturnSelectionPayload {
  saleId: string;
  invoiceNumber: string;

  items: ReturnItemSelection[];

  totalQuantity: number;
  estimatedRefundTotal: number;
}

export interface ReturnItemSelectorProps {
  sale: ReturnSale;

  canSelectReturns?: boolean;
  processing?: boolean;
  error?: string | null;

  onConfirm: (
    payload: ReturnSelectionPayload
  ) => void | Promise<void>;
}

interface ReturnDraft {
  quantity: number;
  condition: ReturnItemCondition;
  disposition: ReturnInventoryDisposition;
  reason: ReturnItemReason;
  notes: string;
}

// ============================================
// HELPERS
// ============================================

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const formatMoney = (value: number): string =>
  `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const createDefaultDraft = (): ReturnDraft => ({
  quantity: 0,
  condition: "sealed",
  disposition: "restock",
  reason: "customer-request",
  notes: "",
});

const allowedDispositions = (
  condition: ReturnItemCondition
): ReturnInventoryDisposition[] => {
  if (condition === "sealed") {
    return [
      "restock",
      "quarantine",
      "return-to-supplier",
    ];
  }

  if (condition === "opened") {
    return [
      "quarantine",
      "return-to-supplier",
      "write-off",
    ];
  }

  return [
    "quarantine",
    "write-off",
    "return-to-supplier",
  ];
};

const defaultDisposition = (
  condition: ReturnItemCondition
): ReturnInventoryDisposition =>
  condition === "sealed" ? "restock" : "quarantine";

// ============================================
// COMPONENT
// ============================================

export default function ReturnItemSelector({
  sale,
  canSelectReturns = true,
  processing = false,
  error = null,
  onConfirm,
}: ReturnItemSelectorProps) {
  const [drafts, setDrafts] = useState<
    Record<string, ReturnDraft>
  >({});

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] =
    useState<string | null>(null);

  const busy = processing || submitting;

  // ==========================================
  // RETURNABLE ITEMS
  // ============================================

  const returnableItems = useMemo(
    () =>
      sale.items.filter(
        (item) =>
          item.quantitySold >
          item.quantityPreviouslyReturned
      ),
    [sale.items]
  );

  const getRemaining = (item: ReturnSaleItem) =>
    Math.max(
      0,
      item.quantitySold -
        item.quantityPreviouslyReturned
    );

  const getDraft = (id: string): ReturnDraft =>
    drafts[id] ?? createDefaultDraft();

  const updateDraft = (
    id: string,
    patch: Partial<ReturnDraft>
  ) => {
    setDrafts((previous) => ({
      ...previous,
      [id]: {
        ...(previous[id] ?? createDefaultDraft()),
        ...patch,
      },
    }));

    setLocalError(null);
  };

  // ==========================================
  // SELECTION SUMMARY
  // ============================================

  const selectedItems = useMemo(() => {
    return returnableItems
      .map((item) => {
        const draft =
          drafts[item.id] ?? createDefaultDraft();

        const quantity = Math.min(
          Math.max(0, draft.quantity),
          Math.max(
            0,
            item.quantitySold -
              item.quantityPreviouslyReturned
          )
        );

        return {
          saleItemId: item.id,
          productId: item.productId,
          quantity,
          condition: draft.condition,
          disposition: draft.disposition,
          reason: draft.reason,
          notes: draft.notes.trim(),
          estimatedRefundAmount: roundMoney(
            quantity * item.unitRefundableAmount
          ),
        };
      })
      .filter((item) => item.quantity > 0);
  }, [returnableItems, drafts]);

  const totalQuantity = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const estimatedRefundTotal = roundMoney(
    selectedItems.reduce(
      (sum, item) =>
        sum + item.estimatedRefundAmount,
      0
    )
  );

  // ==========================================
  // VALIDATION
  // ============================================

  const handleConfirm = async () => {
    if (busy || !canSelectReturns) return;

    if (selectedItems.length === 0) {
      setLocalError(
        "Select at least one product to return."
      );
      return;
    }

    for (const selection of selectedItems) {
      const original = sale.items.find(
        (item) =>
          item.id === selection.saleItemId
      );

      if (!original) {
        setLocalError("Invalid return item.");
        return;
      }

      if (
        !Number.isSafeInteger(selection.quantity) ||
        selection.quantity <= 0 ||
        selection.quantity > getRemaining(original)
      ) {
        setLocalError(
          `Invalid return quantity for ${original.productName}.`
        );
        return;
      }

      if (
        !allowedDispositions(
          selection.condition
        ).includes(selection.disposition)
      ) {
        setLocalError(
          `Invalid inventory disposition for ${original.productName}.`
        );
        return;
      }

      if (
        selection.reason === "other" &&
        !selection.notes
      ) {
        setLocalError(
          `Please provide a reason for ${original.productName}.`
        );
        return;
      }
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      await onConfirm({
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        items: selectedItems,
        totalQuantity,
        estimatedRefundTotal,
      });

      setDrafts({});
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to confirm returned items."
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
            <AssignmentReturnOutlined color="primary" />

            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Return Item Selector
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
            label={`${selectedItems.length} Selected`}
            color="primary"
            variant="outlined"
          />
        </Stack>

        {(error || localError) && (
          <Alert severity="error">
            {localError || error}
          </Alert>
        )}

        <Alert severity="info">
          Select the returned products and record
          their physical condition. Inventory
          disposition is a proposed action and
          should be validated by the backend.
        </Alert>

        {/* SALE DETAILS */}

        <Typography variant="body2">
          <strong>Customer:</strong>{" "}
          {sale.customerName ?? "Walk-in Customer"}
        </Typography>

        <Divider />

        {/* PRODUCTS */}

        {returnableItems.length === 0 ? (
          <Alert severity="warning">
            No returnable quantities remain
            for this sale.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {returnableItems.map((item) => {
              const remaining = getRemaining(item);
              const draft = getDraft(item.id);
              const selected = draft.quantity > 0;

              return (
                <Paper
                  key={item.id}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2 }}
                >
                  <Stack spacing={2}>
                    {/* PRODUCT DETAILS */}

                    <Stack
                      direction="row"
                      sx={{
                        justifyContent:
                          "space-between",
                        alignItems: "flex-start",
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
                      Previously Returned:{" "}
                      {item.quantityPreviouslyReturned} ·
                      Available: {remaining}
                    </Typography>

                    {/* SELECTION */}

                    <Stack
                      direction="row"
                      sx={{
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selected}
                            disabled={
                              busy || !canSelectReturns
                            }
                            onChange={(event) =>
                              updateDraft(item.id, {
                                quantity:
                                  event.target.checked
                                    ? 1
                                    : 0,
                              })
                            }
                          />
                        }
                        label="Return Item"
                      />

                      <TextField
                        label="Quantity"
                        type="number"
                        size="small"
                        value={draft.quantity}
                        disabled={
                          busy || !canSelectReturns
                        }
                        onChange={(event) => {
                          const value = Number(
                            event.target.value
                          );

                          if (
                            !Number.isSafeInteger(value) ||
                            value < 0
                          ) {
                            return;
                          }

                          updateDraft(item.id, {
                            quantity: Math.min(
                              value,
                              remaining
                            ),
                          });
                        }}
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

                    {/* CONDITION AND DISPOSITION */}

                    {selected && (
                      <Stack spacing={2}>
                        <Divider />

                        <TextField
                          select
                          label="Product Condition"
                          value={draft.condition}
                          disabled={
                            busy || !canSelectReturns
                          }
                          onChange={(event) => {
                            const condition =
                              event.target.value as
                                ReturnItemCondition;

                            updateDraft(item.id, {
                              condition,
                              disposition:
                                defaultDisposition(
                                  condition
                                ),
                            });
                          }}
                        >
                          <MenuItem value="sealed">
                            Sealed / Unopened
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
                          disabled={
                            busy || !canSelectReturns
                          }
                          onChange={(event) =>
                            updateDraft(item.id, {
                              disposition:
                                event.target.value as
                                  ReturnInventoryDisposition,
                            })
                          }
                        >
                          {allowedDispositions(
                            draft.condition
                          ).map((option) => (
                            <MenuItem
                              key={option}
                              value={option}
                            >
                              {option
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, (letter) =>
                                  letter.toUpperCase()
                                )}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          select
                          label="Return Reason"
                          value={draft.reason}
                          disabled={
                            busy || !canSelectReturns
                          }
                          onChange={(event) =>
                            updateDraft(item.id, {
                              reason:
                                event.target.value as
                                  ReturnItemReason,
                            })
                          }
                        >
                          <MenuItem value="wrong-item">
                            Wrong Item
                          </MenuItem>
                          <MenuItem value="damaged">
                            Damaged
                          </MenuItem>
                          <MenuItem value="defective">
                            Defective
                          </MenuItem>
                          <MenuItem value="customer-request">
                            Customer Request
                          </MenuItem>
                          <MenuItem value="other">
                            Other
                          </MenuItem>
                        </TextField>

                        <TextField
                          label="Notes"
                          multiline
                          minRows={2}
                          value={draft.notes}
                          disabled={
                            busy || !canSelectReturns
                          }
                          onChange={(event) =>
                            updateDraft(item.id, {
                              notes: event.target.value,
                            })
                          }
                          placeholder="Additional information about this return..."
                        />

                        <Typography
                          variant="body2"
                          sx={{
                            textAlign: "right",
                            fontWeight: 700,
                          }}
                        >
                          Estimated Refund:{" "}
                          {formatMoney(
                            roundMoney(
                              draft.quantity *
                                item.unitRefundableAmount
                            )
                          )}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}

        <Divider />

        {/* SUMMARY */}

        <Box
          sx={{
            p: 2,
            bgcolor: "action.hover",
            borderRadius: 2,
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
                Selected Products
              </Typography>

              <Typography sx={{ fontWeight: 700 }}>
                {selectedItems.length}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
              }}
            >
              <Typography>
                Total Return Quantity
              </Typography>

              <Typography sx={{ fontWeight: 700 }}>
                {totalQuantity}
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
                Estimated Refund Value
              </Typography>

              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                {formatMoney(estimatedRefundTotal)}
              </Typography>
            </Stack>
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
            disabled={busy || !canSelectReturns}
            onClick={() => {
              setDrafts({});
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
                <CheckCircleOutlineOutlined />
              )
            }
            disabled={
              busy ||
              !canSelectReturns ||
              selectedItems.length === 0
            }
            onClick={() => {
              void handleConfirm();
            }}
          >
            {submitting
              ? "Confirming..."
              : "Confirm Return Selection"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
