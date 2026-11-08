
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
  TaxMode,
  TaxValue,
} from "./tax-models";

import {
  calculateTax,
  formatTaxMoney,
  roundTaxMoney,
} from "./tax.utils";

export interface TaxInputProps {
  value: TaxValue;
  onChange: (value: TaxValue) => void;

  baseAmount: number;

  onCalculatedChange?: (
    taxAmount: number,
    totalAmount: number
  ) => void;

  label?: string;
  currencySymbol?: string;

  maxRate?: number;
  decimalPlaces?: number;

  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  helperText?: string;

  size?: "small" | "medium";
  fullWidth?: boolean;
  showSummary?: boolean;
}

function TaxInput({
  value,
  onChange,
  baseAmount,
  onCalculatedChange,
  label = "Tax",
  currencySymbol = "Rs.",
  maxRate = 100,
  decimalPlaces = 2,
  disabled = false,
  readOnly = false,
  error = false,
  helperText,
  size = "small",
  fullWidth = true,
  showSummary = true,
}: TaxInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  const precision = Number.isFinite(decimalPlaces)
    ? Math.min(6, Math.max(0, Math.trunc(decimalPlaces)))
    : 2;

  const allowedRate = Number.isFinite(maxRate)
    ? Math.min(100, Math.max(0, maxRate))
    : 0;

  const configurationValid =
    Number.isFinite(baseAmount) &&
    baseAmount >= 0 &&
    Number.isFinite(maxRate) &&
    maxRate >= 0;

  const rateInvalid =
    !Number.isFinite(value.rate) ||
    value.rate < 0 ||
    value.rate > allowedRate;

  const calculated = calculateTax(
    baseAmount,
    value,
    precision
  );

  const hasError =
    error ||
    !configurationValid ||
    rateInvalid ||
    Boolean(localError);

  const errorMessage = !configurationValid
    ? "Invalid tax configuration or base amount."
    : localError
      ? localError
      : rateInvalid
        ? `Tax rate must be between 0 and ${allowedRate}%.`
        : helperText;

  const notifyChange = (next: TaxValue) => {
    onChange(next);

    const result = calculateTax(
      baseAmount,
      next,
      precision
    );

    onCalculatedChange?.(
      result.taxAmount,
      result.totalAmount
    );
  };

  const commitRate = (raw: string) => {
    if (!configurationValid) {
      setLocalError("Invalid tax configuration.");
      return;
    }

    const cleaned = raw.trim();

    if (cleaned === "") {
      const next: TaxValue = {
        ...value,
        rate: 0,
      };

      setDraft(null);
      setLocalError("");

      if (value.rate !== 0) {
        notifyChange(next);
      }

      return;
    }

    const parsed = Number(cleaned);

    if (!Number.isFinite(parsed) || parsed < 0) {
      setLocalError("Enter a valid tax rate.");
      return;
    }

    if (parsed > allowedRate) {
      setLocalError(
        `Maximum allowed tax rate is ${allowedRate}%.`
      );
      return;
    }

    const rounded = roundTaxMoney(
      parsed,
      precision
    );

    const next: TaxValue = {
      ...value,
      rate: rounded,
    };

    setDraft(null);
    setLocalError("");

    if (rounded !== value.rate) {
      notifyChange(next);
    }
  };

  const handleRateChange = (
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
      commitRate(draft);
    }
  };

  const handleModeChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    if (!configurationValid) return;

    const mode = event.target.value as TaxMode;

    if (mode === value.mode) return;

    // Keep the rate unchanged when switching modes.
    const next: TaxValue = {
      ...value,
      mode,
    };

    setDraft(null);
    setLocalError("");

    notifyChange(next);
  };

  const displayRate = draft ?? String(value.rate);

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
          value={value.mode}
          onChange={handleModeChange}
          size={size}
          disabled={
            disabled ||
            readOnly ||
            !configurationValid
          }
          sx={{
            minWidth: 155,
          }}
        >
          <MenuItem value="exclusive">
            Tax Exclusive
          </MenuItem>

          <MenuItem value="inclusive">
            Tax Inclusive
          </MenuItem>
        </TextField>

        <TextField
          value={displayRate}
          onChange={handleRateChange}
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
                  %
                </InputAdornment>
              ),
            },
            htmlInput: {
              inputMode: "decimal",
              autoComplete: "off",
              "aria-label": `${label} rate`,
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
              Price before tax
            </Typography>

            <Typography variant="body2">
              {currencySymbol}{" "}
              {formatTaxMoney(
                calculated.taxableAmount,
                precision
              )}
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
              Tax ({calculated.rate}%)
            </Typography>

            <Typography variant="body2">
              {currencySymbol}{" "}
              {formatTaxMoney(
                calculated.taxAmount,
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
              Total payable
            </Typography>

            <Typography
              variant="body2"
              color="primary"
              sx={{ fontWeight: 700 }}
            >
              {currencySymbol}{" "}
              {formatTaxMoney(
                calculated.totalAmount,
                precision
              )}
            </Typography>
          </Box>
        </Box>
      )}
    </FormControl>
  );
}

export default TaxInput;
