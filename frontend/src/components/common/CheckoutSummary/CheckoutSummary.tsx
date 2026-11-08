
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Typography,
} from "@mui/material";

import {
  CheckCircleOutlined,
  ReceiptLongOutlined,
} from "@mui/icons-material";

import type {
  CheckoutSummaryData,
} from "./checkout-summary-models";

import {
  calculateCheckoutSummary,
  formatCheckoutMoney,
} from "./checkout-summary.utils";

export interface CheckoutSummaryProps {
  data: CheckoutSummaryData;

  title?: string;
  currencySymbol?: string;
  decimalPlaces?: number;

  compact?: boolean;
  showItems?: boolean;
  showPayments?: boolean;
  showCheckoutButton?: boolean;

  disabled?: boolean;
  processing?: boolean;

  onCheckout?: () => void;
}

function CheckoutSummary({
  data,
  title = "Checkout Summary",
  currencySymbol = "Rs.",
  decimalPlaces = 2,
  compact = false,
  showItems = true,
  showPayments = true,
  showCheckoutButton = true,
  disabled = false,
  processing = false,
  onCheckout,
}: CheckoutSummaryProps) {
  const result = calculateCheckoutSummary(
    data,
    decimalPlaces
  );

  const money = (amount: number) =>
    `${currencySymbol} ${formatCheckoutMoney(
      amount,
      decimalPlaces
    )}`;

  const canCheckout =
    !disabled &&
    !processing &&
    result.isFullyConfirmed;

  const paymentLabels = {
    cash: "Cash",
    card: "Card",
    bank: "Bank Transfer",
    qr: "QR Payment",
  };

  const statusLabel = result.hasInvalidData
    ? "Invalid Data"
    : result.isFullyConfirmed
      ? "Ready to Checkout"
      : result.isFullyAllocated
        ? "Awaiting Confirmation"
        : "Payment Incomplete";

  const statusColor = result.hasInvalidData
    ? "error"
    : result.isFullyConfirmed
      ? "success"
      : "warning";

  const summaryRow = (
    label: string,
    amount: number,
    emphasize = false
  ) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Typography
        variant={emphasize ? "body1" : "body2"}
        sx={{ fontWeight: emphasize ? 700 : 400 }}
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
        {money(amount)}
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
          alignItems: "center",
          justifyContent: "space-between",
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

        <Chip
          size="small"
          color={statusColor}
          label={statusLabel}
        />
      </Box>

      {showItems && (
        <>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, fontWeight: 700 }}
          >
            Cart Items ({result.itemCount})
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              mb: 2,
            }}
          >
            {data.items.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="body2">
                    {item.name}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {item.quantity} ×{" "}
                    {money(item.unitPrice)}
                  </Typography>
                </Box>

                <Typography variant="body2">
                  {money(
                    Math.max(
                      0,
                      item.quantity *
                        item.unitPrice -
                        (item.discountAmount ?? 0)
                    )
                  )}
                </Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ mb: 2 }} />
        </>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: compact ? 1 : 1.5,
        }}
      >
        {summaryRow(
          "Subtotal",
          result.subtotal
        )}

        {result.itemDiscountTotal > 0 &&
          summaryRow(
            "Item Discounts",
            -result.itemDiscountTotal
          )}

        {result.billDiscount > 0 &&
          summaryRow(
            "Bill Discount",
            -result.billDiscount
          )}

        {summaryRow(
          data.taxMode === "none"
            ? "Tax (Not Applied)"
            : `Tax (${data.taxRate}%)${
                data.taxMode === "inclusive"
                  ? " - Included"
                  : ""
              }`,
          result.taxAmount
        )}

        <Divider />

        {summaryRow(
          "Total Payable",
          result.totalPayable,
          true
        )}

        <Divider />

        {summaryRow(
          "Payment Allocated",
          result.allocatedAmount
        )}

        {summaryRow(
          "Payment Confirmed",
          result.confirmedAmount
        )}

        {result.balanceDue > 0 &&
          summaryRow(
            "Remaining Balance",
            result.balanceDue,
            true
          )}

        {result.excessAmount > 0 &&
          summaryRow(
            "Excess Amount",
            result.excessAmount
          )}

        {result.cashChange > 0 &&
          summaryRow(
            "Cash Change",
            result.cashChange,
            true
          )}
      </Box>

      {showPayments && data.payments.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />

          <Typography
            variant="subtitle2"
            sx={{ mb: 1, fontWeight: 700 }}
          >
            Payment Methods
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {data.payments.map((payment) => (
              <Box
                key={payment.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="body2">
                    {paymentLabels[payment.method]}
                  </Typography>

                  {payment.reference && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {payment.reference}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2">
                    {money(payment.amount)}
                  </Typography>

                  <Typography
                    variant="caption"
                    color={
                      payment.confirmed
                        ? "success.main"
                        : "warning.main"
                    }
                  >
                    {payment.confirmed
                      ? "Confirmed"
                      : "Pending"}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}

      {showCheckoutButton && (
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={!canCheckout || !onCheckout}
          onClick={onCheckout}
          startIcon={
            processing ? undefined : (
              <CheckCircleOutlined />
            )
          }
          loading={processing}
          sx={{ mt: 3 }}
        >
          Complete Checkout
        </Button>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          mt: 2,
        }}
      >
        <ReceiptLongOutlined
          sx={{
            fontSize: 17,
            color: "text.secondary",
            mt: 0.2,
          }}
        />

        <Typography
          variant="caption"
          color="text.secondary"
        >
          Payment confirmation and final sale
          validation must be performed by
          the checkout backend.
        </Typography>
      </Box>
    </Paper>
  );
}

export default CheckoutSummary;
