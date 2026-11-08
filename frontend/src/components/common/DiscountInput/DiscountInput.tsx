
import { useState } from "react";
import type { ChangeEvent } from "react";

import {
  Box,
  FormControl,
  FormHelperText,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import type {
  DiscountType,
  DiscountValue,
} from "./discount-models";

import {
  calculateDiscount,
  formatMoney,
  roundMoney,
} from "./discount.utils";

export interface DiscountInputProps {
  value: DiscountValue;
  onChange: (value: DiscountValue) => void;

  baseAmount: number;

  onCalculatedChange?: (
    discountAmount: number,
    finalAmount: number
  ) => void;

  label?: string;
  currencySymbol?: string;

  maxPercentage?: number;
  maxFixedAmount?: number;
  decimalPlaces?: number;

  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  helperText?: string;

  size?: "small" | "medium";
  fullWidth?: boolean;
  showSummary?: boolean;
}

function DiscountInput({
  value,
  onChange,
  baseAmount,
  onCalculatedChange,
  label = "Discount",
  currencySymbol = "Rs.",
  maxPercentage = 100,
  maxFixedAmount = Number.MAX_SAFE_INTEGER,
  decimalPlaces = 2,
  disabled = false,
  readOnly = false,
  error = false,
  helperText,
  size = "small",
  fullWidth = true,
  showSummary = true,
}: DiscountInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  const precision = Number.isFinite(decimalPlaces)
    ? Math.min(6, Math.max(0, Math.trunc(decimalPlaces)))
    : 2;

  const safeBase = Number.isFinite(baseAmount)
    ? Math.max(0, baseAmount)
    : 0;

  const allowedPercentage = Number.isFinite(maxPercentage)
    ? Math.min(100, Math.max(0, maxPercentage))
    : 0;

  const allowedFixed = Number.isFinite(maxFixedAmount)
    ? Math.min(safeBase, Math.max(0, maxFixedAmount))
    : 0;

  const maxAllowed =
    value.type === "percentage"
      ? allowedPercentage
      : allowedFixed;

  const configurationValid =
    Number.isFinite(baseAmount) &&
    baseAmount >= 0 &&
    Number.isFinite(maxPercentage) &&
    maxPercentage >= 0 &&
    Number.isFinite(maxFixedAmount) &&
    maxFixedAmount >= 0;

  const valueInvalid =
    !Number.isFinite(value.value) ||
    value.value < 0 ||
    value.value > maxAllowed;

  const calculated = calculateDiscount(
    baseAmount,
    value,
    maxPercentage,
    maxFixedAmount,
    precision
  );

  const displayValue = draft ?? String(value.value);

  const hasError =
    error ||
    !configurationValid ||
    valueInvalid ||
    Boolean(localError);

  const errorMessage = !configurationValid
    ? "Invalid discount configuration."
    : localError
      ? localError
      : valueInvalid
        ? `Discount must be between 0 and ${maxAllowed}.`
        : helperText;

  const notifyChange = (next: DiscountValue) => {
    onChange(next);

    const result = calculateDiscount(
      baseAmount,
      next,
      maxPercentage,
      maxFixedAmount,
      precision
    );

    onCalculatedChange?.(
      result.discountAmount,
      result.finalAmount
    );
  };

  const commitValue = (raw: string) => {
    if (!configurationValid) {
      setLocalError("Invalid discount configuration.");
      return;
    }

    const cleaned = raw.trim();

    if (cleaned === "") {
      const next: DiscountValue = {
        ...value,
        value: 0,
      };

      setDraft(null);
      setLocalError("");

      if (value.value !== 0) {
        notifyChange(next);
      }

      return;
    }

    const parsed = Number(cleaned);

    if (!Number.isFinite(parsed) || parsed < 0) {
      setLocalError("Enter a valid discount.");
      return;
    }

    if (parsed > maxAllowed) {
      setLocalError(
        `Maximum allowed discount is ${maxAllowed}.`
      );
      return;
    }

    const rounded = roundMoney(parsed, precision);

    const next: DiscountValue = {
      ...value,
      value: rounded,
    };

    setDraft(null);
    setLocalError("");

    if (rounded !== value.value) {
      notifyChange(next);
    }
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const next = event.target.value;

    if (!/^\d*\.?\d*$/.test(next)) {
      return;
    }

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

  const handleTypeChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    if (!configurationValid) return;

    const type = event.target.value as DiscountType;

    if (type === value.type) return;

    const next: DiscountValue = {
      type,
      value: 0,
    };

    setDraft(null);
    setLocalError("");

    notifyChange(next);
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

      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "flex-start",
        }}
      >
        <TextField
          select
          value={value.type}
          onChange={handleTypeChange}
          size={size}
          disabled={disabled || readOnly || !configurationValid}
          sx={{
            minWidth: 145,
          }}
        >
          <MenuItem value="percentage">
            Percentage (%)
          </MenuItem>

          <MenuItem value="fixed">
            Fixed ({currencySymbol})
          </MenuItem>
        </TextField>

        <TextField
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          size={size}
          disabled={disabled || !configurationValid}
          error={hasError}
          placeholder="0"
          fullWidth
          slotProps={{
            input: {
              readOnly,
              endAdornment: (
                <InputAdornment position="end">
                  {value.type === "percentage"
                    ? "%"
                    : currencySymbol}
                </InputAdornment>
              ),
            },
            htmlInput: {
              inputMode: "decimal",
              autoComplete: "off",
              "aria-label": `${label} amount`,
            },
          }}
        />
      </Box>

      {(hasError || helperText) && (
        <FormHelperText
          error={hasError}
          sx={{
            mx: 0.5,
            mt: 0.75,
          }}
        >
          {errorMessage}
        </FormHelperText>
      )}

      {showSummary && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: "action.hover",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 0.75,
              gap: 2,
            }}
          >
            <Typography variant="body2">
              Original amount
            </Typography>

            <Typography variant="body2">
              {currencySymbol}{" "}
              {formatMoney(safeBase, precision)}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 0.75,
              gap: 2,
            }}
          >
            <Typography variant="body2">
              Discount
            </Typography>

            <Typography
              variant="body2"
              color="success.main"
            >
              - {currencySymbol}{" "}
              {formatMoney(
                calculated.discountAmount,
                precision
              )}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: 1,
              borderColor: "divider",
              pt: 1,
              gap: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 700 }}
            >
              Final amount
            </Typography>

            <Typography
              variant="body2"
              color="primary"
              sx={{ fontWeight: 700 }}
            >
              {currencySymbol}{" "}
              {formatMoney(
                calculated.finalAmount,
                precision
              )}
            </Typography>
          </Box>
        </Box>
      )}
    </FormControl>
  );
}

export default DiscountInput;
