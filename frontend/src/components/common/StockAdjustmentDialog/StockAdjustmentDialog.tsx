
import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddCircleOutlineOutlined,
  Inventory2Outlined,
  RemoveCircleOutlineOutlined,
  FactCheckOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type StockAdjustmentMode =
  | "increase"
  | "decrease"
  | "set";

export type StockAdjustmentReason =
  | "damage"
  | "expired"
  | "lost"
  | "found"
  | "stock_count"
  | "correction"
  | "other";

export interface StockAdjustmentProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;

  variantId?: string;
  variantName?: string;

  storeId: string;
  storeName?: string;

  currentQuantity: number;
  version?: number;
}

export interface StockAdjustmentPayload {
  productId: string;
  variantId?: string;
  storeId: string;

  mode: StockAdjustmentMode;
  reason: StockAdjustmentReason;

  quantity: number;
  previousQuantity: number;
  adjustmentQuantity: number;
  resultingQuantity: number;

  notes: string;
  requiresApproval: boolean;

  expectedVersion?: number;
}

export interface StockAdjustmentDialogProps {
  open: boolean;
  product: StockAdjustmentProduct | null;

  onClose: () => void;

  onSubmit: (
    payload: StockAdjustmentPayload
  ) => void | Promise<void>;

  canAdjust?: boolean;
  requireApproval?: boolean;
  approvalThreshold?: number;

  processing?: boolean;
  error?: string | null;
}

// ============================================
// CONSTANTS
// ============================================

const REASONS: {
  value: StockAdjustmentReason;
  label: string;
}[] = [
  { value: "damage", label: "Damaged Goods" },
  { value: "expired", label: "Expired Goods" },
  { value: "lost", label: "Lost / Missing Stock" },
  { value: "found", label: "Found Stock" },
  { value: "stock_count", label: "Physical Stock Count" },
  { value: "correction", label: "Inventory Correction" },
  { value: "other", label: "Other" },
];

// ============================================
// COMPONENT
// ============================================

export default function StockAdjustmentDialog({
  open,
  product,
  onClose,
  onSubmit,
  canAdjust = true,
  requireApproval = false,
  approvalThreshold = 10,
  processing = false,
  error = null,
}: StockAdjustmentDialogProps) {
  const [mode, setMode] =
    useState<StockAdjustmentMode>("decrease");

  const [reason, setReason] =
    useState<StockAdjustmentReason>("damage");

  const [quantityInput, setQuantityInput] =
    useState("1");

  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [localError, setLocalError] =
    useState<string | null>(null);

  const busy = processing || submitting;

  // ==========================================
  // CALCULATIONS
  // ============================================

  const currentQuantity =
    product?.currentQuantity ?? 0;

  const parsedQuantity = Number(quantityInput);

  const validQuantity =
    quantityInput.trim() !== "" &&
    Number.isSafeInteger(parsedQuantity) &&
    parsedQuantity >= 0;

  const adjustmentQuantity = validQuantity
    ? mode === "increase"
      ? parsedQuantity
      : mode === "decrease"
        ? -parsedQuantity
        : parsedQuantity - currentQuantity
    : 0;

  const resultingQuantity =
    currentQuantity + adjustmentQuantity;

  const approvalRequired =
    requireApproval ||
    Math.abs(adjustmentQuantity) >=
      approvalThreshold;

  // ==========================================
  // VALIDATION — CORRECTED
  // ============================================

  const isValid =
    Boolean(product) &&
    canAdjust &&
    Number.isSafeInteger(currentQuantity) &&
    currentQuantity >= 0 &&
    validQuantity &&
    (mode === "set" || parsedQuantity > 0) &&
    adjustmentQuantity !== 0 &&
    Number.isSafeInteger(resultingQuantity) &&
    resultingQuantity >= 0;

  const canSubmit =
    isValid &&
    !busy &&
    notes.trim().length > 0;

  // ==========================================
  // RESET
  // ============================================

  const resetForm = () => {
    setMode("decrease");
    setReason("damage");
    setQuantityInput("1");
    setNotes("");
    setLocalError(null);
  };

  const handleClose = () => {
    if (busy) return;

    resetForm();
    onClose();
  };

  // ==========================================
  // SUBMIT
  // ============================================

  const handleSubmit = async () => {
    if (!product || !canSubmit || busy) {
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      await onSubmit({
        productId: product.id,
        variantId: product.variantId,
        storeId: product.storeId,

        mode,
        reason,

        quantity: parsedQuantity,
        previousQuantity: currentQuantity,
        adjustmentQuantity,
        resultingQuantity,

        notes: notes.trim(),
        requiresApproval: approvalRequired,

        expectedVersion: product.version,
      });

      resetForm();
      onClose();
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to submit stock adjustment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // RENDER
  // ============================================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      {/* HEADER */}

      <DialogTitle>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center" }}
        >
          <Inventory2Outlined color="primary" />

          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              Stock Adjustment
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Update recorded inventory quantities
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      {/* CONTENT */}

      <DialogContent dividers>
        <Stack spacing={3}>
          {(error || localError) && (
            <Alert
              severity="error"
              onClose={() => setLocalError(null)}
            >
              {localError || error}
            </Alert>
          )}

          {!canAdjust && (
            <Alert severity="warning">
              You do not have permission to
              adjust stock.
            </Alert>
          )}

          {/* PRODUCT INFORMATION */}

          {product && (
            <Paper
              variant="outlined"
              sx={{ p: 2 }}
            >
              <Stack spacing={1}>
                <Typography
                  sx={{ fontWeight: 700 }}
                >
                  {product.name}
                </Typography>

                {product.variantName && (
                  <Typography variant="body2">
                    Variant: {product.variantName}
                  </Typography>
                )}

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  SKU: {product.sku}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Store:{" "}
                  {product.storeName ??
                    product.storeId}
                </Typography>

                <Chip
                  size="small"
                  label={`Current Stock: ${currentQuantity}`}
                  color="primary"
                  variant="outlined"
                  sx={{
                    alignSelf: "flex-start",
                  }}
                />
              </Stack>
            </Paper>
          )}

          {/* ADJUSTMENT TYPE */}

          <Stack spacing={1}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700 }}
            >
              Adjustment Type
            </Typography>

            <Stack
              direction="row"
              sx={{
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Button
                variant={
                  mode === "increase"
                    ? "contained"
                    : "outlined"
                }
                color="success"
                startIcon={
                  <AddCircleOutlineOutlined />
                }
                disabled={busy || !canAdjust}
                onClick={() =>
                  setMode("increase")
                }
              >
                Increase
              </Button>

              <Button
                variant={
                  mode === "decrease"
                    ? "contained"
                    : "outlined"
                }
                color="error"
                startIcon={
                  <RemoveCircleOutlineOutlined />
                }
                disabled={busy || !canAdjust}
                onClick={() =>
                  setMode("decrease")
                }
              >
                Decrease
              </Button>

              <Button
                variant={
                  mode === "set"
                    ? "contained"
                    : "outlined"
                }
                startIcon={
                  <FactCheckOutlined />
                }
                disabled={busy || !canAdjust}
                onClick={() =>
                  setMode("set")
                }
              >
                Set Actual Stock
              </Button>
            </Stack>
          </Stack>

          {/* QUANTITY */}

          <TextField
            fullWidth
            type="number"
            label={
              mode === "set"
                ? "Actual Counted Quantity"
                : "Adjustment Quantity"
            }
            value={quantityInput}
            disabled={busy || !canAdjust}
            onChange={(event) =>
              setQuantityInput(
                event.target.value
              )
            }
            slotProps={{
              htmlInput: {
                min: mode === "set" ? 0 : 1,
                step: 1,
              },
            }}
            helperText={
              mode === "set"
                ? "Enter the physical stock count."
                : "Enter the number of units to adjust."
            }
          />

          {/* REASON */}

          <TextField
            select
            fullWidth
            label="Adjustment Reason"
            value={reason}
            disabled={busy || !canAdjust}
            onChange={(event) =>
              setReason(
                event.target.value as
                  StockAdjustmentReason
              )
            }
          >
            {REASONS.map((item) => (
              <MenuItem
                key={item.value}
                value={item.value}
              >
                {item.label}
              </MenuItem>
            ))}
          </TextField>

          {/* NOTES */}

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Adjustment Notes"
            value={notes}
            disabled={busy || !canAdjust}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="Explain why this stock adjustment is needed..."
            required
          />

          <Divider />

          {/* PREVIEW */}

          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700 }}
          >
            Adjustment Preview
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {[
              {
                label: "Current Stock",
                value: currentQuantity,
              },
              {
                label: "Adjustment",
                value:
                  adjustmentQuantity > 0
                    ? `+${adjustmentQuantity}`
                    : String(adjustmentQuantity),
              },
              {
                label: "Resulting Stock",
                value: resultingQuantity,
              },
            ].map((item) => (
              <Paper
                key={item.label}
                variant="outlined"
                sx={{ p: 2 }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {item.label}
                </Typography>

                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  {item.value}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* VALIDATION MESSAGES */}

          {validQuantity &&
            resultingQuantity < 0 && (
              <Alert severity="error">
                This adjustment would result in
                negative stock.
              </Alert>
            )}

          {validQuantity &&
            adjustmentQuantity === 0 && (
              <Alert severity="info">
                This adjustment does not change
                inventory.
              </Alert>
            )}

          {!validQuantity && (
            <Alert severity="warning">
              Enter a valid whole-number quantity.
            </Alert>
          )}

          {/* APPROVAL */}

          {approvalRequired && (
            <Alert severity="warning">
              Manager approval is required for
              this adjustment. Stock should only
              change after approval.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      {/* ACTIONS */}

      <DialogActions sx={{ p: 2 }}>
        <Button
          disabled={busy}
          onClick={handleClose}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={!canSubmit}
          onClick={() => {
            void handleSubmit();
          }}
        >
          {busy
            ? "Submitting..."
            : approvalRequired
              ? "Request Approval"
              : "Confirm Adjustment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
