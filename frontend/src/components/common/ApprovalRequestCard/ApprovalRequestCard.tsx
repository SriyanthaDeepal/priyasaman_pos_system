
import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  CheckCircleOutlined,
  CloseOutlined,
  Inventory2Outlined,
  LocalOfferOutlined,
  PaymentsOutlined,
  PriceChangeOutlined,
  SecurityOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type ApprovalRequestType =
  | "refund"
  | "discount"
  | "price-override"
  | "inventory-adjustment"
  | "other";

export type ApprovalRequestStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface ApprovalRequest {
  id: string;
  type: ApprovalRequestType;
  status: ApprovalRequestStatus;
  title: string;
  requesterId: string;
  requesterName: string;
  requestedAt: string;
  reason: string;
  reference?: string;
  amount?: number;
  currency?: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionReason?: string;
}

export interface ApprovalRequestCardProps {
  request: ApprovalRequest;
  canApprove?: boolean;
  processing?: boolean;
  error?: string | null;
  onApprove?: (
    request: ApprovalRequest
  ) => void | Promise<void>;
  onReject?: (
    request: ApprovalRequest,
    reason: string
  ) => void | Promise<void>;
  onOpenReference?: (
    request: ApprovalRequest
  ) => void;
}

// ============================================
// CONFIGURATION
// ============================================

const TYPE_LABELS: Record<
  ApprovalRequestType,
  string
> = {
  refund: "Refund",
  discount: "Discount",
  "price-override": "Price Override",
  "inventory-adjustment": "Inventory Adjustment",
  other: "Other",
};

const STATUS_COLORS: Record<
  ApprovalRequestStatus,
  "warning" | "success" | "error"
> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
};

function getRequestIcon(type: ApprovalRequestType) {
  switch (type) {
    case "refund":
      return <PaymentsOutlined color="primary" />;

    case "discount":
      return <LocalOfferOutlined color="primary" />;

    case "price-override":
      return <PriceChangeOutlined color="primary" />;

    case "inventory-adjustment":
      return <Inventory2Outlined color="primary" />;

    default:
      return <SecurityOutlined color="primary" />;
  }
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatAmount(
  amount: number,
  currency: string
): string {
  if (currency === "LKR") {
    return `Rs. ${new Intl.NumberFormat("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  }

  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// ============================================
// COMPONENT
// ============================================

export default function ApprovalRequestCard({
  request,
  canApprove = false,
  processing = false,
  error = null,
  onApprove,
  onReject,
  onOpenReference,
}: ApprovalRequestCardProps) {
  const [dialogType, setDialogType] = useState<
    "approve" | "reject" | null
  >(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<
    string | null
  >(null);

  const isPending = request.status === "pending";
  const isBusy = processing || submitting;

  const canTakeAction =
    canApprove && isPending && !isBusy;

  const closeDialog = () => {
    if (isBusy) return;

    setDialogType(null);
    setRejectionReason("");
    setActionError(null);
  };

  const handleConfirm = async () => {
    if (!dialogType || isBusy || !canApprove || !isPending) {
      return;
    }

    if (
      dialogType === "reject" &&
      !rejectionReason.trim()
    ) {
      setActionError("A rejection reason is required.");
      return;
    }

    const callback =
      dialogType === "approve" ? onApprove : onReject;

    if (!callback) return;

    setSubmitting(true);
    setActionError(null);

    try {
      if (dialogType === "approve") {
        await onApprove?.(request);
      } else {
        await onReject?.(
          request,
          rejectionReason.trim()
        );
      }

      setDialogType(null);
      setRejectionReason("");
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to process this request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2.5}>
          {/* HEADER */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "center" }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {getRequestIcon(request.type)}
              </Box>

              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700 }}
                >
                  {request.title}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {request.id}
                </Typography>
              </Box>
            </Stack>

            <Chip
              size="small"
              color={STATUS_COLORS[request.status]}
              label={
                request.status.charAt(0).toUpperCase() +
                request.status.slice(1)
              }
            />
          </Box>

          <Divider />

          {/* REQUEST DETAILS */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
              },
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Request Type
              </Typography>

              <Typography variant="body2">
                {TYPE_LABELS[request.type]}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Requested By
              </Typography>

              <Typography variant="body2">
                {request.requesterName}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Requested At
              </Typography>

              <Typography variant="body2">
                {formatDate(request.requestedAt)}
              </Typography>
            </Box>

            {request.amount !== undefined && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Requested Amount
                </Typography>

                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700 }}
                >
                  {formatAmount(
                    request.amount,
                    request.currency ?? "LKR"
                  )}
                </Typography>
              </Box>
            )}
          </Box>

          {/* REASON */}
          <Box
            sx={{
              bgcolor: "action.hover",
              borderRadius: 1,
              p: 2,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700 }}
            >
              Request Reason
            </Typography>

            <Typography
              variant="body2"
              sx={{ mt: 0.5 }}
            >
              {request.reason}
            </Typography>
          </Box>

          {/* REFERENCE */}
          {request.reference && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Reference: {request.reference}
              </Typography>

              {onOpenReference && (
                <Button
                  size="small"
                  onClick={() => onOpenReference(request)}
                >
                  View Record
                </Button>
              )}
            </Box>
          )}

          {/* DECISION DETAILS */}
          {!isPending && (
            <Alert
              severity={
                request.status === "approved"
                  ? "success"
                  : "error"
              }
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 700 }}
              >
                Request {request.status}
              </Typography>

              {request.decidedBy && (
                <Typography variant="body2">
                  By: {request.decidedBy}
                </Typography>
              )}

              {request.decidedAt && (
                <Typography variant="body2">
                  At: {formatDate(request.decidedAt)}
                </Typography>
              )}

              {request.decisionReason && (
                <Typography variant="body2">
                  Reason: {request.decisionReason}
                </Typography>
              )}
            </Alert>
          )}

          {/* ERROR */}
          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          {/* ACTIONS */}
          {isPending && canApprove && (
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
            >
                <Button
                fullWidth
                variant="contained"
                color="success"
                disabled={!canTakeAction || !onApprove}
                startIcon={<CheckCircleOutlined />}
                onClick={() => setDialogType("approve")}
                >
                Approve
                </Button>

                <Button
                fullWidth
                variant="outlined"
                color="error"
                disabled={!canTakeAction || !onReject}
                startIcon={<CloseOutlined />}
                onClick={() => setDialogType("reject")}
                >
                Reject
                </Button>
            </Stack>
            )}

          {processing && (
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center" }}
            >
              <CircularProgress size={18} />
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Processing request...
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>

      {/* CONFIRMATION DIALOG */}
      <Dialog
        open={dialogType !== null}
        onClose={closeDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {dialogType === "approve"
            ? "Confirm Approval"
            : "Reject Request"}
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            {dialogType === "approve"
              ? `Are you sure you want to approve ${request.id}?`
              : `Please provide a reason for rejecting ${request.id}.`}
          </DialogContentText>

          {dialogType === "reject" && (
            <TextField
              fullWidth
              multiline
              minRows={3}
              size="small"
              label="Rejection Reason"
              value={rejectionReason}
              onChange={(event) =>
                setRejectionReason(event.target.value)
              }
              disabled={isBusy}
              required
              sx={{ mt: 2 }}
            />
          )}

          {actionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {actionError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={closeDialog}
            disabled={isBusy}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color={
              dialogType === "approve"
                ? "success"
                : "error"
            }
            disabled={
              isBusy ||
              (dialogType === "reject" &&
                !rejectionReason.trim())
            }
            onClick={handleConfirm}
            startIcon={
              submitting ? (
                <CircularProgress
                  size={16}
                  color="inherit"
                />
              ) : undefined
            }
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
