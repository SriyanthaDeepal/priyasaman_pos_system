
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
  AccountBalanceWalletOutlined,
  FactCheckOutlined,
  GppGoodOutlined,
  HistoryOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type CashAdjustmentStatus =
  | "balanced"
  | "shortage"
  | "surplus";

export type CashAdjustmentReviewStatus =
  | "pending"
  | "approved"
  | "rejected";

export type CashAdjustmentTrackingMode =
  | "standard"
  | "advanced";

export type CashAdjustmentReason =
  | "cash-shortage"
  | "cash-surplus"
  | "counting-correction"
  | "other";

export interface CashAdjustmentReconciliation {
  id: string;
  reference: string;

  shiftId: string;
  terminalId: string;
  terminalName?: string;

  cashierName: string;
  countedAt: string;

  expectedCash: number;
  countedCash: number;
  discrepancy: number;

  discrepancyStatus: CashAdjustmentStatus;
  reviewStatus: CashAdjustmentReviewStatus;

  trackingMode: CashAdjustmentTrackingMode;

  adjustmentId?: string;
  adjustedAt?: string;
  adjustedBy?: string;
}

export interface CashAdjustmentPayload {
  reconciliationId: string;
  shiftId: string;
  terminalId: string;

  amount: number;
  direction: "increase" | "decrease";

  reason: CashAdjustmentReason;
  notes: string;
}

export interface CashReconciliationAdjustmentProps {
  reconciliation: CashAdjustmentReconciliation;

  canAdjust?: boolean;
  processing?: boolean;
  error?: string | null;

  onAdjust: (
    payload: CashAdjustmentPayload
  ) => void | Promise<void>;
}

// ============================================
// HELPERS
// ============================================

const roundMoney = (value: number) =>
  Math.round(value * 100) / 100;

const formatMoney = (value: number) =>
  `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatSignedMoney = (value: number) => {
  if (value > 0) return `+ ${formatMoney(value)}`;
  if (value < 0) return `− ${formatMoney(Math.abs(value))}`;
  return formatMoney(0);
};

const getDiscrepancyColor = (
  status: CashAdjustmentStatus
): "success" | "warning" | "error" => {
  if (status === "shortage") return "error";
  if (status === "surplus") return "warning";
  return "success";
};

// ============================================
// COMPONENT
// ============================================

export default function CashReconciliationAdjustment({
  reconciliation,
  canAdjust = false,
  processing = false,
  error = null,
  onAdjust,
}: CashReconciliationAdjustmentProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const [reason, setReason] =
    useState<CashAdjustmentReason>(
      reconciliation.discrepancyStatus === "shortage"
        ? "cash-shortage"
        : "cash-surplus"
    );

  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] =
    useState<string | null>(null);

  const busy = processing || submitting;

  const discrepancy = roundMoney(
    reconciliation.countedCash -
      reconciliation.expectedCash
  );

  const amount = Math.abs(discrepancy);

  const direction: "increase" | "decrease" =
    discrepancy >= 0 ? "increase" : "decrease";

  const alreadyAdjusted = Boolean(
    reconciliation.adjustmentId
  );

  const eligible =
    canAdjust &&
    reconciliation.reviewStatus === "approved" &&
    !alreadyAdjusted &&
    amount > 0 &&
    Number.isFinite(amount);

  const discrepancyColor = getDiscrepancyColor(
    reconciliation.discrepancyStatus
  );

  const handleOpen = () => {
    setReason(
      discrepancy < 0
        ? "cash-shortage"
        : "cash-surplus"
    );
    setNotes("");
    setLocalError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!eligible || busy) return;

    if (
      !Number.isFinite(reconciliation.expectedCash) ||
      !Number.isFinite(reconciliation.countedCash) ||
      reconciliation.expectedCash < 0 ||
      reconciliation.countedCash < 0
    ) {
      setLocalError("Invalid reconciliation amounts.");
      return;
    }

    if (
      (discrepancy < 0 && reason === "cash-surplus") ||
      (discrepancy > 0 && reason === "cash-shortage")
    ) {
      setLocalError(
        "The adjustment reason does not match the discrepancy."
      );
      return;
    }

    if (!notes.trim()) {
      setLocalError(
        "Please provide an explanation for this adjustment."
      );
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      await onAdjust({
        reconciliationId: reconciliation.id,
        shiftId: reconciliation.shiftId,
        terminalId: reconciliation.terminalId,
        amount,
        direction,
        reason,
        notes: notes.trim(),
      });

      setDialogOpen(false);
      setNotes("");
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save adjustment."
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
            <FactCheckOutlined color="primary" />

            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Cash Reconciliation Adjustment
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {reconciliation.reference} ·{" "}
                {reconciliation.shiftId}
              </Typography>
            </Box>
          </Stack>

          <Chip
            label={reconciliation.reviewStatus}
            color={
              reconciliation.reviewStatus === "approved"
                ? "success"
                : reconciliation.reviewStatus === "rejected"
                  ? "error"
                  : "default"
            }
          />
        </Stack>

        {(error || localError) && (
          <Alert severity="error">
            {localError || error}
          </Alert>
        )}

        {/* CASH SUMMARY */}

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
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Expected Cash
            </Typography>

            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              {formatMoney(
                reconciliation.expectedCash
              )}
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Counted Cash
            </Typography>

            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              {formatMoney(
                reconciliation.countedCash
              )}
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Discrepancy
            </Typography>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: `${discrepancyColor}.main`,
              }}
            >
              {formatSignedMoney(discrepancy)}
            </Typography>
          </Paper>
        </Box>

        {/* INFORMATION */}

        <Stack spacing={1}>
          <Typography>
            <strong>Cashier:</strong>{" "}
            {reconciliation.cashierName}
          </Typography>

          <Typography>
            <strong>Terminal:</strong>{" "}
            {reconciliation.terminalName ||
              reconciliation.terminalId}
          </Typography>

          <Typography>
            <strong>Tracking Mode:</strong>{" "}
            {reconciliation.trackingMode === "advanced"
              ? "Advanced Denomination Tracking"
              : "Standard Cash Tracking"}
          </Typography>
        </Stack>

        <Divider />

        {/* STATUS */}

        {alreadyAdjusted ? (
          <Alert
            severity="success"
            icon={<GppGoodOutlined />}
          >
            This reconciliation has already been adjusted.
            Adjustment reference:{" "}
            {reconciliation.adjustmentId}
          </Alert>
        ) : amount === 0 ? (
          <Alert severity="success">
            Cash is balanced. No adjustment is required.
          </Alert>
        ) : reconciliation.reviewStatus !== "approved" ? (
          <Alert severity="warning">
            This reconciliation must be approved before
            an adjustment can be recorded.
          </Alert>
        ) : (
          <Alert
            severity={
              discrepancy < 0 ? "error" : "warning"
            }
            icon={<WarningAmberOutlined />}
          >
            {discrepancy < 0
              ? `A shortage of ${formatMoney(amount)} requires an authorized adjustment.`
              : `A surplus of ${formatMoney(amount)} requires an authorized adjustment.`}
          </Alert>
        )}

        {/* ADJUSTMENT PREVIEW */}

        {amount > 0 && !alreadyAdjusted && (
          <Box
            sx={{
              p: 2,
              bgcolor: "action.hover",
              borderRadius: 2,
            }}
          >
            <Stack direction="row" spacing={1.5}>
              <AccountBalanceWalletOutlined
                color="primary"
              />

              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700 }}
                >
                  Proposed Adjustment
                </Typography>

                <Typography variant="body2">
                  {direction === "increase"
                    ? "Recognize cash surplus"
                    : "Recognize cash shortage"}
                </Typography>

                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, mt: 1 }}
                >
                  {direction === "increase" ? "+" : "−"}{" "}
                  {formatMoney(amount)}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {/* ACTION */}

        <Button
          variant="contained"
          startIcon={<HistoryOutlined />}
          disabled={!eligible || busy}
          onClick={handleOpen}
        >
          Record Adjustment
        </Button>
      </Stack>

      {/* CONFIRMATION DIALOG */}

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (!busy) setDialogOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Confirm Cash Adjustment
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert
              severity={
                discrepancy < 0 ? "error" : "warning"
              }
            >
              Adjustment Amount:{" "}
              {formatSignedMoney(discrepancy)}
            </Alert>

            {localError && (
              <Alert severity="error">
                {localError}
              </Alert>
            )}

            <TextField
              select
              fullWidth
              label="Adjustment Reason"
              value={reason}
              disabled={busy}
              onChange={(event) =>
                setReason(
                  event.target.value as CashAdjustmentReason
                )
              }
            >
              {discrepancy < 0 ? (
                <MenuItem value="cash-shortage">
                  Cash Shortage
                </MenuItem>
              ) : (
                <MenuItem value="cash-surplus">
                  Cash Surplus
                </MenuItem>
              )}

              <MenuItem value="counting-correction">
                Counting Correction
              </MenuItem>

              <MenuItem value="other">
                Other
              </MenuItem>
            </TextField>

            <TextField
              label="Adjustment Explanation"
              multiline
              minRows={3}
              fullWidth
              required
              disabled={busy}
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Explain why this adjustment is necessary..."
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            disabled={busy}
            onClick={() => setDialogOpen(false)}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="warning"
            disabled={busy}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {busy
              ? "Saving..."
              : "Confirm Adjustment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
