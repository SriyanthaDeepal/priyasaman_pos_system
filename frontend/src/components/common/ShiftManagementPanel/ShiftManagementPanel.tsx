
import { useState } from "react";

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
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddCircleOutlined,
  ArrowDownward,
  ArrowUpward,
  LockOutlined,
  PlayArrowOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type ShiftStatus = "open" | "closed";

export type CashMovementType = "cash-in" | "cash-out";

export type DiscrepancyStatus =
  | "surplus"
  | "shortage"
  | "balanced";

export interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  createdAt: string;
  createdBy: string;
}

export interface CashierShift {
  id: string;
  status: ShiftStatus;
  cashierId: string;
  cashierName: string;
  terminalId: string;
  terminalName: string;
  openedAt: string;
  openingCash: number;
  cashSales: number;
  cardSales: number;
  otherSales: number;
  cashRefunds: number;
  movements: CashMovement[];
  closedAt?: string;
  countedCash?: number;
}

export interface OpenShiftPayload {
  openingCash: number;
}

export interface CashMovementPayload {
  type: CashMovementType;
  amount: number;
  reason: string;
}

export interface CloseShiftPayload {
  countedCash: number;
  expectedCash: number;
  discrepancy: number;
  discrepancyStatus: DiscrepancyStatus;
}

export interface ShiftManagementPanelProps {
  shift: CashierShift | null;
  cashierName: string;
  terminalName: string;

  recentShifts?: CashierShift[];

  loading?: boolean;
  processing?: boolean;
  error?: string | null;

  canManageCash?: boolean;
  canCloseShift?: boolean;

  onOpenShift: (
    payload: OpenShiftPayload
  ) => void | Promise<void>;

  onCashMovement?: (
    payload: CashMovementPayload
  ) => void | Promise<void>;

  onCloseShift?: (
    payload: CloseShiftPayload
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

const formatDiscrepancy = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;

  if (rounded > 0) {
    return `+ ${formatMoney(rounded)}`;
  }

  if (rounded < 0) {
    return `− ${formatMoney(Math.abs(rounded))}`;
  }

  return formatMoney(0);
};

const getDiscrepancyStatus = (
  value: number
): DiscrepancyStatus => {
  const rounded = Math.round(value * 100);

  if (rounded > 0) return "surplus";
  if (rounded < 0) return "shortage";

  return "balanced";
};

const calculateCashIn = (
  movements: CashMovement[]
): number =>
  movements
    .filter((item) => item.type === "cash-in")
    .reduce((sum, item) => sum + item.amount, 0);

const calculateCashOut = (
  movements: CashMovement[]
): number =>
  movements
    .filter((item) => item.type === "cash-out")
    .reduce((sum, item) => sum + item.amount, 0);

const calculateExpectedCash = (
  shift: CashierShift
): number =>
  shift.openingCash +
  shift.cashSales -
  shift.cashRefunds +
  calculateCashIn(shift.movements) -
  calculateCashOut(shift.movements);

const isValidAmount = (
  value: string,
  allowZero: boolean
): boolean => {
  if (value.trim() === "") return false;

  const amount = Number(value);

  return (
    Number.isFinite(amount) &&
    (allowZero ? amount >= 0 : amount > 0) &&
    Math.abs(amount * 100 - Math.round(amount * 100)) <
      0.000001
  );
};

// ============================================
// COMPONENT
// ============================================

export default function ShiftManagementPanel({
  shift,
  cashierName,
  terminalName,
  recentShifts = [],
  loading = false,
  processing = false,
  error = null,
  canManageCash = true,
  canCloseShift = true,
  onOpenShift,
  onCashMovement,
  onCloseShift,
}: ShiftManagementPanelProps) {
  const [openingCash, setOpeningCash] = useState("0");

  const [movementOpen, setMovementOpen] =
    useState(false);

  const [movementType, setMovementType] =
    useState<CashMovementType>("cash-in");

  const [movementAmount, setMovementAmount] =
    useState("");

  const [movementReason, setMovementReason] =
    useState("");

  const [closeOpen, setCloseOpen] =
    useState(false);

  const [countedCash, setCountedCash] =
    useState("");

  const [localError, setLocalError] =
    useState<string | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  // ==========================================
  // DERIVED VALUES
  // ==========================================

  const busy = loading || processing || submitting;

  const activeShift =
    shift?.status === "open" ? shift : null;

  const expectedCash = activeShift
    ? calculateExpectedCash(activeShift)
    : 0;

  const cashIn = activeShift
    ? calculateCashIn(activeShift.movements)
    : 0;

  const cashOut = activeShift
    ? calculateCashOut(activeShift.movements)
    : 0;

  const totalSales = activeShift
    ? activeShift.cashSales +
      activeShift.cardSales +
      activeShift.otherSales
    : 0;

  const countedValue = Number(countedCash);

  const discrepancy = Math.round(
    (countedValue - expectedCash) * 100
  ) / 100;

  const discrepancyStatus =
    getDiscrepancyStatus(discrepancy);

  const discrepancyColor =
    discrepancyStatus === "shortage"
      ? "error"
      : discrepancyStatus === "surplus"
        ? "warning"
        : "success";

  const discrepancyLabel =
    discrepancyStatus === "shortage"
      ? "Cash Shortage"
      : discrepancyStatus === "surplus"
        ? "Cash Surplus"
        : "Cash Balanced";

  // ==========================================
  // ASYNC ACTION HANDLER
  // ==========================================

  const runAction = async (
    action: () => void | Promise<void>,
    onSuccess: () => void
  ) => {
    if (busy) return;

    setSubmitting(true);
    setLocalError(null);

    try {
      await action();
      onSuccess();
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to complete the operation."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // OPEN SHIFT
  // ==========================================

  const handleOpenShift = () => {
    if (!isValidAmount(openingCash, true)) {
      setLocalError(
        "Enter a valid opening cash amount."
      );
      return;
    }

    void runAction(
      () =>
        onOpenShift({
          openingCash: Number(openingCash),
        }),
      () => setOpeningCash("0")
    );
  };

  // ==========================================
  // CASH MOVEMENT
  // ==========================================

  const handleCashMovement = () => {
    if (
      !activeShift ||
      !canManageCash ||
      !onCashMovement
    ) {
      return;
    }

    if (
      !isValidAmount(movementAmount, false) ||
      !movementReason.trim()
    ) {
      setLocalError(
        "Enter a valid amount and a reason."
      );
      return;
    }

    void runAction(
      () =>
        onCashMovement({
          type: movementType,
          amount: Number(movementAmount),
          reason: movementReason.trim(),
        }),
      () => {
        setMovementOpen(false);
        setMovementAmount("");
        setMovementReason("");
      }
    );
  };

  // ==========================================
  // CLOSE SHIFT
  // ==========================================

  const handleCloseShift = () => {
    if (
      !activeShift ||
      !canCloseShift ||
      !onCloseShift
    ) {
      return;
    }

    if (!isValidAmount(countedCash, true)) {
      setLocalError(
        "Enter a valid counted cash amount."
      );
      return;
    }

    void runAction(
      () =>
        onCloseShift({
          countedCash: countedValue,
          expectedCash,
          discrepancy,
          discrepancyStatus,
        }),
      () => {
        setCloseOpen(false);
        setCountedCash("");
      }
    );
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
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              Shift Management
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {terminalName}
            </Typography>
          </Box>

          <Chip
            color={activeShift ? "success" : "default"}
            label={
              activeShift
                ? "Shift Open"
                : "No Active Shift"
            }
          />
        </Stack>

        {(error || localError) && (
          <Alert
            severity="error"
            onClose={() => setLocalError(null)}
          >
            {localError || error}
          </Alert>
        )}

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 5,
            }}
          >
            <CircularProgress />
          </Box>
        ) : !activeShift ? (
          // ====================================
          // OPEN SHIFT VIEW
          // ====================================

          <Stack spacing={2}>
            <Typography color="text.secondary">
              No active shift. Enter the opening
              cash balance to begin.
            </Typography>

            <Typography variant="body2">
              Cashier: <strong>{cashierName}</strong>
            </Typography>

            <TextField
              label="Opening Cash (LKR)"
              type="number"
              fullWidth
              value={openingCash}
              disabled={busy}
              onChange={(event) =>
                setOpeningCash(event.target.value)
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: "0.01",
                },
              }}
            />

            <Button
              variant="contained"
              startIcon={<PlayArrowOutlined />}
              disabled={
                busy ||
                !isValidAmount(openingCash, true)
              }
              onClick={handleOpenShift}
            >
              Open Shift
            </Button>
          </Stack>
        ) : (
          // ====================================
          // ACTIVE SHIFT VIEW
          // ====================================

          <Stack spacing={3}>
            <Box>
              <Typography sx={{ fontWeight: 700 }}>
                {activeShift.cashierName}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Shift {activeShift.id} · Opened{" "}
                {new Date(
                  activeShift.openedAt
                ).toLocaleString("en-LK")}
              </Typography>
            </Box>

            <Divider />

            {/* SALES SUMMARY */}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                },
                gap: 2,
              }}
            >
              {[
                {
                  label: "Opening Cash",
                  value: activeShift.openingCash,
                },
                {
                  label: "Cash Sales",
                  value: activeShift.cashSales,
                },
                {
                  label: "Card Sales",
                  value: activeShift.cardSales,
                },
                {
                  label: "Other Sales",
                  value: activeShift.otherSales,
                },
                {
                  label: "Cash Refunds",
                  value: activeShift.cashRefunds,
                },
                {
                  label: "Cash In",
                  value: cashIn,
                },
                {
                  label: "Cash Out",
                  value: cashOut,
                },
                {
                  label: "Total Sales",
                  value: totalSales,
                },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    p: 2,
                    bgcolor: "action.hover",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {item.label}
                  </Typography>

                  <Typography sx={{ fontWeight: 700 }}>
                    {formatMoney(item.value)}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* EXPECTED CASH */}

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: "action.hover",
                borderRadius: 2,
              }}
            >
              <Typography color="text.secondary">
                Expected Cash in Drawer
              </Typography>

              <Typography
                variant="h4"
                sx={{ fontWeight: 700 }}
              >
                {formatMoney(expectedCash)}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Opening cash + cash sales − cash
                refunds + cash in − cash out
              </Typography>
            </Paper>

            {/* ACTION BUTTONS */}

            <Stack
              direction="row"
              sx={{
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              {canManageCash && onCashMovement && (
                <Button
                  variant="outlined"
                  startIcon={<AddCircleOutlined />}
                  disabled={busy}
                  onClick={() => {
                    setLocalError(null);
                    setMovementOpen(true);
                  }}
                >
                  Cash Movement
                </Button>
              )}

              {canCloseShift && onCloseShift && (
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<LockOutlined />}
                  disabled={busy}
                  onClick={() => {
                    setLocalError(null);
                    setCloseOpen(true);
                  }}
                >
                  Close Shift
                </Button>
              )}
            </Stack>
          </Stack>
        )}

        {/* RECENT SHIFTS */}

        {recentShifts.length > 0 && (
          <>
            <Divider />

            <Typography sx={{ fontWeight: 700 }}>
              Recent Shifts
            </Typography>

            <Stack spacing={1}>
              {recentShifts.map((recent) => {
                const recentExpected =
                  calculateExpectedCash(recent);

                const recentDiscrepancy =
                  recent.countedCash === undefined
                    ? null
                    : Math.round(
                        (recent.countedCash -
                          recentExpected) *
                          100
                      ) / 100;

                const recentStatus =
                  recentDiscrepancy === null
                    ? null
                    : getDiscrepancyStatus(
                        recentDiscrepancy
                      );

                return (
                  <Box
                    key={recent.id}
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="body2">
                        {recent.id} ·{" "}
                        {recent.cashierName}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {new Date(
                          recent.openedAt
                        ).toLocaleString("en-LK")}
                      </Typography>
                    </Box>

                    <Stack
                      spacing={0.5}
                      sx={{ alignItems: "flex-end" }}
                    >
                      <Typography
                        sx={{ fontWeight: 600 }}
                      >
                        {formatMoney(recentExpected)}
                      </Typography>

                      {recentDiscrepancy !== null && (
                        <Chip
                          size="small"
                          color={
                            recentStatus === "shortage"
                              ? "error"
                              : recentStatus === "surplus"
                                ? "warning"
                                : "success"
                          }
                          label={`${
                            recentStatus === "shortage"
                              ? "Shortage"
                              : recentStatus === "surplus"
                                ? "Surplus"
                                : "Balanced"
                          }: ${formatDiscrepancy(
                            recentDiscrepancy
                          )}`}
                        />
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </>
        )}
      </Stack>

      {/* ======================================
          CASH MOVEMENT DIALOG
      ====================================== */}

      <Dialog
        open={movementOpen}
        onClose={() => {
          if (!busy) setMovementOpen(false);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          Record Cash Movement
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack
              direction="row"
              sx={{ gap: 1 }}
            >
              <Button
                variant={
                  movementType === "cash-in"
                    ? "contained"
                    : "outlined"
                }
                startIcon={<ArrowDownward />}
                disabled={busy}
                onClick={() =>
                  setMovementType("cash-in")
                }
              >
                Cash In
              </Button>

              <Button
                variant={
                  movementType === "cash-out"
                    ? "contained"
                    : "outlined"
                }
                startIcon={<ArrowUpward />}
                disabled={busy}
                onClick={() =>
                  setMovementType("cash-out")
                }
              >
                Cash Out
              </Button>
            </Stack>

            <TextField
              label="Amount (LKR)"
              type="number"
              fullWidth
              value={movementAmount}
              disabled={busy}
              onChange={(event) =>
                setMovementAmount(event.target.value)
              }
              slotProps={{
                htmlInput: {
                  min: 0.01,
                  step: "0.01",
                },
              }}
            />

            <TextField
              label="Reason"
              multiline
              minRows={2}
              fullWidth
              value={movementReason}
              disabled={busy}
              onChange={(event) =>
                setMovementReason(event.target.value)
              }
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
            onClick={() => {
              setMovementOpen(false);
              setLocalError(null);
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={
              busy ||
              !isValidAmount(
                movementAmount,
                false
              ) ||
              !movementReason.trim()
            }
            onClick={handleCashMovement}
          >
            Save Movement
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================
          CLOSE SHIFT DIALOG
      ====================================== */}

      <Dialog
        open={closeOpen}
        onClose={() => {
          if (!busy) setCloseOpen(false);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          Close Shift
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography color="text.secondary">
              Count the physical cash in the drawer
              before closing this shift.
            </Typography>

            <TextField
              label="Counted Cash (LKR)"
              type="number"
              fullWidth
              value={countedCash}
              disabled={busy}
              onChange={(event) =>
                setCountedCash(event.target.value)
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: "0.01",
                },
              }}
            />

            {isValidAmount(countedCash, true) && (
              <Alert severity={discrepancyColor}>
                <Stack spacing={0.5}>
                  <Typography
                    sx={{ fontWeight: 700 }}
                  >
                    {discrepancyLabel}
                  </Typography>

                  <Typography variant="body2">
                    Discrepancy:{" "}
                    {formatDiscrepancy(discrepancy)}
                  </Typography>

                  <Typography variant="caption">
                    {discrepancyStatus === "shortage"
                      ? "The drawer contains less cash than expected."
                      : discrepancyStatus === "surplus"
                        ? "The drawer contains more cash than expected. Review the difference."
                        : "The counted cash matches the expected balance."}
                  </Typography>
                </Stack>
              </Alert>
            )}

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
            onClick={() => {
              setCloseOpen(false);
              setLocalError(null);
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="warning"
            disabled={
              busy ||
              !isValidAmount(countedCash, true)
            }
            onClick={handleCloseShift}
          >
            Confirm Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
