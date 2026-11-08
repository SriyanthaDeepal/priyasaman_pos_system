
import { useId, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AddShoppingCartOutlined,
  Inventory2Outlined,
  RefreshOutlined,
  SwapHorizOutlined,
  TuneOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";

import type {
  LowStockProduct,
  StockAlertStatus,
  StockAlertFilter,
  LowStockAlertPanelProps,
} from "./types";

import {
  getStockStatus,
  getSuggestedReorderQuantity,
} from "./utils";

// ============================================
// PRIVATE HELPERS
// ============================================

function getStatusLabel(
  status: StockAlertStatus
): string {
  switch (status) {
    case "out_of_stock":
      return "Out of Stock";
    case "low_stock":
      return "Low Stock";
    case "healthy":
      return "Healthy";
  }
}

function getStatusColor(
  status: StockAlertStatus
): "error" | "warning" | "success" {
  switch (status) {
    case "out_of_stock":
      return "error";
    case "low_stock":
      return "warning";
    case "healthy":
      return "success";
  }
}

const STATUS_PRIORITY: Record<
  StockAlertStatus,
  number
> = {
  out_of_stock: 0,
  low_stock: 1,
  healthy: 2,
};

function getRecordKey(
  product: LowStockProduct
): string {
  return JSON.stringify([
    product.locationId,
    product.id,
    product.variantId ?? null,
  ]);
}

// ============================================
// COMPONENT
// ============================================

export default function LowStockAlertPanel({
  products,
  onAdjustStock,
  onTransferStock,
  onReorder,
  onRefresh,
  loading = false,
  error = null,
  canAdjust = true,
  canTransfer = true,
  canReorder = true,
  showHealthyProducts = true,
}: LowStockAlertPanelProps) {
  const filterId = useId();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StockAlertFilter>("alerts");

  const [locationFilter, setLocationFilter] =
    useState("all");

  const [actionKey, setActionKey] =
    useState<string | null>(null);

  const [localError, setLocalError] =
    useState<string | null>(null);

  // ==========================================
  // ACTIVE INVENTORY
  // ============================================

  const activeProducts = useMemo(
    () =>
      products.filter((product) => product.isActive),
    [products]
  );

  // ==========================================
  // SUMMARY
  // ============================================

  const summary = useMemo(() => {
    const result = {
      total: activeProducts.length,
      outOfStock: 0,
      lowStock: 0,
      healthy: 0,
    };

    activeProducts.forEach((product) => {
      const status = getStockStatus(product);

      if (status === "out_of_stock") {
        result.outOfStock++;
      } else if (status === "low_stock") {
        result.lowStock++;
      } else {
        result.healthy++;
      }
    });

    return result;
  }, [activeProducts]);

  const totalAlerts =
    summary.outOfStock + summary.lowStock;

  // ==========================================
  // LOCATIONS
  // ============================================

  const locations = useMemo(() => {
    const locationMap = new Map<string, string>();

    activeProducts.forEach((product) => {
      locationMap.set(
        product.locationId,
        product.locationName
      );
    });

    return Array.from(locationMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeProducts]);

  // ==========================================
  // FILTERING
  // ============================================

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return activeProducts
      .filter((product) => {
        const status = getStockStatus(product);

        if (
          !showHealthyProducts &&
          status === "healthy"
        ) {
          return false;
        }

        if (
          statusFilter === "alerts" &&
          status === "healthy"
        ) {
          return false;
        }

        if (
          statusFilter !== "all" &&
          statusFilter !== "alerts" &&
          status !== statusFilter
        ) {
          return false;
        }

        if (
          locationFilter !== "all" &&
          product.locationId !== locationFilter
        ) {
          return false;
        }

        if (!query) return true;

        return [
          product.name,
          product.sku,
          product.barcode ?? "",
          product.variantName ?? "",
          product.locationName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const priorityDifference =
          STATUS_PRIORITY[getStockStatus(a)] -
          STATUS_PRIORITY[getStockStatus(b)];

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        const quantityDifference =
          a.availableQuantity - b.availableQuantity;

        if (quantityDifference !== 0) {
          return quantityDifference;
        }

        return a.name.localeCompare(b.name);
      });
  }, [
    activeProducts,
    search,
    statusFilter,
    locationFilter,
    showHealthyProducts,
  ]);

  // ==========================================
  // ACTION HANDLER
  // ============================================

  const runAction = async (
    key: string,
    action: () => void | Promise<void>
  ) => {
    if (loading || actionKey !== null) return;

    setActionKey(key);
    setLocalError(null);

    try {
      await action();
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to complete the action."
      );
    } finally {
      setActionKey(null);
    }
  };

  const isBusy = loading || actionKey !== null;

  // ==========================================
  // RENDER
  // ============================================

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
      }}
    >
      <Stack spacing={3}>
        {/* HEADER */}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            justifyContent: "space-between",
            alignItems: {
              xs: "flex-start",
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
            <WarningAmberOutlined
              color="warning"
              fontSize="large"
            />

            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Inventory Stock Alerts
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Monitor inventory and replenishment needs
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center" }}
          >
            <Chip
              color={
                totalAlerts > 0 ? "warning" : "success"
              }
              label={`${totalAlerts} Alerts`}
            />

            {onRefresh && (
              <Tooltip title="Refresh inventory">
                <span>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={isBusy}
                    startIcon={
                      actionKey === "refresh" ? (
                        <CircularProgress size={16} />
                      ) : (
                        <RefreshOutlined />
                      )
                    }
                    onClick={() => {
                      void runAction(
                        "refresh",
                        onRefresh
                      );
                    }}
                  >
                    Refresh
                  </Button>
                </span>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        {/* ERROR */}

        {(error || localError) && (
          <Alert
            severity="error"
            onClose={() => setLocalError(null)}
          >
            {localError || error}
          </Alert>
        )}

        {/* SUMMARY CARDS */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {[
            {
              label: "Total Products",
              value: summary.total,
              color: "text.primary",
            },
            {
              label: "Out of Stock",
              value: summary.outOfStock,
              color: "error.main",
            },
            {
              label: "Low Stock",
              value: summary.lowStock,
              color: "warning.main",
            },
            {
              label: "Healthy Stock",
              value: summary.healthy,
              color: "success.main",
            },
          ].map((item) => (
            <Paper
              key={item.label}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {item.label}
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: item.color,
                  mt: 1,
                }}
              >
                {item.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Divider />

        {/* FILTER HEADER */}

        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center" }}
        >
          <TuneOutlined color="action" />

          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700 }}
          >
            Filter Inventory
          </Typography>
        </Stack>

        {/* FILTER CONTROLS */}

        <Stack
          direction={{ xs: "column", md: "row" }}
          sx={{ gap: 2 }}
        >
          <TextField
            fullWidth
            size="small"
            label="Search Products"
            placeholder="Name, SKU, barcode..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <FormControl
            size="small"
            sx={{ minWidth: 170 }}
          >
            <InputLabel
              id={`${filterId}-status-label`}
            >
              Stock Status
            </InputLabel>

            <Select
              labelId={`${filterId}-status-label`}
              label="Stock Status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as StockAlertFilter
                )
              }
            >
              <MenuItem value="all">
                All Products
              </MenuItem>

              <MenuItem value="alerts">
                All Alerts
              </MenuItem>

              <MenuItem value="out_of_stock">
                Out of Stock
              </MenuItem>

              <MenuItem value="low_stock">
                Low Stock
              </MenuItem>

              {showHealthyProducts && (
                <MenuItem value="healthy">
                  Healthy
                </MenuItem>
              )}
            </Select>
          </FormControl>

          <FormControl
            size="small"
            sx={{ minWidth: 180 }}
          >
            <InputLabel
              id={`${filterId}-location-label`}
            >
              Location
            </InputLabel>

            <Select
              labelId={`${filterId}-location-label`}
              label="Location"
              value={locationFilter}
              onChange={(event) =>
                setLocationFilter(event.target.value)
              }
            >
              <MenuItem value="all">
                All Locations
              </MenuItem>

              {locations.map((location) => (
                <MenuItem
                  key={location.id}
                  value={location.id}
                >
                  {location.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* RESULTS COUNT */}

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Showing {filteredProducts.length} inventory
          record(s)
        </Typography>

        {/* EMPTY STATE */}

        {filteredProducts.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 5,
              textAlign: "center",
              borderStyle: "dashed",
            }}
          >
            <Inventory2Outlined
              sx={{
                fontSize: 48,
                color: "text.disabled",
                mb: 1,
              }}
            />

            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700 }}
            >
              No matching inventory records
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Try adjusting your search or filters.
            </Typography>
          </Paper>
        ) : (
          /* PRODUCT ALERT CARDS */

          <Stack spacing={2}>
            {filteredProducts.map((product) => {
              const status = getStockStatus(product);

              const suggestedQuantity =
                getSuggestedReorderQuantity(product);

              const key = getRecordKey(product);

              return (
                <Paper
                  key={key}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                  }}
                >
                  <Stack spacing={2}>
                    {/* PRODUCT HEADER */}

                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      sx={{
                        justifyContent: "space-between",
                        alignItems: {
                          xs: "flex-start",
                          sm: "center",
                        },
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{ fontWeight: 700 }}
                        >
                          {product.name}
                          {product.variantName
                            ? ` — ${product.variantName}`
                            : ""}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          SKU: {product.sku}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {product.locationName}
                        </Typography>
                      </Box>

                      <Chip
                        label={getStatusLabel(status)}
                        color={getStatusColor(status)}
                        size="small"
                      />
                    </Stack>

                    {/* PRODUCT METRICS */}

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "repeat(2, minmax(0, 1fr))",
                          sm: "repeat(4, minmax(0, 1fr))",
                        },
                        gap: 2,
                      }}
                    >
                      {[
                        {
                          label: "Available",
                          value: product.availableQuantity,
                        },
                        {
                          label: "Reorder Point",
                          value: product.reorderPoint,
                        },
                        {
                          label: "Target Level",
                          value: product.targetStockLevel,
                        },
                        {
                          label: "Suggested Reorder",
                          value: suggestedQuantity,
                        },
                      ].map((metric) => (
                        <Box key={metric.label}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {metric.label}
                          </Typography>

                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700 }}
                          >
                            {metric.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Divider />

                    {/* ACTIONS */}

                    <Stack
                      direction="row"
                      sx={{
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      {onAdjustStock && canAdjust && (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={isBusy}
                          startIcon={<TuneOutlined />}
                          onClick={() => {
                            void runAction(
                              `${key}:adjust`,
                              () => onAdjustStock(product)
                            );
                          }}
                        >
                          Adjust Stock
                        </Button>
                      )}

                      {onTransferStock && canTransfer && (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={isBusy}
                          startIcon={
                            <SwapHorizOutlined />
                          }
                          onClick={() => {
                            void runAction(
                              `${key}:transfer`,
                              () => onTransferStock(product)
                            );
                          }}
                        >
                          Transfer
                        </Button>
                      )}

                      {onReorder &&
                        canReorder &&
                        suggestedQuantity > 0 && (
                          <Button
                            size="small"
                            variant="contained"
                            disabled={isBusy}
                            startIcon={
                              <AddShoppingCartOutlined />
                            }
                            onClick={() => {
                              void runAction(
                                `${key}:reorder`,
                                () =>
                                  onReorder({
                                    product,
                                    suggestedQuantity,
                                  })
                              );
                            }}
                          >
                            Reorder {suggestedQuantity}
                          </Button>
                        )}
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
