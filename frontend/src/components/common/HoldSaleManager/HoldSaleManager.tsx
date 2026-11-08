
import { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  DeleteOutlineOutlined,
  PauseCircleOutlineOutlined,
  PlayCircleOutlineOutlined,
  ReceiptLongOutlined,
  RestartAltOutlined,
  SearchOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export interface HeldSaleItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;

  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;

  variantId?: string;
  barcode?: string;
}

export interface HeldSaleCart {
  items: HeldSaleItem[];

  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;

  customerId?: string;
  customerName?: string;

  notes?: string;
}

export interface HeldSaleRecord {
  id: string;
  reference: string;

  cashierId: string;
  cashierName: string;

  terminalId: string;
  terminalName?: string;

  heldAt: string;
  updatedAt?: string;

  holdReason?: string;

  cart: HeldSaleCart;
}

export interface HoldSalePayload {
  cart: HeldSaleCart;
  reason: string;
}

export interface HoldSaleManagerProps {
  currentCart: HeldSaleCart | null;
  heldSales: HeldSaleRecord[];

  currentCashierName?: string;

  canHold?: boolean;
  canResume?: boolean;
  canDelete?: boolean;

  processing?: boolean;
  loading?: boolean;
  error?: string | null;

  onHold: (
    payload: HoldSalePayload
  ) => void | Promise<void>;

  onResume: (
    sale: HeldSaleRecord
  ) => void | Promise<void>;

  onDelete: (
    sale: HeldSaleRecord
  ) => void | Promise<void>;
}

// ============================================
// HELPERS
// ============================================

const formatMoney = (value: number): string =>
  `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ============================================
// COMPONENT
// ============================================

export default function HoldSaleManager({
  currentCart,
  heldSales,
  currentCashierName,
  canHold = true,
  canResume = true,
  canDelete = false,
  processing = false,
  loading = false,
  error = null,
  onHold,
  onResume,
  onDelete,
}: HoldSaleManagerProps) {
  const [search, setSearch] = useState("");

  const [cashierFilter, setCashierFilter] =
    useState("all");

  const [holdDialogOpen, setHoldDialogOpen] =
    useState(false);

  const [holdReason, setHoldReason] = useState("");

  const [selectedSale, setSelectedSale] =
    useState<HeldSaleRecord | null>(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [resumeOpen, setResumeOpen] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [localError, setLocalError] =
    useState<string | null>(null);

  const busy = processing || submitting;

  // ==========================================
  // FILTERING
  // ============================================

  const cashiers = useMemo(
    () =>
      Array.from(
        new Set(
          heldSales.map((sale) => sale.cashierName)
        )
      ).sort(),
    [heldSales]
  );

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();

    return heldSales
      .filter((sale) => {
        if (
          cashierFilter !== "all" &&
          sale.cashierName !== cashierFilter
        ) {
          return false;
        }

        if (!query) return true;

        return [
          sale.reference,
          sale.cashierName,
          sale.cart.customerName ?? "",
          sale.terminalName ?? "",
          sale.holdReason ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort(
        (a, b) =>
          new Date(b.heldAt).getTime() -
          new Date(a.heldAt).getTime()
      );
  }, [heldSales, search, cashierFilter]);

  const totalHeldValue = heldSales.reduce(
    (sum, sale) => sum + sale.cart.grandTotal,
    0
  );

  const totalHeldItems = heldSales.reduce(
    (sum, sale) =>
      sum +
      sale.cart.items.reduce(
        (count, item) => count + item.quantity,
        0
      ),
    0
  );

  const canHoldCurrentCart =
    canHold &&
    Boolean(currentCart?.items.length) &&
    !busy;

  // ==========================================
  // HOLD CURRENT SALE
  // ============================================

  const handleHold = async () => {
    if (
      !canHold ||
      !currentCart ||
      currentCart.items.length === 0 ||
      busy
    ) {
      return;
    }

    if (!holdReason.trim()) {
      setLocalError(
        "Please provide a reason for holding the sale."
      );
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      await onHold({
        cart: currentCart,
        reason: holdReason.trim(),
      });

      setHoldDialogOpen(false);
      setHoldReason("");
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to hold sale."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // RESUME SALE
  // ============================================

  const handleResume = async () => {
    if (!selectedSale || !canResume || busy) return;

    setSubmitting(true);
    setLocalError(null);

    try {
      await onResume(selectedSale);

      setResumeOpen(false);
      setSelectedSale(null);
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to resume sale."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // DELETE SALE
  // ============================================

  const handleDelete = async () => {
    if (!selectedSale || !canDelete || busy) return;

    setSubmitting(true);
    setLocalError(null);

    try {
      await onDelete(selectedSale);

      setDeleteOpen(false);
      setSelectedSale(null);
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete held sale."
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
          <Stack direction="row" spacing={1.5}>
            <PauseCircleOutlineOutlined
              color="primary"
            />

            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Hold Sale Manager
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Suspend and resume incomplete sales
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            startIcon={<PauseCircleOutlineOutlined />}
            disabled={!canHoldCurrentCart}
            onClick={() => {
              setLocalError(null);
              setHoldDialogOpen(true);
            }}
          >
            Hold Current Sale
          </Button>
        </Stack>

        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        {localError && (
          <Alert
            severity="error"
            onClose={() => setLocalError(null)}
          >
            {localError}
          </Alert>
        )}

        {/* SUMMARY */}

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
              label: "Held Sales",
              value: heldSales.length,
            },
            {
              label: "Held Items",
              value: totalHeldItems,
            },
            {
              label: "Held Sale Value",
              value: formatMoney(totalHeldValue),
            },
          ].map((item) => (
            <Paper
              key={item.label}
              variant="outlined"
              sx={{ p: 2 }}
            >
              <Typography
                variant="body2"
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

        {/* CURRENT CART */}

        {currentCart && currentCart.items.length > 0 && (
          <Alert severity="info">
            Current cart contains{" "}
            {currentCart.items.length} product line(s)
            worth {formatMoney(currentCart.grandTotal)}.
            {currentCashierName
              ? ` Cashier: ${currentCashierName}.`
              : ""}
          </Alert>
        )}

        {/* FILTERS */}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ gap: 2 }}
        >
          <TextField
            size="small"
            label="Search Held Sales"
            placeholder="Reference, customer, cashier..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            slotProps={{
              input: {
                startAdornment: (
                  <SearchOutlined
                    sx={{
                      mr: 1,
                      color: "text.secondary",
                    }}
                  />
                ),
              },
            }}
            sx={{ flex: 1 }}
          />

          <TextField
            select
            size="small"
            label="Cashier"
            value={cashierFilter}
            onChange={(event) =>
              setCashierFilter(event.target.value)
            }
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">
              All Cashiers
            </MenuItem>

            {cashiers.map((cashier) => (
              <MenuItem
                key={cashier}
                value={cashier}
              >
                {cashier}
              </MenuItem>
            ))}
          </TextField>

          <Button
            startIcon={<RestartAltOutlined />}
            onClick={() => {
              setSearch("");
              setCashierFilter("all");
            }}
          >
            Reset
          </Button>
        </Stack>

        <Divider />

        {/* HELD SALES */}

        {loading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : filteredSales.length === 0 ? (
          <Alert severity="info">
            No held sales found.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {filteredSales.map((sale) => (
              <Paper
                key={sale.id}
                variant="outlined"
                sx={{ p: 2, borderRadius: 2 }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    sx={{
                      justifyContent:
                        "space-between",
                      alignItems: {
                        xs: "flex-start",
                        sm: "center",
                      },
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            alignItems: "center",
                        }}
                      >
                        <ReceiptLongOutlined
                          fontSize="small"
                          color="primary"
                        />

                        <Typography
                          sx={{ fontWeight: 700 }}
                        >
                          {sale.reference}
                        </Typography>
                      </Stack>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Held:{" "}
                        {formatDateTime(sale.heldAt)}
                      </Typography>
                    </Box>

                    <Chip
                      label="On Hold"
                      color="warning"
                      size="small"
                    />
                  </Stack>

                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      <strong>Customer:</strong>{" "}
                      {sale.cart.customerName ??
                        "Walk-in Customer"}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Cashier:</strong>{" "}
                      {sale.cashierName}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Terminal:</strong>{" "}
                      {sale.terminalName ??
                        sale.terminalId}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Reason:</strong>{" "}
                      {sale.holdReason ??
                        "Not specified"}
                    </Typography>
                  </Stack>

                  <Divider />

                  <Stack
                    direction="row"
                    sx={{
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2">
                      {sale.cart.items.length} product
                      line(s)
                    </Typography>

                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700 }}
                    >
                      {formatMoney(
                        sale.cart.grandTotal
                      )}
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "flex-end",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={
                        <VisibilityOutlined />
                      }
                      onClick={() => {
                        setSelectedSale(sale);
                        setDetailsOpen(true);
                      }}
                    >
                      View
                    </Button>

                    <Button
                      size="small"
                      variant="contained"
                      startIcon={
                        <PlayCircleOutlineOutlined />
                      }
                      disabled={!canResume || busy}
                      onClick={() => {
                        setSelectedSale(sale);
                        setResumeOpen(true);
                      }}
                    >
                      Resume
                    </Button>

                    {canDelete && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={
                          <DeleteOutlineOutlined />
                        }
                        disabled={busy}
                        onClick={() => {
                          setSelectedSale(sale);
                          setDeleteOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>

      {/* HOLD DIALOG */}

      <Dialog
        open={holdDialogOpen}
        onClose={() => {
          if (!busy) setHoldDialogOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Hold Current Sale
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              The current cart will be saved
              for later continuation.
            </Alert>

            <TextField
              label="Hold Reason"
              multiline
              minRows={3}
              required
              fullWidth
              disabled={busy}
              value={holdReason}
              onChange={(event) =>
                setHoldReason(event.target.value)
              }
              placeholder="Why is this sale being held?"
            />

            {localError && (
              <Alert severity="error">
                {localError}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            disabled={busy}
            onClick={() =>
              setHoldDialogOpen(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={busy}
            onClick={() => {
              void handleHold();
            }}
          >
            {busy ? "Saving..." : "Confirm Hold"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DETAILS DIALOG */}

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Held Sale Details
        </DialogTitle>

        <DialogContent>
          {selectedSale && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography>
                <strong>Reference:</strong>{" "}
                {selectedSale.reference}
              </Typography>

              <Typography>
                <strong>Customer:</strong>{" "}
                {selectedSale.cart.customerName ??
                  "Walk-in Customer"}
              </Typography>

              <Typography>
                <strong>Cashier:</strong>{" "}
                {selectedSale.cashierName}
              </Typography>

              <Typography>
                <strong>Reason:</strong>{" "}
                {selectedSale.holdReason ??
                  "Not specified"}
              </Typography>

              <Divider />

              <Typography
                sx={{ fontWeight: 700 }}
              >
                Cart Items
              </Typography>

              {selectedSale.cart.items.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  sx={{
                    justifyContent:
                      "space-between",
                    gap: 2,
                  }}
                >
                  <Typography variant="body2">
                    {item.productName} ×{" "}
                    {item.quantity}
                  </Typography>

                  <Typography variant="body2">
                    {formatMoney(item.lineTotal)}
                  </Typography>
                </Stack>
              ))}

              <Divider />

              <Typography>
                Subtotal:{" "}
                {formatMoney(
                  selectedSale.cart.subtotal
                )}
              </Typography>

              <Typography>
                Discount:{" "}
                {formatMoney(
                  selectedSale.cart.discountTotal
                )}
              </Typography>

              <Typography>
                Tax:{" "}
                {formatMoney(
                  selectedSale.cart.taxTotal
                )}
              </Typography>

              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Total:{" "}
                {formatMoney(
                  selectedSale.cart.grandTotal
                )}
              </Typography>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setDetailsOpen(false);
              setSelectedSale(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* RESUME DIALOG */}

      <Dialog
        open={resumeOpen}
        onClose={() => {
          if (!busy) setResumeOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Resume Held Sale
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              The saved cart will replace the
              current cart. Confirm that the
              current cart is empty or has
              already been saved.
            </Alert>

            <Typography>
              Resume{" "}
              <strong>
                {selectedSale?.reference}
              </strong>
              ?
            </Typography>

            {localError && (
              <Alert severity="error">
                {localError}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            disabled={busy}
            onClick={() =>
              setResumeOpen(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={busy}
            onClick={() => {
              void handleResume();
            }}
          >
            {busy ? "Resuming..." : "Resume Sale"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE DIALOG */}

      <Dialog
        open={deleteOpen}
        onClose={() => {
          if (!busy) setDeleteOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Delete Held Sale
        </DialogTitle>

        <DialogContent>
          <Alert severity="error">
            This action will remove the held sale.
            It cannot be recovered unless your
            backend supports restoration.
          </Alert>

          <Typography sx={{ mt: 2 }}>
            Delete{" "}
            <strong>
              {selectedSale?.reference}
            </strong>
            ?
          </Typography>

          {localError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {localError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            disabled={busy}
            onClick={() =>
              setDeleteOpen(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={busy}
            onClick={() => {
              void handleDelete();
            }}
          >
            {busy ? "Deleting..." : "Delete Sale"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
