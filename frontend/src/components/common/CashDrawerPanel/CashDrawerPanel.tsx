
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
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import {
  AccountBalanceWalletOutlined,
  AddCircleOutlined,
  CalculateOutlined,
  LockOpenOutlined,
  RemoveCircleOutlined,
  RestartAltOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type CashTrackingMode = "standard" | "advanced";

export type CashMovementType = "cash-in" | "cash-out";

export type CashDiscrepancyStatus =
  | "surplus"
  | "shortage"
  | "balanced";

export interface CashDenomination {
  value: number;
  type: "note" | "coin";
}

export interface CashDenominationLine {
  value: number;
  type: "note" | "coin";
  quantity: number;
  total: number;
}

export interface CashMovementPayload {
  type: CashMovementType;
  amount: number;
  reason: string;
  denominations?: CashDenominationLine[];
}

export interface CashReconciliationPayload {
  countedCash: number;
  expectedCash: number;
  discrepancy: number;
  discrepancyStatus: CashDiscrepancyStatus;
  denominations: CashDenominationLine[];
}

export interface CashDrawerPanelProps {
  drawerName: string;
  terminalName?: string;
  shiftId?: string;

  trackingMode?: CashTrackingMode;
  expectedCash: number;

  denominations?: CashDenomination[];
  estimatedDenominationCounts?: Record<string, number>;

  shiftOpen?: boolean;
  canManageCash?: boolean;
  canReconcile?: boolean;
  canOpenDrawer?: boolean;

  processing?: boolean;
  error?: string | null;

  onCashMovement?: (
    payload: CashMovementPayload
  ) => void | Promise<void>;

  onReconcile?: (
    payload: CashReconciliationPayload
  ) => void | Promise<void>;

  onOpenDrawer?: () => void | Promise<void>;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_DENOMINATIONS: CashDenomination[] = [
  { value: 5000, type: "note" },
  { value: 2000, type: "note" },
  { value: 1000, type: "note" },
  { value: 500, type: "note" },
  { value: 100, type: "note" },
  { value: 50, type: "note" },
  { value: 20, type: "note" },
  { value: 10, type: "coin" },
  { value: 5, type: "coin" },
  { value: 2, type: "coin" },
  { value: 1, type: "coin" },
];

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const formatMoney = (value: number) =>
  `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const denominationKey = (item: CashDenomination) =>
  `${item.type}-${item.value}`;

const getStatus = (
  difference: number
): CashDiscrepancyStatus => {
  if (difference > 0) return "surplus";
  if (difference < 0) return "shortage";
  return "balanced";
};

const formatDifference = (value: number) => {
  if (value > 0) return `+ ${formatMoney(value)}`;
  if (value < 0) return `− ${formatMoney(Math.abs(value))}`;
  return formatMoney(0);
};

const isValidAmount = (value: string) =>
  /^\d+(\.\d{1,2})?$/.test(value) &&
  Number(value) > 0 &&
  Number.isFinite(Number(value));

// ============================================
// COMPONENT
// ============================================

export default function CashDrawerPanel({
  drawerName,
  terminalName,
  shiftId,
  trackingMode = "standard",
  expectedCash,
  denominations = DEFAULT_DENOMINATIONS,
  estimatedDenominationCounts,
  shiftOpen = true,
  canManageCash = true,
  canReconcile = true,
  canOpenDrawer = false,
  processing = false,
  error = null,
  onCashMovement,
  onReconcile,
  onOpenDrawer,
}: CashDrawerPanelProps) {
  const [tab, setTab] = useState(0);

  const [movementOpen, setMovementOpen] = useState(false);
  const [movementType, setMovementType] =
    useState<CashMovementType>("cash-in");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");

  const [movementCounts, setMovementCounts] = useState<
    Record<string, string>
  >({});

  const [countedDenominations, setCountedDenominations] =
    useState<Record<string, string>>({});

  const [localError, setLocalError] = useState<string | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  const busy = processing || submitting;

  // ==========================================
  // DENOMINATION HELPERS
  // ==========================================

  const buildLines = (
    counts: Record<string, string>
  ): CashDenominationLine[] =>
    denominations.map((item) => {
      const quantity = Number(
        counts[denominationKey(item)] || 0
      );

      return {
        value: item.value,
        type: item.type,
        quantity,
        total: roundMoney(item.value * quantity),
      };
    });

  const totalOf = (lines: CashDenominationLine[]) =>
    roundMoney(
      lines.reduce((sum, line) => sum + line.total, 0)
    );

  const movementLines = buildLines(movementCounts);
  const movementDenominationTotal = totalOf(movementLines);

  const countLines = buildLines(countedDenominations);
  const countedCash = totalOf(countLines);

  const difference = roundMoney(countedCash - expectedCash);
  const discrepancyStatus = getStatus(difference);

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

  const updateCount = (
    setter: React.Dispatch<
      React.SetStateAction<Record<string, string>>
    >,
    key: string,
    value: string
  ) => {
    if (value !== "" && !/^\d+$/.test(value)) return;

    setter((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const validateLines = (lines: CashDenominationLine[]) =>
    lines.every(
      (line) =>
        Number.isSafeInteger(line.quantity) &&
        line.quantity >= 0 &&
        Number.isSafeInteger(line.total * 100)
    );

  // ==========================================
  // ASYNC ACTION
  // ==========================================

  const runAction = async (
    callback: () => void | Promise<void>
  ) => {
    setSubmitting(true);
    setLocalError(null);

    try {
      await callback();
      return true;
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Operation failed."
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // CASH MOVEMENT
  // ==========================================

  const handleMovement = async () => {
    if (
      busy ||
      !shiftOpen ||
      !canManageCash ||
      !onCashMovement
    ) {
      return;
    }

    if (!movementReason.trim()) {
      setLocalError("Please enter a reason.");
      return;
    }

    let amount: number;

    if (trackingMode === "advanced") {
      if (
        !validateLines(movementLines) ||
        movementDenominationTotal <= 0
      ) {
        setLocalError("Enter valid denomination quantities.");
        return;
      }

      amount = movementDenominationTotal;
    } else {
      if (!isValidAmount(movementAmount)) {
        setLocalError("Enter a valid cash amount.");
        return;
      }

      amount = roundMoney(Number(movementAmount));
    }

    if (
      movementType === "cash-out" &&
      amount > expectedCash
    ) {
      setLocalError(
        "Cash out cannot exceed the expected cash balance."
      );
      return;
    }

    if (
      trackingMode === "advanced" &&
      movementType === "cash-out" &&
      estimatedDenominationCounts
    ) {
      const exceedsAvailable = movementLines.some(
        (line) =>
          line.quantity >
          (estimatedDenominationCounts[
            `${line.type}-${line.value}`
          ] ?? 0)
      );

      if (exceedsAvailable) {
        setLocalError(
          "Cash out exceeds the available denomination quantities."
        );
        return;
      }
    }

    const success = await runAction(() =>
      onCashMovement({
        type: movementType,
        amount,
        reason: movementReason.trim(),
        denominations:
          trackingMode === "advanced"
            ? movementLines.filter(
                (line) => line.quantity > 0
              )
            : undefined,
      })
    );

    if (success) {
      setMovementOpen(false);
      setMovementAmount("");
      setMovementReason("");
      setMovementCounts({});
    }
  };

  // ==========================================
  // RECONCILIATION
  // ==========================================

  const handleReconcile = async () => {
    if (
      busy ||
      !shiftOpen ||
      !canReconcile ||
      !onReconcile
    ) {
      return;
    }

    if (
      !Number.isFinite(expectedCash) ||
      expectedCash < 0 ||
      !validateLines(countLines)
    ) {
      setLocalError("Invalid cash count.");
      return;
    }

    await runAction(() =>
      onReconcile({
        countedCash,
        expectedCash: roundMoney(expectedCash),
        discrepancy: difference,
        discrepancyStatus,
        denominations: countLines,
      })
    );
  };

  // ==========================================
  // OPEN PHYSICAL DRAWER
  // ==========================================

  const handleOpenDrawer = async () => {
    if (
      busy ||
      !shiftOpen ||
      !canOpenDrawer ||
      !onOpenDrawer
    ) {
      return;
    }

    await runAction(onOpenDrawer);
  };

  // ==========================================
  // DENOMINATION EDITOR
  // ==========================================

  const renderDenominationEditor = (
    counts: Record<string, string>,
    setter: React.Dispatch<
      React.SetStateAction<Record<string, string>>
    >
  ) => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 95px 1fr",
        gap: 1.5,
        alignItems: "center",
      }}
    >
      <Typography variant="caption">
        Denomination
      </Typography>
      <Typography variant="caption">
        Quantity
      </Typography>
      <Typography
        variant="caption"
        sx={{ textAlign: "right" }}
      >
        Total
      </Typography>

      {denominations.map((item) => {
        const key = denominationKey(item);
        const quantity = Number(counts[key] || 0);

        return (
          <Box key={key} sx={{ display: "contents" }}>
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600 }}
              >
                {formatMoney(item.value)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {item.type === "note" ? "Note" : "Coin"}
              </Typography>
            </Box>

            <TextField
              type="number"
              size="small"
              value={counts[key] ?? ""}
              disabled={busy}
              placeholder="0"
              onChange={(event) =>
                updateCount(
                  setter,
                  key,
                  event.target.value
                )
              }
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: 1,
                },
              }}
            />

            <Typography
              variant="body2"
              sx={{
                textAlign: "right",
                fontWeight: 600,
              }}
            >
              {formatMoney(item.value * quantity)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );

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
              {drawerName}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {[terminalName, shiftId]
                .filter(Boolean)
                .join(" · ")}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Chip
              size="small"
              color={shiftOpen ? "success" : "default"}
              label={shiftOpen ? "Shift Open" : "Shift Closed"}
            />

            <Chip
              size="small"
              variant="outlined"
              label={
                trackingMode === "advanced"
                  ? "Advanced Tracking"
                  : "Standard Tracking"
              }
            />
          </Stack>
        </Stack>

        {(error || localError) && (
          <Alert
            severity="error"
            onClose={() => setLocalError(null)}
          >
            {localError || error}
          </Alert>
        )}

        {/* BALANCE */}

        <Box
          sx={{
            bgcolor: "action.hover",
            p: 2,
            borderRadius: 2,
          }}
        >
          <Stack direction="row" spacing={2}>
            <AccountBalanceWalletOutlined
              color="primary"
            />

            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Expected Cash Balance
              </Typography>

              <Typography
                variant="h4"
                sx={{ fontWeight: 700 }}
              >
                {formatMoney(expectedCash)}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* ACTION BUTTONS */}

        <Stack
          direction="row"
          sx={{ flexWrap: "wrap", gap: 1 }}
        >
          <Button
            variant="contained"
            color="success"
            startIcon={<AddCircleOutlined />}
            disabled={
              busy ||
              !shiftOpen ||
              !canManageCash ||
              !onCashMovement
            }
            onClick={() => {
              setMovementType("cash-in");
              setMovementOpen(true);
              setLocalError(null);
            }}
          >
            Cash In
          </Button>

          <Button
            variant="outlined"
            color="warning"
            startIcon={<RemoveCircleOutlined />}
            disabled={
              busy ||
              !shiftOpen ||
              !canManageCash ||
              !onCashMovement
            }
            onClick={() => {
              setMovementType("cash-out");
              setMovementOpen(true);
              setLocalError(null);
            }}
          >
            Cash Out
          </Button>

          <Button
            variant="outlined"
            startIcon={<LockOpenOutlined />}
            disabled={
              busy ||
              !shiftOpen ||
              !canOpenDrawer ||
              !onOpenDrawer
            }
            onClick={() => {
              void handleOpenDrawer();
            }}
          >
            Open Drawer
          </Button>
        </Stack>

        {/* TABS */}

        <Tabs
          value={tab}
          onChange={(_, value: number) =>
            setTab(value)
          }
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Cash Reconciliation" />
          {trackingMode === "advanced" && (
            <Tab label="Denomination Inventory" />
          )}
        </Tabs>

        {/* RECONCILIATION */}

        {tab === 0 && (
          <Stack spacing={3}>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700 }}
              >
                Physical Cash Count
              </Typography>

              <Button
                size="small"
                startIcon={<RestartAltOutlined />}
                disabled={busy}
                onClick={() =>
                  setCountedDenominations({})
                }
              >
                Reset
              </Button>
            </Stack>

            {renderDenominationEditor(
              countedDenominations,
              setCountedDenominations
            )}

            <Divider />

            <Stack spacing={1}>
              <Typography color="text.secondary">
                Counted Cash
              </Typography>

              <Typography
                variant="h5"
                sx={{ fontWeight: 700 }}
              >
                {formatMoney(countedCash)}
              </Typography>

              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: `${discrepancyColor}.main`,
                }}
              >
                {formatDifference(difference)}
              </Typography>

              <Chip
                label={discrepancyLabel}
                color={discrepancyColor}
                sx={{ alignSelf: "flex-start" }}
              />
            </Stack>

            <Alert severity={discrepancyColor}>
              {discrepancyStatus === "shortage"
                ? "Counted cash is less than expected."
                : discrepancyStatus === "surplus"
                  ? "Counted cash is greater than expected."
                  : "Counted cash matches expected balance."}
            </Alert>

            <Button
              variant="contained"
              startIcon={<CalculateOutlined />}
              disabled={
                busy ||
                !shiftOpen ||
                !canReconcile ||
                !onReconcile
              }
              onClick={() => {
                void handleReconcile();
              }}
            >
              Submit Cash Count
            </Button>
          </Stack>
        )}

        {/* ADVANCED INVENTORY */}

        {tab === 1 &&
          trackingMode === "advanced" && (
            <Stack spacing={2}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700 }}
              >
                Estimated Denomination Inventory
              </Typography>

              {!estimatedDenominationCounts ? (
                <Alert severity="warning">
                  An initial physical count is required
                  before exact denomination tracking
                  can begin.
                </Alert>
              ) : (
                denominations.map((item) => {
                  const key = denominationKey(item);
                  const quantity =
                    estimatedDenominationCounts[key] ?? 0;

                  return (
                    <Stack
                      key={key}
                      direction="row"
                      sx={{
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography>
                        {formatMoney(item.value)}
                      </Typography>

                      <Typography
                        sx={{ fontWeight: 700 }}
                      >
                        {quantity}
                      </Typography>
                    </Stack>
                  );
                })
              )}
            </Stack>
          )}
      </Stack>

      {/* CASH MOVEMENT DIALOG */}

      <Dialog
        open={movementOpen}
        onClose={() => {
          if (!busy) setMovementOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {movementType === "cash-in"
            ? "Record Cash In"
            : "Record Cash Out"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              select
              label="Movement Type"
              value={movementType}
              disabled={busy}
              onChange={(event) =>
                setMovementType(
                  event.target.value as CashMovementType
                )
              }
            >
              <MenuItem value="cash-in">
                Cash In
              </MenuItem>
              <MenuItem value="cash-out">
                Cash Out
              </MenuItem>
            </TextField>

            {trackingMode === "standard" ? (
              <TextField
                label="Amount (LKR)"
                type="number"
                value={movementAmount}
                disabled={busy}
                onChange={(event) =>
                  setMovementAmount(event.target.value)
                }
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: "0.01",
                  },
                }}
              />
            ) : (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700 }}
                >
                  Denominations
                </Typography>

                {renderDenominationEditor(
                  movementCounts,
                  setMovementCounts
                )}

                <Typography
                  sx={{ fontWeight: 700 }}
                >
                  Total:{" "}
                  {formatMoney(
                    movementDenominationTotal
                  )}
                </Typography>
              </>
            )}

            <TextField
              label="Reason"
              multiline
              minRows={2}
              value={movementReason}
              disabled={busy}
              onChange={(event) =>
                setMovementReason(event.target.value)
              }
              required
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            disabled={busy}
            onClick={() => setMovementOpen(false)}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={busy}
            onClick={() => {
              void handleMovement();
            }}
          >
            Save Movement
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
