
import {
  Box,
  Chip,
  Divider,
  Paper,
  Typography,
} from "@mui/material";

import type {
  PaymentSummaryData,
  PaymentStatus,
} from "./payment-summary-models";

import {
  calculatePaymentSummary,
  formatPaymentMoney,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "./payment-summary.utils";

export interface PaymentSummaryProps {
  data: PaymentSummaryData;
  title?: string;
  currencySymbol?: string;
  decimalPlaces?: number;
  compact?: boolean;
  showStatus?: boolean;
  showReference?: boolean;
}

function PaymentSummary({
  data,
  title = "Payment Summary",
  currencySymbol = "Rs.",
  decimalPlaces = 2,
  compact = false,
  showStatus = true,
  showReference = true,
}: PaymentSummaryProps) {
  const result = calculatePaymentSummary(
    data,
    decimalPlaces
  );

  const formatAmount = (amount: number) =>
    `${currencySymbol} ${formatPaymentMoney(
      amount,
      decimalPlaces
    )}`;

  const statusColors: Record<
    PaymentStatus,
    "default" | "warning" | "success" | "info"
  > = {
    unpaid: "default",
    partial: "warning",
    paid: "success",
    overpaid: "info",
  };

  const paymentMethod = data.paymentMethod
    ? PAYMENT_METHOD_LABELS[data.paymentMethod]
    : "Not selected";

  const taxLabel =
    data.taxMode === "none"
      ? "Tax (Not Applied)"
      : `Tax (${data.taxRate}%)${
          data.taxMode === "inclusive"
            ? " - Included"
            : ""
        }`;

  const row = (
    label: string,
    value: string,
    emphasize = false
  ) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Typography
        variant={emphasize ? "body1" : "body2"}
        sx={{
          fontWeight: emphasize ? 700 : 400,
        }}
      >
        {label}
      </Typography>

      <Typography
        variant={emphasize ? "body1" : "body2"}
        sx={{
          fontWeight: emphasize ? 700 : 500,
          textAlign: "right",
        }}
      >
        {value}
      </Typography>
    </Box>
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: compact ? 2 : 3,
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 2,
        }}
      >
        <Typography
          variant={compact ? "subtitle1" : "h6"}
          sx={{ fontWeight: 700 }}
        >
          {title}
        </Typography>

        {showStatus && (
          <Chip
            size="small"
            label={PAYMENT_STATUS_LABELS[result.status]}
            color={statusColors[result.status]}
          />
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: compact ? 1 : 1.5,
        }}
      >
        {row(
          "Subtotal",
          formatAmount(result.subtotal)
        )}

        {row(
          "Discount",
          `- ${formatAmount(result.discountAmount)}`
        )}

        {row(
          taxLabel,
          formatAmount(result.taxAmount)
        )}

        <Divider />

        {row(
          "Total Payable",
          formatAmount(result.totalPayable),
          true
        )}

        <Divider />

        {row("Payment Method", paymentMethod)}

        {row(
          "Amount Received",
          formatAmount(result.amountReceived)
        )}

        {result.balanceDue > 0 &&
          row(
            "Balance Due",
            formatAmount(result.balanceDue),
            true
          )}

        {result.changeAmount > 0 &&
          row(
            data.paymentMethod === "cash"
              ? "Change to Return"
              : "Excess Amount",
            formatAmount(result.changeAmount),
            true
          )}

        {showReference &&
          data.transactionReference &&
          row(
            "Reference",
            data.transactionReference
          )}
      </Box>
    </Paper>
  );
}

export default PaymentSummary;
