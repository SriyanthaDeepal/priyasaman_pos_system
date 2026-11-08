
import { useMemo, useState } from "react";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AddOutlined,
  DeleteOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  SearchOutlined,
  SwapHorizOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export interface StockLocation {
  id: string;
  name: string;
  code: string;
  type: "store" | "warehouse";
  isActive: boolean;
}

export interface TransferProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  variantId?: string;
  variantName?: string;
  isActive: boolean;
}

export interface TransferInventory {
  locationId: string;
  productId: string;
  variantId?: string;
  availableQuantity: number;
  version?: number;
}

export interface StockTransferItem {
  productId: string;
  variantId?: string;
  quantity: number;
  expectedInventoryVersion?: number;
}

export type StockTransferStatus =
  | "draft"
  | "pending_approval"
  | "in_transit"
  | "received"
  | "cancelled";

export interface StockTransferPayload {
  sourceLocationId: string;
  destinationLocationId: string;
  items: StockTransferItem[];
  notes: string;
  requiresApproval: boolean;
}

export interface StockTransferPanelProps {
  locations: StockLocation[];
  products: TransferProduct[];
  inventory: TransferInventory[];

  onSubmit: (
    payload: StockTransferPayload
  ) => void | Promise<void>;

  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  canTransfer?: boolean;
  requireApproval?: boolean;
  maxItems?: number;
}

interface DraftTransferItem {
  key: string;
  product: TransferProduct;
  quantityInput: string;
}

// ============================================
// HELPERS
// ============================================

const productKey = (
  productId: string,
  variantId?: string
): string =>
  JSON.stringify([productId, variantId ?? null]);

const getProductLabel = (
  product: TransferProduct
): string =>
  product.variantName
    ? `${product.name} — ${product.variantName}`
    : product.name;

// ============================================
// COMPONENT
// ============================================

export default function StockTransferPanel({
  locations,
  products,
  inventory,
  onSubmit,
  disabled = false,
  loading = false,
  error = null,
  canTransfer = true,
  requireApproval = false,
  maxItems = 50,
}: StockTransferPanelProps) {
  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<TransferProduct | null>(null);

  const [draftItems, setDraftItems] = useState<
    DraftTransferItem[]
  >([]);

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [localError, setLocalError] =
    useState<string | null>(null);

  const busy = disabled || loading || submitting;
  const readOnly = busy || !canTransfer;

  // ==========================================
  // ACTIVE LOCATIONS
  // ============================================

  const activeLocations = useMemo(
    () => locations.filter((location) => location.isActive),
    [locations]
  );

  const sourceLocation = activeLocations.find(
    (location) => location.id === sourceId
  );

  const destinationLocation = activeLocations.find(
    (location) => location.id === destinationId
  );

  // ==========================================
  // SOURCE INVENTORY
  // ============================================

  const inventoryMap = useMemo(() => {
    const map = new Map<string, TransferInventory>();

    inventory.forEach((record) => {
      if (record.locationId !== sourceId) return;

      map.set(
        productKey(record.productId, record.variantId),
        record
      );
    });

    return map;
  }, [inventory, sourceId]);

  const getInventory = (product: TransferProduct) =>
    inventoryMap.get(
      productKey(product.id, product.variantId)
    );

  // ==========================================
  // AVAILABLE PRODUCTS
  // ============================================

  const availableProducts = useMemo(() => {
    const selectedKeys = new Set(
      draftItems.map((item) => item.key)
    );

    return products.filter((product) => {
      if (!product.isActive) return false;

      const key = productKey(
        product.id,
        product.variantId
      );

      if (selectedKeys.has(key)) return false;

      const record = inventoryMap.get(key);

      return (
        record !== undefined &&
        Number.isSafeInteger(record.availableQuantity) &&
        record.availableQuantity > 0
      );
    });
  }, [products, inventoryMap, draftItems]);

  // ==========================================
  // VALIDATION
  // ============================================

  const itemDetails = draftItems.map((item) => {
    const record = getInventory(item.product);
    const quantity = Number(item.quantityInput);

    const validQuantity =
      item.quantityInput.trim() !== "" &&
      Number.isSafeInteger(quantity) &&
      quantity > 0;

    const available = record?.availableQuantity ?? 0;

    return {
      ...item,
      quantity,
      available,
      version: record?.version,
      valid:
        validQuantity &&
        record !== undefined &&
        Number.isSafeInteger(available) &&
        quantity <= available,
    };
  });

  const totalUnits = itemDetails.reduce(
    (sum, item) =>
      sum + (item.valid ? item.quantity : 0),
    0
  );

  const allItemsValid =
    itemDetails.length > 0 &&
    itemDetails.every((item) => item.valid);

  const locationsValid =
    Boolean(sourceLocation) &&
    Boolean(destinationLocation) &&
    sourceId !== destinationId;

  const canSubmit =
    !readOnly &&
    locationsValid &&
    allItemsValid &&
    notes.trim().length > 0;

  // ==========================================
  // LOCATION HANDLERS
  // ============================================

  const handleSourceChange = (nextId: string) => {
    setSourceId(nextId);
    setSelectedProduct(null);
    setDraftItems([]);
    setLocalError(null);
  };

  const handleDestinationChange = (nextId: string) => {
    setDestinationId(nextId);
    setLocalError(null);
  };

  const handleSwapLocations = () => {
    if (readOnly) return;

    setSourceId(destinationId);
    setDestinationId(sourceId);
    setSelectedProduct(null);
    setDraftItems([]);
    setLocalError(null);
  };

  // ==========================================
  // ITEM HANDLERS
  // ============================================

  const handleAddProduct = () => {
    if (!selectedProduct || readOnly) return;

    if (draftItems.length >= maxItems) {
      setLocalError(
        `Maximum ${maxItems} products per transfer.`
      );
      return;
    }

    const record = getInventory(selectedProduct);

    if (
      !record ||
      !Number.isSafeInteger(record.availableQuantity) ||
      record.availableQuantity <= 0
    ) {
      setLocalError(
        "Selected product has no available stock."
      );
      return;
    }

    const key = productKey(
      selectedProduct.id,
      selectedProduct.variantId
    );

    if (draftItems.some((item) => item.key === key)) {
      return;
    }

    setDraftItems((previous) => [
      ...previous,
      {
        key,
        product: selectedProduct,
        quantityInput: "1",
      },
    ]);

    setSelectedProduct(null);
    setLocalError(null);
  };

  const handleQuantityChange = (
    key: string,
    value: string
  ) => {
    setDraftItems((previous) =>
      previous.map((item) =>
        item.key === key
          ? { ...item, quantityInput: value }
          : item
      )
    );
  };

  const handleRemoveItem = (key: string) => {
    setDraftItems((previous) =>
      previous.filter((item) => item.key !== key)
    );
  };

  const handleReset = () => {
    if (readOnly) return;

    setSourceId("");
    setDestinationId("");
    setSelectedProduct(null);
    setDraftItems([]);
    setNotes("");
    setLocalError(null);
  };

  // ==========================================
  // SUBMIT
  // ============================================

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setLocalError(null);

    try {
      await onSubmit({
        sourceLocationId: sourceId,
        destinationLocationId: destinationId,

        items: itemDetails.map((item) => ({
          productId: item.product.id,
          variantId: item.product.variantId,
          quantity: item.quantity,
          expectedInventoryVersion: item.version,
        })),

        notes: notes.trim(),
        requiresApproval: requireApproval,
      });

      setSourceId("");
      setDestinationId("");
      setSelectedProduct(null);
      setDraftItems([]);
      setNotes("");
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to submit stock transfer."
      );
    } finally {
      setSubmitting(false);
    }
  };

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
            <LocalShippingOutlined
              color="primary"
              fontSize="large"
            />

            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Stock Transfer
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Transfer inventory between locations
              </Typography>
            </Box>
          </Stack>

          <Chip
            label={
              requireApproval
                ? "Approval Required"
                : "New Transfer"
            }
            color={
              requireApproval ? "warning" : "primary"
            }
            variant="outlined"
          />
        </Stack>

        {(error || localError) && (
          <Alert severity="error">
            {localError || error}
          </Alert>
        )}

        {!canTransfer && (
          <Alert severity="warning">
            You do not have permission to create
            stock transfers.
          </Alert>
        )}

        {/* LOCATIONS */}

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700 }}
        >
          Transfer Locations
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          sx={{
            alignItems: "center",
            gap: 2,
          }}
        >
          <TextField
            select
            fullWidth
            label="Source Location"
            value={sourceId}
            disabled={readOnly}
            onChange={(event) =>
              handleSourceChange(event.target.value)
            }
          >
            {activeLocations.map((location) => (
              <MenuItem
                key={location.id}
                value={location.id}
                disabled={
                  location.id === destinationId
                }
              >
                {location.name} ({location.code})
              </MenuItem>
            ))}
          </TextField>

          <Tooltip title="Swap locations">
            <span>
              <IconButton
                disabled={readOnly}
                onClick={handleSwapLocations}
                color="primary"
              >
                <SwapHorizOutlined />
              </IconButton>
            </span>
          </Tooltip>

          <TextField
            select
            fullWidth
            label="Destination Location"
            value={destinationId}
            disabled={readOnly}
            onChange={(event) =>
              handleDestinationChange(event.target.value)
            }
          >
            {activeLocations.map((location) => (
              <MenuItem
                key={location.id}
                value={location.id}
                disabled={location.id === sourceId}
              >
                {location.name} ({location.code})
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Divider />

        {/* PRODUCT SELECTION */}

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700 }}
        >
          Transfer Items
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            alignItems: "center",
            gap: 2,
          }}
        >
          <Autocomplete
            fullWidth
            options={availableProducts}
            value={selectedProduct}
            disabled={
              readOnly ||
              !sourceId ||
              draftItems.length >= maxItems
            }
            getOptionLabel={(option) =>
              `${getProductLabel(option)} (${option.sku})`
            }
            isOptionEqualToValue={(option, value) =>
              productKey(option.id, option.variantId) ===
              productKey(value.id, value.variantId)
            }
            onChange={(_, value) =>
              setSelectedProduct(value)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Product"
                placeholder="Name, SKU or barcode"
                slotProps={{
                  input: {
                    ...params.slotProps.input,
                    startAdornment: (
                      <>
                        <SearchOutlined
                          color="action"
                          sx={{ mr: 1 }}
                        />
                        {params.slotProps.input?.startAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
            filterOptions={(options, state) => {
              const query =
                state.inputValue.toLowerCase().trim();

              return options.filter((option) =>
                [
                  option.name,
                  option.sku,
                  option.barcode ?? "",
                  option.variantName ?? "",
                ]
                  .join(" ")
                  .toLowerCase()
                  .includes(query)
              );
            }}
          />

          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            disabled={
              readOnly ||
              !selectedProduct ||
              draftItems.length >= maxItems
            }
            onClick={handleAddProduct}
            sx={{ whiteSpace: "nowrap" }}
          >
            Add Item
          </Button>
        </Stack>

        {/* ITEM LIST */}

        {itemDetails.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              textAlign: "center",
              borderStyle: "dashed",
            }}
          >
            <Inventory2Outlined
              sx={{
                fontSize: 40,
                color: "text.disabled",
                mb: 1,
              }}
            />

            <Typography color="text.secondary">
              No products added to this transfer.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {itemDetails.map((item) => (
              <Paper
                key={item.key}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  sx={{
                    justifyContent: "space-between",
                    alignItems: {
                      xs: "stretch",
                      sm: "center",
                    },
                    gap: 2,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{ fontWeight: 700 }}
                    >
                      {getProductLabel(item.product)}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      SKU: {item.product.sku}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Available: {item.available}
                    </Typography>
                  </Box>

                  <TextField
                    type="number"
                    size="small"
                    label="Quantity"
                    value={item.quantityInput}
                    disabled={readOnly}
                    error={!item.valid}
                    onChange={(event) =>
                      handleQuantityChange(
                        item.key,
                        event.target.value
                      )
                    }
                    slotProps={{
                      htmlInput: {
                        min: 1,
                        max: item.available,
                        step: 1,
                      },
                    }}
                    sx={{
                      width: {
                        xs: "100%",
                        sm: 140,
                      },
                    }}
                  />

                  <Tooltip title="Remove item">
                    <span>
                      <IconButton
                        color="error"
                        disabled={readOnly}
                        onClick={() =>
                          handleRemoveItem(item.key)
                        }
                      >
                        <DeleteOutlined />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>

                {!item.valid && (
                  <Typography
                    variant="caption"
                    color="error"
                  >
                    Enter a valid quantity within
                    available stock.
                  </Typography>
                )}
              </Paper>
            ))}
          </Stack>
        )}

        {/* SUMMARY */}

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            bgcolor: "action.hover",
          }}
        >
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography>
              {draftItems.length} product(s)
            </Typography>

            <Typography
              sx={{ fontWeight: 700 }}
            >
              Total Units: {totalUnits}
            </Typography>
          </Stack>
        </Paper>

        {/* NOTES */}

        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Transfer Notes"
          placeholder="Reason for transfer, delivery instructions..."
          value={notes}
          disabled={readOnly}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          required
        />

        {requireApproval && (
          <Alert severity="warning">
            This transfer requires approval.
            Submitting it should create a pending
            request, not immediately move stock.
          </Alert>
        )}

        {/* ACTIONS */}

        <Divider />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            justifyContent: "flex-end",
            gap: 2,
          }}
        >
          <Button
            variant="outlined"
            disabled={readOnly}
            onClick={handleReset}
          >
            Clear
          </Button>

          <Button
            variant="contained"
            startIcon={
              submitting ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <LocalShippingOutlined />
              )
            }
            disabled={!canSubmit}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {submitting
              ? "Submitting..."
              : requireApproval
                ? "Request Transfer Approval"
                : "Create Transfer"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
