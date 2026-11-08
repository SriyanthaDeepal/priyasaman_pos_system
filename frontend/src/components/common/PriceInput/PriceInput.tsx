
import { useState } from "react";
import type { ChangeEvent } from "react";

import {
  InputAdornment,
  TextField,
} from "@mui/material";

export interface PriceInputProps {
  value: number | null;
  onChange: (value: number | null) => void;

  label?: string;
  currency?: string;
  currencySymbol?: string;

  min?: number;
  max?: number;
  decimalPlaces?: number;
  allowNegative?: boolean;

  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  helperText?: string;

  size?: "small" | "medium";
  fullWidth?: boolean;
  placeholder?: string;
  name?: string;
}

const currencySymbols: Record<string, string> = {
  LKR: "Rs.",
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
};

function formatAmount(
  amount: number,
  decimalPlaces: number
): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

function PriceInput({
  value,
  onChange,
  label = "Price",
  currency = "LKR",
  currencySymbol,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  decimalPlaces = 2,
  allowNegative = false,
  required = false,
  disabled = false,
  readOnly = false,
  error = false,
  helperText,
  size = "small",
  fullWidth = true,
  placeholder = "0.00",
  name,
}: PriceInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  const precision = Math.min(
    6,
    Math.max(0, Math.trunc(decimalPlaces))
  );

  const symbol =
    currencySymbol ??
    currencySymbols[currency.toUpperCase()] ??
    currency;

  const effectiveMin = allowNegative
    ? min
    : Math.max(0, min);

  const boundsValid =
    Number.isFinite(effectiveMin) &&
    Number.isFinite(max) &&
    effectiveMin <= max;

  const formattedValue =
    value === null || !Number.isFinite(value)
      ? ""
      : formatAmount(value, precision);

  const displayValue = draft ?? formattedValue;

  const isOutOfRange =
    value !== null &&
    (
      !Number.isFinite(value) ||
      value < effectiveMin ||
      value > max
    );

  const hasError =
    error ||
    Boolean(localError) ||
    !boundsValid ||
    isOutOfRange;

  const validateAndCommit = (text: string) => {
    const cleaned = text.replace(/,/g, "").trim();

    if (cleaned === "") {
      setDraft(null);
      setLocalError(
        required ? "Price is required." : ""
      );
      onChange(null);
      return;
    }

    const parsed = Number(cleaned);

    if (!Number.isFinite(parsed)) {
      setLocalError("Enter a valid price.");
      return;
    }

    if (!boundsValid) {
      setLocalError(
        "Minimum price cannot exceed maximum price."
      );
      return;
    }

    if (parsed < effectiveMin || parsed > max) {
      setLocalError(
        `Price must be between ${effectiveMin} and ${max}.`
      );
      return;
    }

    const rounded = Number(parsed.toFixed(precision));

    setDraft(null);
    setLocalError("");

    if (rounded !== value) {
      onChange(rounded);
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const next = event.target.value.replace(/,/g, "");

    const pattern = allowNegative
      ? /^-?\d*\.?\d*$/
      : /^\d*\.?\d*$/;

    if (!pattern.test(next)) {
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
    if (draft === null) return;

    validateAndCommit(draft);
  };

  const displayError = !boundsValid
    ? "Invalid price limits."
    : localError
      ? localError
      : isOutOfRange
        ? `Price must be between ${effectiveMin} and ${max}.`
        : helperText;

  return (
    <TextField
      name={name}
      label={label}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      error={hasError}
      helperText={displayError}
      size={size}
      fullWidth={fullWidth}
      type="text"
      slotProps={{
        input: {
          readOnly,
          startAdornment: (
            <InputAdornment position="start">
              {symbol}
            </InputAdornment>
          ),
        },
        htmlInput: {
          inputMode: "decimal",
          autoComplete: "off",
          style: {
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
          },
        },
      }}
    />
  );
}

export default PriceInput;
