
import {
  Box,
  FormControl,
  FormHelperText,
  Typography,
  useTheme,
} from "@mui/material";

import {
  AccountBalanceOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  PaymentsOutlined,
  QrCode2Outlined,
} from "@mui/icons-material";

import type {
  PaymentMethodId,
  PaymentMethodOption,
} from "./payment-method-models";

import {
  DEFAULT_PAYMENT_METHODS,
} from "./payment-method-models";

export interface PaymentMethodSelectorProps {
  value: PaymentMethodId | null;

  onChange: (method: PaymentMethodId) => void;

  options?: PaymentMethodOption[];

  label?: string;
  helperText?: string;
  error?: boolean;

  disabled?: boolean;
  readOnly?: boolean;

  columns?: 1 | 2 | 3 | 4;
  fullWidth?: boolean;
}

const METHOD_ICONS = {
  cash: PaymentsOutlined,
  card: CreditCardOutlined,
  bank: AccountBalanceOutlined,
  qr: QrCode2Outlined,
};

function PaymentMethodSelector({
  value,
  onChange,
  options = DEFAULT_PAYMENT_METHODS,
  label = "Payment Method",
  helperText,
  error = false,
  disabled = false,
  readOnly = false,
  columns = 2,
  fullWidth = true,
}: PaymentMethodSelectorProps) {
  const theme = useTheme();

  const handleSelect = (
    method: PaymentMethodOption
  ) => {
    if (
      disabled ||
      readOnly ||
      method.disabled ||
      value === method.id
    ) {
      return;
    }

    onChange(method.id);
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      error={error}
      disabled={disabled}
    >
      {label && (
        <Typography
          variant="caption"
          color={error ? "error" : "text.secondary"}
          sx={{
            mb: 1,
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: `repeat(${columns}, minmax(0, 1fr))`,
          },
          gap: 1.5,
        }}
      >
        {options.map((method) => {
          const Icon = METHOD_ICONS[method.id];

          const selected = value === method.id;

          const isDisabled =
            disabled || method.disabled;

          return (
            <Box
              key={method.id}
              component="button"
              type="button"
              onClick={() => handleSelect(method)}
              disabled={isDisabled || readOnly}
              aria-pressed={selected}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                textAlign: "left",
                gap: 1,
                p: 2,
                minHeight: 116,
                width: "100%",
                borderRadius: 2,
                border: "2px solid",
                borderColor: selected
                  ? "primary.main"
                  : "divider",
                bgcolor: selected
                  ? "action.selected"
                  : "background.paper",
                color: "text.primary",
                cursor:
                  isDisabled || readOnly
                    ? "not-allowed"
                    : "pointer",
                opacity: isDisabled ? 0.5 : 1,
                transition: "all 0.15s ease",
                "&:hover": {
                  borderColor:
                    isDisabled || readOnly
                      ? undefined
                      : "primary.main",
                  bgcolor:
                    isDisabled || readOnly
                      ? undefined
                      : "action.hover",
                },
                "&:focus-visible": {
                  outline: `3px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Icon
                  sx={{
                    fontSize: 27,
                    color: selected
                      ? "primary.main"
                      : "text.secondary",
                  }}
                />

                {selected && (
                  <CheckCircleOutlined
                    color="primary"
                    fontSize="small"
                  />
                )}
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700 }}
                >
                  {method.label}
                </Typography>

                {method.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {method.description}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {(helperText || error) && (
        <FormHelperText
          error={error}
          sx={{ mx: 0.5, mt: 1 }}
        >
          {helperText ??
            (error ? "Select a payment method." : "")}
        </FormHelperText>
      )}
    </FormControl>
  );
}

export default PaymentMethodSelector;
