
import { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddShoppingCartOutlined,
  Inventory2Outlined,
  QrCodeScannerOutlined,
  SearchOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export interface POSProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId?: string;
  categoryName?: string;

  sellingPrice: number;
  availableQuantity: number;
  lowStockThreshold: number;

  isActive: boolean;
  imageUrl?: string;

  // Products requiring a variant must be
  // resolved before adding to the cart.
  hasVariants?: boolean;
}

export interface ProductSelection {
  product: POSProduct;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ProductSelectorProps {
  products: POSProduct[];

  onSelect: (
    selection: ProductSelection
  ) => void | Promise<void>;

  onVariantRequired?: (
    product: POSProduct
  ) => void;

  disabled?: boolean;
  loading?: boolean;
  allowOutOfStock?: boolean;
  maxQuantityPerSelection?: number;
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

const getStockStatus = (product: POSProduct) => {
  if (product.availableQuantity <= 0) {
    return {
      label: "Out of Stock",
      color: "error" as const,
    };
  }

  if (
    product.availableQuantity <=
    product.lowStockThreshold
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

export default function ProductSelector({
  products,
  onSelect,
  onVariantRequired,
  disabled = false,
  loading = false,
  allowOutOfStock = false,
  maxQuantityPerSelection = 999,
  error = null,
}: ProductSelectorProps) {
  const [search, setSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("all");

  const [selectedProductId, setSelectedProductId] =
    useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [localError, setLocalError] =
    useState<string | null>(null);

  const busy = disabled || submitting;

  // ==========================================
  // CATEGORIES
  // ============================================

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .filter((product) => product.isActive)
            .map((product) => product.categoryName)
            .filter((value): value is string =>
              Boolean(value)
            )
        )
      ).sort(),
    [products]
  );

  // ==========================================
  // PRODUCT FILTERING
  // ============================================

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter((product) => product.isActive)
      .filter(
        (product) =>
          category === "all" ||
          product.categoryName === category
      )
      .filter((product) => {
        if (!query) return true;

        return [
          product.name,
          product.sku,
          product.barcode ?? "",
          product.categoryName ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
  }, [products, search, category]);

  const selectedProduct = products.find(
    (product) => product.id === selectedProductId
  );

  const maxAllowedQuantity = selectedProduct
    ? allowOutOfStock
      ? maxQuantityPerSelection
      : Math.min(
          maxQuantityPerSelection,
          Math.max(0, selectedProduct.availableQuantity)
        )
    : 0;

  const estimatedTotal = selectedProduct
    ? roundMoney(selectedProduct.sellingPrice * quantity)
    : 0;

  // ==========================================
  // SELECT PRODUCT
  // ============================================

  const chooseProduct = (product: POSProduct) => {
    if (busy) return;

    setLocalError(null);

    if (product.hasVariants) {
      if (!onVariantRequired) {
        setLocalError(
          "This product requires variant selection."
        );
        return;
      }

      onVariantRequired(product);
      return;
    }

    if (
      !allowOutOfStock &&
      product.availableQuantity <= 0
    ) {
      setLocalError(
        `${product.name} is out of stock.`
      );
      return;
    }

    setSelectedProductId(product.id);
    setQuantity(1);
  };

  // ==========================================
  // BARCODE SEARCH
  // ============================================

  const handleBarcode = () => {
    const scanned = barcode.trim();

    if (!scanned) return;

    const product = products.find(
      (item) =>
        item.isActive &&
        (item.barcode === scanned ||
          item.sku.toLowerCase() ===
            scanned.toLowerCase())
    );

    if (!product) {
      setLocalError(
        `No active product found for "${scanned}".`
      );
      return;
    }

    chooseProduct(product);
    setBarcode("");
  };

  // ==========================================
  // ADD TO CART
  // ============================================

  const handleAddToCart = async () => {
    if (!selectedProduct || busy) return;

    if (selectedProduct.hasVariants) {
      setLocalError(
        "Select a product variant first."
      );
      return;
    }

    if (
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      quantity > maxAllowedQuantity
    ) {
      setLocalError(
        "Enter a valid quantity within the allowed limit."
      );
      return;
    }

    if (
      !Number.isFinite(selectedProduct.sellingPrice) ||
      selectedProduct.sellingPrice < 0
    ) {
      setLocalError("Invalid product price.");
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      await onSelect({
        product: selectedProduct,
        quantity,
        unitPrice: selectedProduct.sellingPrice,
        lineTotal: estimatedTotal,
      });

      setSelectedProductId(null);
      setQuantity(1);
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to add product to cart."
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
            <Inventory2Outlined color="primary" />

            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Product Selector
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Search products and add them to a sale
              </Typography>
            </Box>
          </Stack>

          <Chip
            label={`${filteredProducts.length} Products`}
            variant="outlined"
          />
        </Stack>

        {(error || localError) && (
          <Alert
            severity="error"
            onClose={() => setLocalError(null)}
          >
            {localError || error}
          </Alert>
        )}

        {/* BARCODE INPUT */}

        <TextField
          label="Scan Barcode"
          placeholder="Scan barcode and press Enter"
          value={barcode}
          disabled={busy}
          onChange={(event) =>
            setBarcode(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleBarcode();
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <QrCodeScannerOutlined />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* FILTERS */}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ gap: 2 }}
        >
          <TextField
            label="Search Products"
            placeholder="Name, SKU, barcode..."
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
            sx={{ flex: 1 }}
          />

          <TextField
            select
            label="Category"
            value={category}
            disabled={busy}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">
              All Categories
            </MenuItem>

            {categories.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Divider />

        {/* PRODUCT LIST */}

        {loading ? (
          <Typography color="text.secondary">
            Loading products...
          </Typography>
        ) : filteredProducts.length === 0 ? (
          <Alert severity="info">
            No matching products found.
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
              maxHeight: 420,
              overflowY: "auto",
            }}
          >
            {filteredProducts.map((product) => {
              const stock = getStockStatus(product);
              const isSelected =
                selectedProductId === product.id;

              return (
                <Paper
                  key={product.id}
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
                      {product.name}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      SKU: {product.sku}
                    </Typography>

                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "space-between",
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
                        Stock: {product.availableQuantity}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700 }}
                    >
                      {formatMoney(product.sellingPrice)}
                    </Typography>

                    <Button
                      variant={
                        isSelected
                          ? "contained"
                          : "outlined"
                      }
                      disabled={
                        busy ||
                        (!allowOutOfStock &&
                          product.availableQuantity <= 0)
                      }
                      onClick={() =>
                        chooseProduct(product)
                      }
                    >
                      {product.hasVariants
                        ? "Choose Variant"
                        : isSelected
                          ? "Selected"
                          : "Select"}
                    </Button>
                  </Stack>
                </Paper>
              );
            })}
          </Box>
        )}

        {/* SELECTED PRODUCT */}

        {selectedProduct && (
          <>
            <Divider />

            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700 }}
            >
              Selected Product
            </Typography>

            <Paper
              variant="outlined"
              sx={{ p: 2 }}
            >
              <Stack spacing={2}>
                <Typography
                  sx={{ fontWeight: 700 }}
                >
                  {selectedProduct.name}
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
                    justifyContent: "space-between",
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

                <Button
                  variant="contained"
                  startIcon={
                    <AddShoppingCartOutlined />
                  }
                  disabled={
                    busy ||
                    quantity <= 0 ||
                    quantity > maxAllowedQuantity
                  }
                  onClick={() => {
                    void handleAddToCart();
                  }}
                >
                  Add to Cart
                </Button>
              </Stack>
            </Paper>
          </>
        )}
      </Stack>
    </Paper>
  );
}
