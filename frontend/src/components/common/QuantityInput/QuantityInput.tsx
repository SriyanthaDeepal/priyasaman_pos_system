
import { useState } from "react";
import type { ChangeEvent } from "react";

import {
  Box,
  FormControl,
  FormHelperText,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AddOutlined,
  RemoveOutlined,
} from "@mui/icons-material";

export interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;

  min?: number;
  max?: number;
  step?: number;
  allowDecimals?: boolean;

  label?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;

  disabled?: boolean;
  readOnly?: boolean;
  size?: "small" | "medium";
  compact?: boolean;
  showButtons?: boolean;
  fullWidth?: boolean;
}

const decimalPlaces = (value: number): number => {
  const text = value.toString().toLowerCase();

  if (text.includes("e-")) {
    const [base, exponent] = text.split("e-");
    const fraction = base.split(".")[1]?.length ?? 0;

    return Math.min(
      10,
      fraction + Number(exponent)
    );
  }

  return Math.min(
    10,
    text.split(".")[1]?.length ?? 0
  );
};

const roundTo = (value: number, places: number) =>
  Number(value.toFixed(places));

function QuantityInput({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  allowDecimals = false,
  label,
  helperText,
  error = false,
  errorText,
  disabled = false,
  readOnly = false,
  size = "small",
  compact = false,
  showButtons = true,
  fullWidth = false,
}: QuantityInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const validStep =
    Number.isFinite(step) && step > 0
      ? step
      : 1;

  const effectiveStep = allowDecimals
    ? validStep
    : Math.max(1, Math.round(validStep));

  const precision = allowDecimals
    ? Math.max(
        decimalPlaces(effectiveStep),
        decimalPlaces(min),
        decimalPlaces(value)
      )
    : 0;

  const boundsValid =
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    min <= max;

  const clamp = (number: number) =>
    Math.min(max, Math.max(min, number));

  const normalize = (number: number) => {
    if (!Number.isFinite(number)) {
      return value;
    }

    const rounded = allowDecimals
      ? roundTo(number, precision)
      : Math.round(number);

    return clamp(rounded);
  };

  const commit = (number: number) => {
    if (!boundsValid) return;

    const next = normalize(number);

    setDraft(null);
    setTouched(true);

    if (next !== value) {
      onChange(next);
    }
  };

  const increment = () => {
    commit(
      roundTo(
        value + effectiveStep,
        Math.max(
          precision,
          decimalPlaces(effectiveStep)
        )
      )
    );
  };

  const decrement = () => {
    commit(
      roundTo(
        value - effectiveStep,
        Math.max(
          precision,
          decimalPlaces(effectiveStep)
        )
      )
    );
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const next = event.target.value;

    if (next === "") {
      setDraft("");
      return;
    }

    if (allowDecimals) {
      if (!/^\d*\.?\d*$/.test(next)) return;
    } else {
      if (!/^\d*$/.test(next)) return;
    }

    setDraft(next);
  };

  const handleBlur = () => {
    if (draft === null) return;

    if (draft === "" || draft === ".") {
      setDraft(null);
      return;
    }

    const parsed = Number(draft);

    if (Number.isFinite(parsed)) {
      commit(parsed);
    } else {
      setDraft(null);
    }
  };

  const atMinimum = value <= min;
  const atMaximum = value >= max;

  const canEdit =
    !disabled &&
    !readOnly &&
    boundsValid;

  const outOfRange =
    value < min ||
    value > max ||
    !Number.isFinite(value);

  const hasError =
    error ||
    !boundsValid ||
    outOfRange;

  const displayedError = !boundsValid
    ? "Minimum must be less than or equal to maximum."
    : outOfRange
      ? `Quantity must be between ${min} and ${max}.`
      : errorText;

  const displayValue = draft ?? String(value);

  return (
    <FormControl
      error={hasError}
      disabled={disabled}
      fullWidth={fullWidth}
      sx={{
        minWidth: compact ? 120 : 170,
        maxWidth: fullWidth
          ? "100%"
          : undefined,
      }}
    >
      {label && (
        <Typography
          variant="caption"
          color={
            hasError
              ? "error"
              : "text.secondary"
          }
          sx={{
            mb: 0.5,
            fontWeight: 500,
          }}
        >
          {label}
        </Typography>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          border: 1,
          borderColor: hasError
            ? "error.main"
            : "divider",
          borderRadius: 1.5,
          overflow: "hidden",
          bgcolor: disabled
            ? "action.disabledBackground"
            : "background.paper",
          "&:focus-within": {
            borderColor: hasError
              ? "error.main"
              : "primary.main",
          },
        }}
      >
        {showButtons && (
          <Tooltip title="Decrease quantity">
            <span>
              <IconButton
                size={size}
                disabled={
                  !canEdit || atMinimum
                }
                onClick={decrement}
                aria-label="Decrease quantity"
                sx={{ borderRadius: 0 }}
              >
                <RemoveOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}

        <TextField
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          size={size}
          error={hasError}
          type="text"
          slotProps={{
            htmlInput: {
              inputMode: allowDecimals
                ? "decimal"
                : "numeric",
              "aria-label":
                label ?? "Quantity",
              readOnly: !canEdit,
              style: {
                textAlign: "center",
                paddingLeft: 2,
                paddingRight: 2,
                fontWeight: 600,
              },
            },
          }}
          sx={{
            flex: 1,
            minWidth: 0,
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
          }}
        />

        {showButtons && (
          <Tooltip title="Increase quantity">
            <span>
              <IconButton
                size={size}
                disabled={
                  !canEdit || atMaximum
                }
                onClick={increment}
                aria-label="Increase quantity"
                sx={{ borderRadius: 0 }}
              >
                <AddOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {(helperText ||
        (hasError && displayedError)) && (
        <FormHelperText
          error={hasError}
          sx={{ mx: 0.5 }}
        >
          {hasError
            ? displayedError || helperText
            : helperText}
        </FormHelperText>
      )}

      {touched &&
        !hasError &&
        max !== Number.MAX_SAFE_INTEGER && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Maximum available: {max}
          </Typography>
        )}
    </FormControl>
  );
}

export default QuantityInput;
