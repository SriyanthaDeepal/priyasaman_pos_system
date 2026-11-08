
import { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddShoppingCartOutlined,
  Inventory2Outlined,
  QrCodeOutlined,
  SearchOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string;

  attributes: Record<string, string>;

  sellingPrice: number;
  availableQuantity: number;
  lowStockThreshold: number;

  isActive: boolean;
}

export interface VariantProduct {
  id: string;
  name: string;
  sku: string;
  description?: string;
}

export interface ProductVariantSelection {
  product: VariantProduct;
  variant: ProductVariant;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ProductVariantSelectorProps {
  open: boolean;
  product: VariantProduct | null;
  variants: ProductVariant[];

  onClose: () => void;

  onSelect: (
    selection: ProductVariantSelection
  ) => void | Promise<void>;

  loading?: boolean;
  disabled?: boolean;

  maxQuantityPerSelection?: number;

  // Quantity already present in the active cart,
  // indexed by variant ID.
  cartQuantities?: Record<string, number>;

  error?: string | null;
}

// ============================================
// HELPERS
// ============================================

const formatMoney = (value: number): string =>
  `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const getStockStatus = (variant: ProductVariant) => {
  if (variant.availableQuantity <= 0) {
    return {
      label: "Out of Stock",
      color: "error" as const,
    };
  }

  if (
    variant.availableQuantity <=
    variant.lowStockThreshold
  ) {
    return {
      label: "Low Stock",
      color: "warning" as const,
    };
  }

  return {
    label: "In Stock",
    color: "success" as const,
  };
};

// ============================================
// COMPONENT
// ============================================

export default function ProductVariantSelector({
  open,
  product,
  variants,
  onClose,
  onSelect,
  loading = false,
  disabled = false,
  maxQuantityPerSelection = 999,
  cartQuantities = {},
  error = null,
}: ProductVariantSelectorProps) {
  const [search, setSearch] = useState("");

  const [selectedVariantId, setSelectedVariantId] =
    useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);

  const [submitting, setSubmitting] = useState(false);

  const [localError, setLocalError] =
    useState<string | null>(null);

  const busy = disabled || submitting;

  // ==========================================
  // FILTER VARIANTS
  // ============================================

  const filteredVariants = useMemo(() => {
    const query = search.trim().toLowerCase();

    return variants
      .filter(
        (variant) =>
          variant.isActive &&
          variant.productId === product?.id
      )
      .filter((variant) => {
        if (!query) return true;

        const searchable = [
          variant.name,
          variant.sku,
          variant.barcode ?? "",
          ...Object.values(variant.attributes),
        ];

        return searchable
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
  }, [variants, product?.id, search]);

  const selectedVariant = variants.find(
    (variant) =>
      variant.id === selectedVariantId &&
      variant.productId === product?.id &&
      variant.isActive
  );

  const alreadyInCart = selectedVariant
    ? Math.max(
        0,
        cartQuantities[selectedVariant.id] ?? 0
      )
    : 0;

  const availableForSelection = selectedVariant
    ? Math.max(
        0,
        selectedVariant.availableQuantity -
          alreadyInCart
      )
    : 0;

  const maxAllowedQuantity = Math.min(
    maxQuantityPerSelection,
    availableForSelection
  );

  const estimatedTotal = selectedVariant
    ? roundMoney(
        selectedVariant.sellingPrice * quantity
      )
    : 0;

  // ==========================================
  // HANDLERS
  // ============================================

  const handleChooseVariant = (
    variant: ProductVariant
  ) => {
    if (busy) return;

    const inCart = Math.max(
      0,
      cartQuantities[variant.id] ?? 0
    );

    if (
      variant.availableQuantity - inCart <= 0
    ) {
      setLocalError(
        `${variant.name} has no remaining stock available.`
      );
      return;
    }

    setSelectedVariantId(variant.id);
    setQuantity(1);
    setLocalError(null);
  };

  const handleClose = () => {
    if (busy) return;

    setSearch("");
    setSelectedVariantId(null);
    setQuantity(1);
    setLocalError(null);

    onClose();
  };

  const handleAddToCart = async () => {
    if (
      !product ||
      !selectedVariant ||
      busy
    ) {
      return;
    }

    if (
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      quantity > maxAllowedQuantity
    ) {
      setLocalError(
        "Please enter a valid quantity."
      );
      return;
    }

    if (
      !Number.isFinite(selectedVariant.sellingPrice) ||
      selectedVariant.sellingPrice < 0
    ) {
      setLocalError("Invalid variant price.");
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      await onSelect({
        product,
        variant: selectedVariant,
        quantity,
        unitPrice: selectedVariant.sellingPrice,
        lineTotal: estimatedTotal,
      });

      setSearch("");
      setSelectedVariantId(null);
      setQuantity(1);

      onClose();
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to add variant to cart."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // RENDER
  // ============================================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center" }}
        >
          <Inventory2Outlined color="primary" />

          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              Select Product Variant
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {product?.name ?? "No product selected"}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {(error || localError) && (
            <Alert
              severity="error"
              onClose={() => setLocalError(null)}
            >
              {localError || error}
            </Alert>
          )}

          {/* PRODUCT INFORMATION */}

          {product && (
            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 2 }}
            >
              <Typography
                sx={{ fontWeight: 700 }}
              >
                {product.name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                SKU: {product.sku}
              </Typography>

              {product.description && (
                <Typography
                  variant="body2"
                  sx={{ mt: 1 }}
                >
                  {product.description}
                </Typography>
              )}
            </Paper>
          )}

          {/* SEARCH */}

          <TextField
            fullWidth
            label="Search Variants"
            placeholder="Size, color, SKU, barcode..."
            value={search}
            disabled={busy}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined />
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* VARIANT LIST */}

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 4,
              }}
            >
              <CircularProgress />
            </Box>
          ) : filteredVariants.length === 0 ? (
            <Alert severity="info">
              No available variants found.
            </Alert>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                },
                gap: 2,
                maxHeight: 360,
                overflowY: "auto",
              }}
            >
              {filteredVariants.map((variant) => {
                const stock = getStockStatus(variant);

                const remaining = Math.max(
                  0,
                  variant.availableQuantity -
                    Math.max(
                      0,
                      cartQuantities[variant.id] ?? 0
                    )
                );

                const isSelected =
                  selectedVariantId === variant.id;

                return (
                  <Paper
                    key={variant.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: isSelected
                        ? "primary.main"
                        : "divider",
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Typography
                        sx={{ fontWeight: 700 }}
                      >
                        {variant.name}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        SKU: {variant.sku}
                      </Typography>

                      {variant.barcode && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{ alignItems: "center" }}
                        >
                          <QrCodeOutlined
                            fontSize="small"
                            color="action"
                          />

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {variant.barcode}
                          </Typography>
                        </Stack>
                      )}

                      <Stack
                        direction="row"
                        sx={{
                          flexWrap: "wrap",
                          gap: 0.5,
                        }}
                      >
                        {Object.entries(
                          variant.attributes
                        ).map(([key, value]) => (
                          <Chip
                            key={key}
                            size="small"
                            variant="outlined"
                            label={`${key}: ${value}`}
                          />
                        ))}
                      </Stack>

                      <Stack
                        direction="row"
                        sx={{
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Chip
                          size="small"
                          label={stock.label}
                          color={stock.color}
                        />

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Available: {remaining}
                        </Typography>
                      </Stack>

                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700 }}
                      >
                        {formatMoney(
                          variant.sellingPrice
                        )}
                      </Typography>

                      <Button
                        variant={
                          isSelected
                            ? "contained"
                            : "outlined"
                        }
                        disabled={busy || remaining <= 0}
                        onClick={() =>
                          handleChooseVariant(variant)
                        }
                      >
                        {isSelected
                          ? "Selected"
                          : "Select Variant"}
                      </Button>
                    </Stack>
                  </Paper>
                );
              })}
            </Box>
          )}

          {/* SELECTED VARIANT */}

          {selectedVariant && (
            <>
              <Divider />

              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700 }}
              >
                Selected Variant
              </Typography>

              <Paper
                variant="outlined"
                sx={{ p: 2 }}
              >
                <Stack spacing={2}>
                  <Typography
                    sx={{ fontWeight: 700 }}
                  >
                    {selectedVariant.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Remaining stock:{" "}
                    {availableForSelection}
                  </Typography>

                  <TextField
                    label="Quantity"
                    type="number"
                    value={quantity}
                    disabled={busy}
                    onChange={(event) => {
                      const value = Number(
                        event.target.value
                      );

                      if (
                        Number.isSafeInteger(value) &&
                        value >= 1
                      ) {
                        setQuantity(
                          Math.min(
                            value,
                            maxAllowedQuantity
                          )
                        );
                      }
                    }}
                    slotProps={{
                      htmlInput: {
                        min: 1,
                        max: maxAllowedQuantity,
                        step: 1,
                      },
                    }}
                    sx={{ maxWidth: 180 }}
                  />

                  <Stack
                    direction="row"
                    sx={{
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography>
                      Estimated Line Total
                    </Typography>

                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700 }}
                    >
                      {formatMoney(estimatedTotal)}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          disabled={busy}
          onClick={handleClose}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          startIcon={<AddShoppingCartOutlined />}
          disabled={
            busy ||
            !selectedVariant ||
            quantity <= 0 ||
            quantity > maxAllowedQuantity
          }
          onClick={() => {
            void handleAddToCart();
          }}
        >
          {submitting
            ? "Adding..."
            : "Add to Cart"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
