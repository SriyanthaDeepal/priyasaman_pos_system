
import { useMemo, useState } from "react";

import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  PersonAddOutlined,
  PersonOutlineOutlined,
  AccountBalanceWalletOutlined,
  CheckCircleOutlineOutlined,
  BlockOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type CustomerAccountStatus =
  | "active"
  | "inactive"
  | "blocked";

export interface POSCustomer {
  id: string;
  customerCode: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;

  accountStatus: CustomerAccountStatus;

  creditEnabled: boolean;
  creditLimit: number;
  outstandingBalance: number;

  notes?: string;
}

export interface CustomerSelectorProps {
  customers: POSCustomer[];
  value: POSCustomer | null;

  onChange: (customer: POSCustomer | null) => void;
  onAddCustomer?: () => void;

  disabled?: boolean;
  loading?: boolean;
  allowWalkIn?: boolean;
  canViewCredit?: boolean;
  error?: string | null;
}

// ============================================
// HELPERS
// ============================================

const formatMoney = (value: number) =>
  `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const availableCredit = (customer: POSCustomer) =>
  Math.max(
    0,
    customer.creditLimit - customer.outstandingBalance
  );

const canUseCredit = (customer: POSCustomer) =>
  customer.accountStatus === "active" &&
  customer.creditEnabled &&
  customer.creditLimit > 0 &&
  customer.outstandingBalance >= 0 &&
  availableCredit(customer) > 0;

// ============================================
// COMPONENT
// ============================================

export default function CustomerSelector({
  customers,
  value,
  onChange,
  onAddCustomer,
  disabled = false,
  loading = false,
  allowWalkIn = true,
  canViewCredit = true,
  error = null,
}: CustomerSelectorProps) {
  const [search, setSearch] = useState("");

  const options = useMemo(
    () =>
      customers.filter(
        (customer) =>
          customer.accountStatus !== "inactive"
      ),
    [customers]
  );

  const selectedCustomer = value;

  const handleSelect = (customer: POSCustomer | null) => {
    onChange(customer);
    setSearch("");
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, borderRadius: 2 }}
    >
      <Stack spacing={3}>
        {/* HEADER */}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            justifyContent: "space-between",
            alignItems: {
              xs: "stretch",
              sm: "center",
            },
            gap: 2,
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "center" }}
          >
            <PersonOutlineOutlined color="primary" />

            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Customer Selector
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Select a customer for this sale
              </Typography>
            </Box>
          </Stack>

          {onAddCustomer && (
            <Button
              variant="outlined"
              startIcon={<PersonAddOutlined />}
              onClick={onAddCustomer}
              disabled={disabled}
            >
              Add Customer
            </Button>
          )}
        </Stack>

        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        {/* CUSTOMER SEARCH */}

        <Autocomplete
          options={options}
          value={selectedCustomer}
          inputValue={search}
          onInputChange={(_, nextValue) =>
            setSearch(nextValue)
          }
          onChange={(_, customer) =>
            handleSelect(customer)
          }
          getOptionLabel={(customer) =>
            `${customer.name} (${customer.customerCode})`
          }
          isOptionEqualToValue={(option, selected) =>
            option.id === selected.id
          }
          filterOptions={(available, state) => {
            const query =
              state.inputValue.toLowerCase().trim();

            return available.filter((customer) =>
              [
                customer.name,
                customer.customerCode,
                customer.phone ?? "",
                customer.email ?? "",
              ]
                .join(" ")
                .toLowerCase()
                .includes(query)
            );
          }}
          disabled={disabled}
          loading={loading}
          renderOption={(props, customer) => {
            const { key, ...optionProps } = props;

            return (
              <Box
                component="li"
                key={key}
                {...optionProps}
              >
                <Stack spacing={0.5} sx={{ py: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600 }}
                  >
                    {customer.name}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {customer.customerCode} ·{" "}
                    {customer.phone ?? "No phone"}
                  </Typography>

                  {canViewCredit &&
                    customer.outstandingBalance > 0 && (
                      <Typography
                        variant="caption"
                        color="error.main"
                      >
                        Due:{" "}
                        {formatMoney(
                          customer.outstandingBalance
                        )}
                      </Typography>
                    )}
                </Stack>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Customer"
              placeholder="Name, phone, customer code..."
            />
          )}
        />

        {allowWalkIn && (
          <Button
            variant="text"
            disabled={disabled}
            onClick={() => handleSelect(null)}
            sx={{ alignSelf: "flex-start" }}
          >
            Use Walk-in Customer
          </Button>
        )}

        <Divider />

        {/* SELECTED CUSTOMER */}

        {!selectedCustomer ? (
          <Alert severity="info">
            Walk-in customer selected. Choose a
            registered customer to access account
            details and credit information.
          </Alert>
        ) : (
          <Stack spacing={3}>
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                gap: 2,
              }}
            >
              <Avatar
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: "primary.main",
                }}
              >
                {selectedCustomer.name
                  .charAt(0)
                  .toUpperCase()}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  {selectedCustomer.name}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {selectedCustomer.customerCode}
                </Typography>
              </Box>

              <Chip
                size="small"
                label={selectedCustomer.accountStatus}
                color={
                  selectedCustomer.accountStatus === "active"
                    ? "success"
                    : "error"
                }
              />
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="body2">
                <strong>Phone:</strong>{" "}
                {selectedCustomer.phone ?? "Not provided"}
              </Typography>

              <Typography variant="body2">
                <strong>Email:</strong>{" "}
                {selectedCustomer.email ?? "Not provided"}
              </Typography>

              <Typography variant="body2">
                <strong>Address:</strong>{" "}
                {selectedCustomer.address ?? "Not provided"}
              </Typography>
            </Stack>

            {canViewCredit && (
              <>
                <Divider />

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <AccountBalanceWalletOutlined
                    color="primary"
                  />

                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700 }}
                  >
                    Customer Credit Account
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                    },
                    gap: 2,
                  }}
                >
                  {[
                    {
                      label: "Credit Limit",
                      amount: selectedCustomer.creditLimit,
                    },
                    {
                      label: "Outstanding Balance",
                      amount:
                        selectedCustomer.outstandingBalance,
                    },
                    {
                      label: "Available Credit",
                      amount:
                        availableCredit(selectedCustomer),
                    },
                  ].map((entry) => (
                    <Paper
                      key={entry.label}
                      variant="outlined"
                      sx={{ p: 2 }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {entry.label}
                      </Typography>

                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700 }}
                      >
                        {formatMoney(entry.amount)}
                      </Typography>
                    </Paper>
                  ))}
                </Box>

                {!selectedCustomer.creditEnabled ? (
                  <Alert severity="info">
                    Credit purchases are disabled for
                    this customer.
                  </Alert>
                ) : canUseCredit(selectedCustomer) ? (
                  <Alert
                    severity="success"
                    icon={<CheckCircleOutlineOutlined />}
                  >
                    Credit account is eligible.
                    Available credit:{" "}
                    {formatMoney(
                      availableCredit(selectedCustomer)
                    )}.
                  </Alert>
                ) : (
                  <Alert
                    severity="warning"
                    icon={<BlockOutlined />}
                  >
                    Credit purchases are currently
                    unavailable. Check account status,
                    credit limit, and outstanding balance.
                  </Alert>
                )}
              </>
            )}

            {selectedCustomer.notes && (
              <Alert severity="info">
                {selectedCustomer.notes}
              </Alert>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
