
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddOutlined,
  DeleteOutlined,
  PaymentsOutlined,
} from "@mui/icons-material";

import type {
  SplitPaymentEntry,
  SplitPaymentMethod,
  SplitPaymentMethodOption,
} from "./split-payment-models";

import {
  calculateSplitPayment,
  DEFAULT_SPLIT_PAYMENT_METHODS,
  formatSplitMoney,
  roundSplitMoney,
} from "./split-payment.utils";

export interface SplitPaymentInputProps {
  totalAmount: number;

  value: SplitPaymentEntry[];
  onChange: (entries: SplitPaymentEntry[]) => void;

  methods?: SplitPaymentMethodOption[];

  currencySymbol?: string;
  decimalPlaces?: number;

  allowDuplicateMethods?: boolean;
  allowOverpayment?: boolean;

  disabled?: boolean;
  readOnly?: boolean;
  showSummary?: boolean;

  onCalculatedChange?: (
    balanceDue: number,
    excessAmount: number,
    isFullyAllocated: boolean
  ) => void;
}

function SplitPaymentInput({
  totalAmount,
  value,
  onChange,
  methods = DEFAULT_SPLIT_PAYMENT_METHODS,
  currencySymbol = "Rs.",
  decimalPlaces = 2,
  allowDuplicateMethods = false,
  allowOverpayment = true,
  disabled = false,
  readOnly = false,
  showSummary = true,
  onCalculatedChange,
}: SplitPaymentInputProps) {
  const precision = Number.isFinite(decimalPlaces)
    ? Math.min(6, Math.max(0, Math.trunc(decimalPlaces)))
    : 2;

  const calculation = calculateSplitPayment(
    totalAmount,
    value,
    precision
  );

  const canEdit = !disabled && !readOnly;

  const notifyChange = (
    next: SplitPaymentEntry[]
  ) => {
    onChange(next);

    const result = calculateSplitPayment(
      totalAmount,
      next,
      precision
    );

    onCalculatedChange?.(
      result.balanceDue,
      result.excessAmount,
      result.isFullyAllocated
    );
  };

  const updateEntry = (
    id: string,
    changes: Partial<SplitPaymentEntry>
  ) => {
    if (!canEdit) return;

    const next = value.map((entry) =>
      entry.id === id
        ? { ...entry, ...changes }
        : entry
    );

    if (!allowOverpayment) {
      const result = calculateSplitPayment(
        totalAmount,
        next,
        precision
      );

      if (result.excessAmount > 0) return;
    }

    notifyChange(next);
  };

  const addEntry = () => {
    if (!canEdit) return;

    const available = methods.find(
      (method) =>
        !method.disabled &&
        (allowDuplicateMethods ||
          !value.some(
            (entry) =>
              entry.method === method.value
          ))
    );

    if (!available) return;

    const id =
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    notifyChange([
      ...value,
      {
        id,
        method: available.value,
        amount: 0,
        reference: "",
      },
    ]);
  };

  const removeEntry = (id: string) => {
    if (!canEdit) return;

    notifyChange(
      value.filter((entry) => entry.id !== id)
    );
  };

  const handleAmountChange = (
    id: string,
    raw: string
  ) => {
    if (raw === "") {
      updateEntry(id, { amount: 0 });
      return;
    }

    if (!/^\d*\.?\d*$/.test(raw)) return;

    const fraction = raw.split(".")[1];

    if (
      fraction !== undefined &&
      fraction.length > precision
    ) {
      return;
    }

    const parsed = Number(raw);

    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    updateEntry(id, {
      amount: roundSplitMoney(
        parsed,
        precision
      ),
    });
  };

  const handleMethodChange = (
    id: string,
    method: SplitPaymentMethod
  ) => {
    if (!canEdit) return;

    const option = methods.find(
      (item) => item.value === method
    );

    if (!option || option.disabled) return;

    if (
      !allowDuplicateMethods &&
      value.some(
        (entry) =>
          entry.id !== id &&
          entry.method === method
      )
    ) {
      return;
    }

    updateEntry(id, {
      method,
      reference: "",
    });
  };

  const canAdd =
    canEdit &&
    methods.some(
      (method) =>
        !method.disabled &&
        (allowDuplicateMethods ||
          !value.some(
            (entry) =>
              entry.method === method.value
          ))
    );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            Split Payment
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Total payable: {currencySymbol}{" "}
            {formatSplitMoney(
              calculation.totalAmount,
              precision
            )}
          </Typography>
        </Box>

        <Chip
          size="small"
          color={
            calculation.hasInvalidEntries
              ? "error"
              : calculation.balanceDue > 0
                ? "warning"
                : "success"
          }
          label={
            calculation.hasInvalidEntries
              ? "Invalid"
              : calculation.balanceDue > 0
                ? "Incomplete"
                : "Fully Allocated"
          }
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {value.map((entry, index) => (
          <Paper
            key={entry.id}
            variant="outlined"
            sx={{ p: 2, borderRadius: 2 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700 }}
              >
                Payment {index + 1}
              </Typography>

              <IconButton
                size="small"
                color="error"
                disabled={!canEdit}
                onClick={() =>
                  removeEntry(entry.id)
                }
                aria-label={`Remove payment ${
                  index + 1
                }`}
              >
                <DeleteOutlined />
              </IconButton>
            </Box>

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
              <TextField
                select
                label="Payment Method"
                size="small"
                value={entry.method}
                disabled={!canEdit}
                onChange={(event) =>
                  handleMethodChange(
                    entry.id,
                    event.target
                      .value as SplitPaymentMethod
                  )
                }
              >
                {methods.map((method) => {
                  const alreadyUsed =
                    !allowDuplicateMethods &&
                    value.some(
                      (item) =>
                        item.id !== entry.id &&
                        item.method === method.value
                    );

                  return (
                    <MenuItem
                      key={method.value}
                      value={method.value}
                      disabled={
                        method.disabled ||
                        alreadyUsed
                      }
                    >
                      {method.label}
                    </MenuItem>
                  );
                })}
              </TextField>

              <TextField
                label="Amount"
                size="small"
                type="number"
                value={entry.amount}
                disabled={!canEdit}
                onChange={(event) =>
                  handleAmountChange(
                    entry.id,
                    event.target.value
                  )
                }
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: "0.01",
                  },
                }}
              />

              {entry.method !== "cash" && (
                <TextField
                  label="Transaction Reference"
                  size="small"
                  value={entry.reference ?? ""}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateEntry(entry.id, {
                      reference:
                        event.target.value,
                    })
                  }
                  sx={{
                    gridColumn: {
                      xs: "auto",
                      sm: "1 / -1",
                    },
                  }}
                />
              )}
            </Box>
          </Paper>
        ))}
      </Box>

      <Button
        variant="outlined"
        startIcon={<AddOutlined />}
        fullWidth
        disabled={!canAdd}
        onClick={addEntry}
        sx={{ mt: 2 }}
      >
        Add Payment
      </Button>

      {showSummary && (
        <Paper
          variant="outlined"
          sx={{
            mt: 3,
            p: 2.5,
            borderRadius: 2,
            bgcolor: "action.hover",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Payment Breakdown
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.25,
            }}
          >
            {[
              {
                label: "Total Payable",
                amount: calculation.totalAmount,
              },
              {
                label: "Total Allocated",
                amount: calculation.totalReceived,
              },
              {
                label: "Remaining Balance",
                amount: calculation.balanceDue,
              },
              {
                label: "Excess Amount",
                amount: calculation.excessAmount,
              },
              {
                label: "Cash Change",
                amount: calculation.cashChange,
              },
            ].map((row) => (
              <Box
                key={row.label}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Typography variant="body2">
                  {row.label}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600 }}
                >
                  {currencySymbol}{" "}
                  {formatSplitMoney(
                    row.amount,
                    precision
                  )}
                </Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography
            variant="caption"
            color="text.secondary"
          >
            <PaymentsOutlined
              sx={{
                fontSize: 15,
                verticalAlign: "middle",
                mr: 0.5,
              }}
            />
            Electronic payments must be verified
            before finalizing the sale.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default SplitPaymentInput;
