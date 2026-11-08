
import { useState } from "react";
import type { ChangeEvent } from "react";

import {
  Box,
  Button,
  Chip,
  FormControl,
  FormHelperText,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";

import {
  BackspaceOutlined,
  CheckCircleOutlined,
  PaymentsOutlined,
} from "@mui/icons-material";

import type {
  CashQuickAmountMode,
} from "./cash-payment-models";

import {
  calculateCashPayment,
  formatCashMoney,
  roundCashMoney,
} from "./cash-payment.utils";

export interface CashPaymentInputProps {
  totalAmount: number;
  value: number | null;
  onChange: (amount: number | null) => void;

  onCalculatedChange?: (
    changeAmount: number,
    balanceDue: number,
    isFullyPaid: boolean
  ) => void;

  label?: string;
  currencySymbol?: string;
  decimalPlaces?: number;

  quickAmounts?: number[];
  quickAmountMode?: CashQuickAmountMode;

  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  helperText?: string;

  size?: "small" | "medium";
  fullWidth?: boolean;
  showSummary?: boolean;
}

function CashPaymentInput({
  totalAmount,
  value,
  onChange,
  onCalculatedChange,
  label = "Cash Received",
  currencySymbol = "Rs.",
  decimalPlaces = 2,
  quickAmounts = [100, 500, 1000, 2000, 5000],
  quickAmountMode = "set",
  disabled = false,
  readOnly = false,
  error = false,
  helperText,
  size = "small",
  fullWidth = true,
  showSummary = true,
}: CashPaymentInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  const precision = Number.isFinite(decimalPlaces)
    ? Math.min(6, Math.max(0, Math.trunc(decimalPlaces)))
    : 2;

  const configurationValid =
    Number.isFinite(totalAmount) &&
    totalAmount >= 0;

  const valueInvalid =
    value !== null &&
    (!Number.isFinite(value) || value < 0);

  const result = calculateCashPayment(
    totalAmount,
    value ?? 0,
    precision
  );

  const hasError =
    error ||
    !configurationValid ||
    valueInvalid ||
    Boolean(localError);

  const errorMessage = !configurationValid
    ? "Invalid total payable amount."
    : localError
      ? localError
      : valueInvalid
        ? "Cash received must be zero or greater."
        : helperText;

  const displayValue =
    draft ?? (value === null ? "" : String(value));

  const notifyChange = (next: number | null) => {
    onChange(next);

    const calculation = calculateCashPayment(
      totalAmount,
      next ?? 0,
      precision
    );

    onCalculatedChange?.(
      calculation.changeAmount,
      calculation.balanceDue,
      calculation.isFullyPaid
    );
  };

  const commitValue = (raw: string) => {
    if (!configurationValid) {
      setLocalError("Invalid payment configuration.");
      return;
    }

    const cleaned = raw.trim();

    if (cleaned === "") {
      setDraft(null);
      setLocalError("");

      if (value !== null) {
        notifyChange(null);
      }

      return;
    }

    const parsed = Number(cleaned);

    if (!Number.isFinite(parsed) || parsed < 0) {
      setLocalError("Enter a valid cash amount.");
      return;
    }

    const rounded = roundCashMoney(
      parsed,
      precision
    );

    setDraft(null);
    setLocalError("");

    if (rounded !== value) {
      notifyChange(rounded);
    }
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const next = event.target.value;

    if (!/^\d*\.?\d*$/.test(next)) return;

    const fraction = next.split(".")[1];

    if (
      fraction !== undefined &&
      fraction.length > precision
    ) {
      return;
    }

    setDraft(next);
    setLocalError("");
  };

  const handleBlur = () => {
    if (draft !== null) {
      commitValue(draft);
    }
  };

  const handleQuickAmount = (amount: number) => {
    if (
      disabled ||
      readOnly ||
      !configurationValid ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return;
    }

    const next =
      quickAmountMode === "add"
        ? roundCashMoney(
            (value ?? 0) + amount,
            precision
          )
        : roundCashMoney(amount, precision);

    setDraft(null);
    setLocalError("");
    notifyChange(next);
  };

  const handleExactAmount = () => {
    if (disabled || readOnly || !configurationValid) {
      return;
    }

    const next = roundCashMoney(
      totalAmount,
      precision
    );

    setDraft(null);
    setLocalError("");
    notifyChange(next);
  };

  const handleClear = () => {
    if (disabled || readOnly) return;

    setDraft(null);
    setLocalError("");

    if (value !== null) {
      notifyChange(null);
    }
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      error={hasError}
      disabled={disabled}
    >
      {label && (
        <Typography
          variant="caption"
          color={hasError ? "error" : "text.secondary"}
          sx={{
            mb: 0.75,
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
      )}

      <TextField
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        size={size}
        disabled={disabled || !configurationValid}
        error={hasError}
        fullWidth
        placeholder="0.00"
        slotProps={{
          input: {
            readOnly,
            startAdornment: (
              <InputAdornment position="start">
                <PaymentsOutlined
                  fontSize="small"
                  sx={{ mr: 0.5 }}
                />
                {currencySymbol}
              </InputAdornment>
            ),
          },
          htmlInput: {
            inputMode: "decimal",
            autoComplete: "off",
            "aria-label": label,
          },
        }}
      />

      {(hasError || helperText) && (
        <FormHelperText
          error={hasError}
          sx={{ mx: 0.5, mt: 0.75 }}
        >
          {errorMessage}
        </FormHelperText>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600 }}
        >
          Quick Cash Amounts
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mt: 1,
          }}
        >
          {quickAmounts.map((amount) => (
            <Button
              key={amount}
              variant="outlined"
              size="small"
              disabled={
                disabled ||
                readOnly ||
                !configurationValid ||
                !Number.isFinite(amount) ||
                amount < 0
              }
              onClick={() => handleQuickAmount(amount)}
            >
              {formatCashMoney(amount, 0)}
            </Button>
          ))}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mt: 1.5,
          }}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={<CheckCircleOutlined />}
            disabled={
              disabled ||
              readOnly ||
              !configurationValid
            }
            onClick={handleExactAmount}
          >
            Exact Amount
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<BackspaceOutlined />}
            disabled={disabled || readOnly}
            onClick={handleClear}
          >
            Clear
          </Button>
        </Box>
      </Box>

      {showSummary && (
        <Box
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: 2,
            bgcolor: "action.hover",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 1,
              gap: 2,
            }}
          >
            <Typography variant="body2">
              Total Payable
            </Typography>

            <Typography variant="body2">
              {currencySymbol}{" "}
              {formatCashMoney(
                result.totalAmount,
                precision
              )}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 1,
              gap: 2,
            }}
          >
            <Typography variant="body2">
              Cash Received
            </Typography>

            <Typography variant="body2">
              {currencySymbol}{" "}
              {formatCashMoney(
                result.receivedAmount,
                precision
              )}
            </Typography>
          </Box>

          <Box
            sx={{
              borderTop: 1,
              borderColor: "divider",
              pt: 1.5,
              mt: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography
                sx={{ fontWeight: 700 }}
              >
                {result.isFullyPaid
                  ? "Change to Return"
                  : "Balance Due"}
              </Typography>

              <Typography
                variant="h6"
                color={
                  result.isFullyPaid
                    ? "success.main"
                    : "error.main"
                }
                sx={{ fontWeight: 700 }}
              >
                {currencySymbol}{" "}
                {formatCashMoney(
                  result.isFullyPaid
                    ? result.changeAmount
                    : result.balanceDue,
                  precision
                )}
              </Typography>
            </Box>

            <Box sx={{ mt: 1 }}>
              <Chip
                size="small"
                color={
                  result.isFullyPaid
                    ? "success"
                    : "warning"
                }
                label={
                  result.isFullyPaid
                    ? "Fully Paid"
                    : "Payment Incomplete"
                }
              />
            </Box>
          </Box>
        </Box>
      )}
    </FormControl>
  );
}

export default CashPaymentInput;
