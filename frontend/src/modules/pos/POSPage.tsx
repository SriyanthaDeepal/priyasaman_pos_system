
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent } from "react";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import {
  Close,
  CreditCard,
  DeleteOutlined,
  LocalOfferOutlined,
  Pause,
  PersonAddAlt1,
  QrCodeScanner,
  RestartAlt,
  Search,
  ShoppingCartOutlined,
} from "@mui/icons-material";

import "./pos.css";
import SinhalaTouchKeyboard from "./SinhalaTouchKeyboard";
import PaymentCheckout from "./PaymentCheckout";
import AppSnackbar from "../../components/common/AppSnackbar";

type Category =
  | "Groceries"
  | "Vegetables"
  | "Fruits"
  | "Beverages"
  | "Household"
  | "Personal Care"
  | "Snacks"
  | "Others";

type Unit = "pcs" | "kg" | "L";

type Product = {
  id: number;
  name: string;
  sinhalaName?: string;
  category: Category;
  price: number;
  stock: number;
  unit: Unit;
  emoji: string;
  color: string;
  barcode: string;
  sku: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

type ModalType =
  | "scan"
  | "hold"
  | "recall"
  | "discount"
  | "clear"
  | "customer"
  | null;

type HeldSale = {
  id: string;
  items: CartItem[];
  discount: number;
  customer: string;
};

type DiscountMode = "amount" | "percent";

const PRODUCTS_PER_PAGE = 12;

// Demo configuration only. Use your actual tax rules
// when the backend and billing configuration are added.
const TAX_RATE = 0.15;

const categories = [
  "All Products",
  "Groceries",
  "Vegetables",
  "Fruits",
  "Beverages",
  "Household",
  "Personal Care",
  "Snacks",
  "Others",
] as const;

type CategoryFilter = (typeof categories)[number];

const categoryIcons: Record<CategoryFilter, string> = {
  "All Products": "▦",
  Groceries: "🛒",
  Vegetables: "🥒",
  Fruits: "🍎",
  Beverages: "🥛",
  Household: "⌂",
  "Personal Care": "♟",
  Snacks: "🍪",
  Others: "•••",
};

const products: Product[] = [
  {
    id: 1,
    name: "Basmati Rice 5 kg",
    sinhalaName: "බාස්මතී සහල් කිලෝ 5",
    category: "Groceries",
    price: 4900,
    stock: 72,
    unit: "pcs",
    emoji: "🍚",
    color: "#fff6e9",
    barcode: "100000000001",
    sku: "GRC-001",
  },
  {
    id: 2,
    name: "Sunflower Oil 1 L",
    sinhalaName: "සූරියකාන්ත තෙල් ලීටර් 1",
    category: "Groceries",
    price: 1450,
    stock: 48,
    unit: "pcs",
    emoji: "🫗",
    color: "#fff9e7",
    barcode: "100000000002",
    sku: "GRC-002",
  },
  {
    id: 3,
    name: "Milk Powder 400 g",
    sinhalaName: "කිරිපිටි ග්‍රෑම් 400",
    category: "Groceries",
    price: 2350,
    stock: 15,
    unit: "pcs",
    emoji: "🥛",
    color: "#eaf5ff",
    barcode: "100000000003",
    sku: "GRC-003",
  },
  {
    id: 4,
    name: "Sugar 1 kg",
    sinhalaName: "සීනි කිලෝ 1",
    category: "Groceries",
    price: 280,
    stock: 104,
    unit: "pcs",
    emoji: "🧂",
    color: "#f7f7f7",
    barcode: "100000000004",
    sku: "GRC-004",
  },
  {
    id: 5,
    name: "Toothpaste 120 g",
    sinhalaName: "දන්තාලේප",
    category: "Personal Care",
    price: 380,
    stock: 96,
    unit: "pcs",
    emoji: "🪥",
    color: "#edf7ff",
    barcode: "100000000005",
    sku: "PER-001",
  },
  {
    id: 6,
    name: "Dish Wash Liquid 500 ml",
    category: "Household",
    price: 650,
    stock: 58,
    unit: "pcs",
    emoji: "🧴",
    color: "#effff1",
    barcode: "100000000006",
    sku: "HOU-001",
  },
  {
    id: 7,
    name: "Tea 200 g",
    sinhalaName: "තේ කොළ",
    category: "Groceries",
    price: 640,
    stock: 36,
    unit: "pcs",
    emoji: "🍵",
    color: "#fff1eb",
    barcode: "100000000007",
    sku: "GRC-005",
  },
  {
    id: 8,
    name: "Eggs (10 pcs)",
    sinhalaName: "බිත්තර",
    category: "Groceries",
    price: 420,
    stock: 120,
    unit: "pcs",
    emoji: "🥚",
    color: "#fff7ed",
    barcode: "100000000008",
    sku: "GRC-006",
  },
  {
    id: 9,
    name: "Tomatoes",
    sinhalaName: "තක්කාලි",
    category: "Vegetables",
    price: 320,
    stock: 42.5,
    unit: "kg",
    emoji: "🍅",
    color: "#fff0ed",
    barcode: "100000000009",
    sku: "VEG-001",
  },
  {
    id: 10,
    name: "Potatoes",
    sinhalaName: "අර්තාපල්",
    category: "Vegetables",
    price: 260,
    stock: 75,
    unit: "kg",
    emoji: "🥔",
    color: "#fff5e6",
    barcode: "100000000010",
    sku: "VEG-002",
  },
  {
    id: 11,
    name: "Carrots",
    sinhalaName: "කැරට්",
    category: "Vegetables",
    price: 380,
    stock: 28.5,
    unit: "kg",
    emoji: "🥕",
    color: "#fff2e8",
    barcode: "100000000011",
    sku: "VEG-003",
  },
  {
    id: 12,
    name: "Onions",
    sinhalaName: "ලූනු",
    category: "Vegetables",
    price: 240,
    stock: 64,
    unit: "kg",
    emoji: "🧅",
    color: "#fff8eb",
    barcode: "100000000012",
    sku: "VEG-004",
  },
  {
    id: 13,
    name: "Cabbage",
    sinhalaName: "ගෝවා",
    category: "Vegetables",
    price: 210,
    stock: 35,
    unit: "kg",
    emoji: "🥬",
    color: "#edffef",
    barcode: "100000000013",
    sku: "VEG-005",
  },
  {
    id: 14,
    name: "Red Apples",
    sinhalaName: "ඇපල්",
    category: "Fruits",
    price: 980,
    stock: 24,
    unit: "kg",
    emoji: "🍎",
    color: "#fff0f0",
    barcode: "100000000014",
    sku: "FRT-001",
  },
  {
    id: 15,
    name: "Bananas",
    sinhalaName: "කෙසෙල්",
    category: "Fruits",
    price: 290,
    stock: 38,
    unit: "kg",
    emoji: "🍌",
    color: "#fffbe8",
    barcode: "100000000015",
    sku: "FRT-002",
  },
  {
    id: 16,
    name: "Oranges",
    sinhalaName: "දොඩම්",
    category: "Fruits",
    price: 760,
    stock: 26,
    unit: "kg",
    emoji: "🍊",
    color: "#fff4e9",
    barcode: "100000000016",
    sku: "FRT-003",
  },
  {
    id: 17,
    name: "Grapes",
    category: "Fruits",
    price: 1250,
    stock: 18,
    unit: "kg",
    emoji: "🍇",
    color: "#f6edff",
    barcode: "100000000017",
    sku: "FRT-004",
  },
  {
    id: 18,
    name: "Fresh Milk",
    sinhalaName: "නැවුම් කිරි",
    category: "Beverages",
    price: 450,
    stock: 65,
    unit: "L",
    emoji: "🥛",
    color: "#edf7ff",
    barcode: "100000000018",
    sku: "BEV-001",
  },
  {
    id: 19,
    name: "Orange Juice 1 L",
    category: "Beverages",
    price: 780,
    stock: 42,
    unit: "pcs",
    emoji: "🧃",
    color: "#fff5e8",
    barcode: "100000000019",
    sku: "BEV-002",
  },
  {
    id: 20,
    name: "Laundry Detergent",
    category: "Household",
    price: 890,
    stock: 34,
    unit: "pcs",
    emoji: "🧼",
    color: "#eef7ff",
    barcode: "100000000020",
    sku: "HOU-002",
  },
  {
    id: 21,
    name: "Shampoo 200 ml",
    category: "Personal Care",
    price: 950,
    stock: 45,
    unit: "pcs",
    emoji: "🧴",
    color: "#f1f5ff",
    barcode: "100000000021",
    sku: "PER-002",
  },
  {
    id: 22,
    name: "Chocolate Biscuits",
    sinhalaName: "චොකලට් බිස්කට්",
    category: "Snacks",
    price: 250,
    stock: 80,
    unit: "pcs",
    emoji: "🍪",
    color: "#fff4e9",
    barcode: "100000000022",
    sku: "SNK-001",
  },
];

const money = (value: number) =>
  `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatQuantity = (value: number) =>
  Number(value.toFixed(3)).toString();

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const cloneCart = (items: CartItem[]): CartItem[] =>
  items.map((item) => ({
    product: item.product,
    quantity: item.quantity,
  }));

const modalTitle: Record<
  Exclude<ModalType, null>,
  string
> = {
  scan: "Scan Barcode",
  hold: "Hold Current Sale",
  recall: "Recall Held Sale",
  discount: "Bill Discount",
  clear: "Clear Current Bill",
  customer: "Select Customer",
};

export default function POSPage() {
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilter>("All Products");

  const [search, setSearch] = useState("");
  const [touchTarget, setTouchTarget] = useState<"search" | "customer" | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const [cart, setCart] = useState<CartItem[]>([
    { product: products[0], quantity: 1 },
    { product: products[1], quantity: 2 },
    { product: products[4], quantity: 1 },
    { product: products[6], quantity: 1 },
  ]);

  const [modal, setModal] = useState<ModalType>(null);
  const [notice, setNotice] = useState("");

  const [coupon, setCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);

  const [discountMode, setDiscountMode] =
    useState<DiscountMode>("amount");

  const [discountInput, setDiscountInput] = useState("");
  const [manualDiscount, setManualDiscount] = useState(0);

  const [customer, setCustomer] = useState("Walk-in Customer");
  const [customerInput, setCustomerInput] = useState("");

  const [barcodeInput, setBarcodeInput] = useState("");

  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);

  const [invoiceNumber, setInvoiceNumber] =
    useState(9842);

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const customerRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All Products" ||
        product.category === activeCategory;

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sinhalaName?.toLowerCase().includes(query) ||
        product.barcode.includes(query) ||
        product.sku.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  const pageCount = Math.max(
    1,
    Math.ceil(filtered.length / PRODUCTS_PER_PAGE)
  );

  const visible = filtered.slice(
    currentPage * PRODUCTS_PER_PAGE,
    (currentPage + 1) * PRODUCTS_PER_PAGE
  );

  const changeCategory = (category: CategoryFilter) => {
    setActiveCategory(category);
    setCurrentPage(0);
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(0);
  };

  const categoryCount = (category: CategoryFilter) =>
    category === "All Products"
      ? products.length
      : products.filter(
          (product) => product.category === category
        ).length;

  const addProduct = useCallback((product: Product) => {
    setCart((previous) => {
      const existing = previous.find(
        (item) => item.product.id === product.id
      );

      const increment =
        product.unit === "pcs" ? 1 : 0.25;

      if (existing) {
        const nextQuantity = roundMoney(
          existing.quantity + increment
        );

        if (nextQuantity > product.stock) {
          return previous;
        }

        return previous.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: nextQuantity }
            : item
        );
      }

      if (product.stock < increment) {
        return previous;
      }

      return [
        ...previous,
        { product, quantity: increment },
      ];
    });
  }, []);

  const updateQuantity = (
    productId: number,
    value: number
  ) => {
    if (!Number.isFinite(value)) return;

    setCart((previous) =>
      previous
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }

          const isMeasured = item.product.unit !== "pcs";

          const quantity = isMeasured
            ? Math.round(value * 1000) / 1000
            : Math.round(value);

          return {
            ...item,
            quantity: Math.min(
              Math.max(0, quantity),
              item.product.stock
            ),
          };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeProduct = (productId: number) => {
    setCart((previous) =>
      previous.filter(
        (item) => item.product.id !== productId
      )
    );
  };

  const resetBill = () => {
    setCart([]);
    setManualDiscount(0);
    setCouponDiscount(0);
    setCoupon("");
    setCustomer("Walk-in Customer");
  };

  const clearSale = () => {
    resetBill();
    setModal(null);
    setNotice("Current bill cleared.");
  };

  const subtotal = useMemo(
    () =>
      roundMoney(
        cart.reduce(
          (total, item) =>
            total + item.product.price * item.quantity,
          0
        )
      ),
    [cart]
  );

  const discount = Math.min(
    subtotal,
    manualDiscount + couponDiscount
  );

  const taxableAmount = Math.max(
    0,
    subtotal - discount
  );

  const tax = roundMoney(taxableAmount * TAX_RATE);
  const grandTotal = roundMoney(taxableAmount + tax);


  const applyCoupon = () => {
    if (!coupon.trim()) {
      setNotice("Enter a coupon code first.");
      return;
    }

    if (coupon.trim().toUpperCase() === "SAVE100") {
      setCouponDiscount(100);
      setNotice("Demo coupon SAVE100 applied.");
    } else {
      setCouponDiscount(0);
      setNotice("Coupon not recognized.");
    }
  };

  const applyDiscount = () => {
    const value = Number(discountInput);

    if (
      discountInput.trim() === "" ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      setNotice("Enter a valid discount.");
      return;
    }

    if (discountMode === "percent" && value > 100) {
      setNotice("Percentage cannot exceed 100%.");
      return;
    }

    const calculated =
      discountMode === "percent"
        ? (subtotal * value) / 100
        : value;

    setManualDiscount(
      roundMoney(Math.min(calculated, subtotal))
    );

    setModal(null);
    setNotice("Bill discount updated.");
  };

  const holdSale = () => {
    if (cart.length === 0) {
      setNotice("There are no items to hold.");
      setModal(null);
      return;
    }

    const id = `HOLD-${Date.now()}`;

    setHeldSales((previous) => [
      {
        id,
        items: cloneCart(cart),
        discount: manualDiscount,
        customer,
      },
      ...previous,
    ]);

    resetBill();
    setModal(null);
    setNotice("Sale placed on hold.");
  };

  const recallSale = (sale: HeldSale) => {
    if (cart.length > 0) {
      setNotice(
        "Clear or hold the current bill before recalling another sale."
      );
      return;
    }

    setCart(cloneCart(sale.items));
    setManualDiscount(sale.discount);
    setCustomer(sale.customer);
    setCouponDiscount(0);
    setCoupon("");

    setHeldSales((previous) =>
      previous.filter((item) => item.id !== sale.id)
    );

    setModal(null);
    setNotice("Held sale recalled.");
  };

  const scanBarcode = () => {
    const code = barcodeInput.trim();

    const product = products.find(
      (item) =>
        item.barcode === code ||
        item.sku.toLowerCase() === code.toLowerCase()
    );

    if (!product) {
      setNotice("Product not found.");
      return;
    }

    addProduct(product);
    setBarcodeInput("");
    setModal(null);
    setNotice(`${product.name} added to bill.`);
  };

  const completePayment = (_received: number, _notes: string, _printReceipt: boolean) => {
    if (cart.length === 0) return;
    // Frontend-only demo. No payment or sale is recorded in the backend.
    setInvoiceNumber((previous) => previous + 1);
    resetBill();
    setCheckoutOpen(false);
    setNotice("Demo cash checkout completed. No real payment, receipt, or backend sale was recorded.");
  };

  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      const actions: Record<string, () => void> = {
        F2: () => setModal("scan"),
        F3: focusSearch,
        F4: () => setModal("hold"),
        F5: () => setModal("recall"),
        F6: () => setModal("discount"),
        F7: () => setModal("clear"),
        F8: () => setModal("customer"),
        F9: () => { if (cart.length > 0) { setTouchTarget(null); setCheckoutOpen(true); } },
      };

      const action = actions[event.key];

      if (action) {
        event.preventDefault();
        action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [focusSearch]);

  if (checkoutOpen) {
    return (
      <PaymentCheckout
        items={cart.map(({ product, quantity }) => ({
          id: product.id,
          name: product.name,
          emoji: product.emoji,
          quantity,
          price: product.price,
          unit: product.unit,
        }))}
        invoice={`INV-${String(invoiceNumber).padStart(6, "0")}`}
        subtotal={subtotal}
        discount={discount}
        tax={tax}
        total={grandTotal}
        customer={customer}
        onBack={() => setCheckoutOpen(false)}
        onComplete={completePayment}
      />
    );
  }

  return (
    <div className="pos-page">
      <div className="pos-topline">
        <div className="pos-title-wrap">
          <ShoppingCartOutlined className="pos-title-icon" />

          <div>
            <h1>
              POS / Billing <span>(Create Sale)</span>
            </h1>

            <p>
              Scan barcode or select products to add to
              the bill
            </p>
          </div>
        </div>

        <div className="pos-main-actions">
          <button
            className="pos-action pos-action-blue"
            onClick={() => setModal("hold")}
          >
            <Pause />
            Hold (F4)
          </button>

          <button
            className="pos-action pos-action-green"
            onClick={() => setModal("recall")}
          >
            <RestartAlt />
            Recall (F5)
          </button>

          <button
            className="pos-action"
            onClick={() => setModal("discount")}
          >
            <LocalOfferOutlined />
            Discount (F6)
          </button>

          <button
            className="pos-action pos-action-red"
            onClick={() => setModal("clear")}
          >
            <DeleteOutlined />
            Clear (F7)
          </button>

          <button
            className="pos-action pos-action-customer"
            onClick={() => {
              setCustomerInput(
                customer === "Walk-in Customer"
                  ? ""
                  : customer
              );
              setModal("customer");
            }}
          >
            <PersonAddAlt1 />
            Customer (F8)
          </button>
        </div>
      </div>

      <AppSnackbar
        open={Boolean(notice)}
        message={notice}
        severity="success"
        onClose={() => setNotice("")}
      />

      <div className="pos-workspace">
        {/* PRODUCT PANEL */}
        <section className="pos-products-panel">
          <div className="pos-products-body">
            <aside className="pos-category-sidebar">
              <h3>Categories</h3>

              <div className="pos-category-list">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={
                      activeCategory === category
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      changeCategory(category)
                    }
                  >
                    <span className="pos-category-icon">
                      {categoryIcons[category]}
                    </span>

                    <span>
                      {category} ({categoryCount(category)})
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <div className="pos-product-content">
              <div className="pos-search-row">
                <label className="pos-search-field">
                  <Search />

                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(event) =>
                      changeSearch(event.target.value)
                    }
                    placeholder="Search products by name, barcode or SKU..."
                  />
                </label>

                <button type="button" className="pos-scan-button" onClick={() => { setTouchTarget(current => current === "search" ? null : "search"); }} aria-label="Toggle Sinhala touch keyboard">⌨ සිංහල</button>

                <button
                  className="pos-scan-button"
                  onClick={() => setModal("scan")}
                >
                  <QrCodeScanner />
                  Scan (F2)
                </button>
              </div>

              <div className="pos-product-grid">
                {visible.length === 0 ? (
                  <div className="pos-empty-products">
                    No products found.
                  </div>
                ) : (
                  visible.map((product) => (
                    <button
                      key={product.id}
                      className="pos-product-card"
                      disabled={product.stock <= 0}
                      onClick={() => {
                        addProduct(product);
                        changeSearch("");
                      }}
                    >
                      <div
                        className="pos-product-image"
                        style={{
                          background: product.color,
                        }}
                      >
                        {product.emoji}
                      </div>

                      <div className="pos-product-name">
                        {product.name}
                        {product.sinhalaName && <small style={{ display: "block", color: "#246a36", marginTop: 3 }}>{product.sinhalaName}</small>}
                      </div>

                      <div className="pos-product-price">
                        {money(product.price)}
                        {product.unit !== "pcs" && (
                          <small>/{product.unit}</small>
                        )}
                      </div>

                      <div
                        className={`pos-stock ${
                          product.stock <= 20 ? "low" : ""
                        }`}
                      >
                        Stock: {formatQuantity(product.stock)}{" "}
                        {product.unit}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="pos-pagination">
                <button
                  aria-label="Previous page"
                  disabled={currentPage === 0}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(0, page - 1)
                    )
                  }
                >
                  ‹
                </button>

                {Array.from(
                  { length: pageCount },
                  (_, index) => (
                    <button
                      key={index}
                      aria-label={`Page ${index + 1}`}
                      className={`pos-page-dot ${
                        currentPage === index
                          ? "active"
                          : ""
                      }`}
                      onClick={() => setCurrentPage(index)}
                    />
                  )
                )}

                <button
                  aria-label="Next page"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(pageCount - 1, page + 1)
                    )
                  }
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CURRENT BILL */}
        <section className="pos-bill-panel">
          <div className="pos-bill-heading">
            <div>
              <ShoppingCartOutlined />
              <h2>
                Current Bill <span>({cart.length} Items)</span>
              </h2>
            </div>

            <span className="pos-invoice">
              Bill No: INV-
              {String(invoiceNumber).padStart(6, "0")}
            </span>
          </div>

          <div className="pos-cart-table-wrap">
            <table className="pos-cart-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>

              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="pos-empty-cart"
                    >
                      No items added yet.
                    </td>
                  </tr>
                ) : (
                  cart.map((item, index) => {
                    const { product, quantity } = item;
                    const lineTotal =
                      product.price * quantity;

                    return (
                      <tr key={product.id}>
                        <td>{index + 1}</td>

                        <td>
                          <div className="pos-cart-product">
                            <span>{product.emoji}</span>

                            <div>
                              <strong>{product.name}</strong>
                              <small>Per {product.unit}</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="pos-quantity-cell">
                            {product.unit === "pcs" ? (
                              <div className="pos-qty">
                                <button
                                  aria-label={`Decrease ${product.name}`}
                                  onClick={() =>
                                    updateQuantity(
                                      product.id,
                                      quantity - 1
                                    )
                                  }
                                >
                                  −
                                </button>

                                <span>{quantity}</span>

                                <button
                                  aria-label={`Increase ${product.name}`}
                                  disabled={
                                    quantity >= product.stock
                                  }
                                  onClick={() =>
                                    updateQuantity(
                                      product.id,
                                      quantity + 1
                                    )
                                  }
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <div className="pos-measured-qty">
                                <input
                                  aria-label={`${product.name} quantity in ${product.unit}`}
                                  type="number"
                                  min="0.001"
                                  max={product.stock}
                                  step="0.001"
                                  value={quantity}
                                  onChange={(
                                    event: ChangeEvent<HTMLInputElement>
                                  ) => {
                                    const value = Number(
                                      event.target.value
                                    );

                                    if (Number.isFinite(value)) {
                                      updateQuantity(
                                        product.id,
                                        value
                                      );
                                    }
                                  }}
                                />

                                <span>{product.unit}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td>{money(product.price)}</td>

                        <td className="pos-line-total">
                          {money(lineTotal)}
                        </td>

                        <td>
                          <button
                            className="pos-remove"
                            aria-label={`Remove ${product.name}`}
                            onClick={() =>
                              removeProduct(product.id)
                            }
                          >
                            <DeleteOutlined fontSize="small" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="pos-coupon">
            <label>
              <LocalOfferOutlined />

              <input
                value={coupon}
                onChange={(event) =>
                  setCoupon(event.target.value)
                }
                placeholder="Enter coupon code..."
              />
            </label>

            <button onClick={applyCoupon}>Apply</button>
          </div>

          <div className="pos-totals">
            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>

            <div>
              <span>Discount</span>
              <strong>− {money(discount)}</strong>
            </div>

            <div>
              <span>Tax (VAT {TAX_RATE * 100}%)</span>
              <strong>{money(tax)}</strong>
            </div>
          </div>

          <div className="pos-grand-total">
            <strong>Total Amount</strong>
            <strong>{money(grandTotal)}</strong>
          </div>

          <button
            className="pos-pay-button"
            disabled={cart.length === 0}
            onClick={() => {
              setTouchTarget(null);
              setCheckoutOpen(true);
            }}
          >
            <CreditCard />
            Proceed to Payment (F9)
          </button>
        </section>
        {touchTarget === "search" && (
          <div className="pos-keyboard-overlay">
            <SinhalaTouchKeyboard
              value={search}
              onChange={changeSearch}
              inputRef={searchRef}
              onClose={() => setTouchTarget(null)}
            />
          </div>
        )}
      </div>

      {/* DIALOGS */}
      <Dialog
        open={modal !== null}
        onClose={() => setModal(null)}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: { borderRadius: 3 },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 750,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {modal ? modalTitle[modal] : ""}

          <IconButton onClick={() => setModal(null)}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {modal === "scan" && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Typography variant="body2">
                Enter or scan a product barcode.
              </Typography>

              <TextField
                autoFocus
                fullWidth
                label="Barcode or SKU"
                value={barcodeInput}
                onChange={(event) =>
                  setBarcodeInput(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    scanBarcode();
                  }
                }}
              />

              <Button
                variant="contained"
                onClick={scanBarcode}
              >
                Add Product
              </Button>
            </Box>
          )}

          {modal === "hold" && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Typography>
                Save the current bill and start a new sale?
              </Typography>

              <Button
                variant="contained"
                onClick={holdSale}
              >
                Hold Sale
              </Button>
            </Box>
          )}

          {modal === "recall" && (
            <Box sx={{ display: "grid", gap: 1 }}>
              {heldSales.length === 0 ? (
                <Alert severity="info">
                  No held sales available.
                </Alert>
              ) : (
                heldSales.map((sale) => (
                  <Button
                    key={sale.id}
                    variant="outlined"
                    onClick={() => recallSale(sale)}
                  >
                    {sale.id} — {sale.items.length} items
                  </Button>
                ))
              )}
            </Box>
          )}

          {modal === "discount" && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <TextField
                select
                fullWidth
                label="Discount Type"
                value={discountMode}
                onChange={(event) =>
                  setDiscountMode(
                    event.target.value as DiscountMode
                  )
                }
              >
                <MenuItem value="amount">
                  Fixed Amount (Rs.)
                </MenuItem>

                <MenuItem value="percent">
                  Percentage (%)
                </MenuItem>
              </TextField>

              <TextField
                fullWidth
                type="number"
                label="Discount Value"
                value={discountInput}
                onChange={(event) =>
                  setDiscountInput(event.target.value)
                }
              />

              <Button
                variant="contained"
                onClick={applyDiscount}
              >
                Apply Discount
              </Button>
            </Box>
          )}

          {modal === "clear" && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Alert severity="warning">
                This will remove all products from the
                current bill.
              </Alert>

              <Button
                variant="contained"
                color="error"
                onClick={clearSale}
              >
                Clear Bill
              </Button>
            </Box>
          )}

          {modal === "customer" && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <TextField
                fullWidth
                label="Customer Name"
                inputRef={customerRef}
                value={customerInput}
                onChange={(event) =>
                  setCustomerInput(event.target.value)
                }
              />

              <Button variant="outlined" onClick={() => setTouchTarget(current => current === "customer" ? null : "customer")}>⌨ Sinhala Touch Keyboard</Button>
              {touchTarget === "customer" && (
                <SinhalaTouchKeyboard
                  value={customerInput}
                  onChange={setCustomerInput}
                  inputRef={customerRef}
                  onClose={() => setTouchTarget(null)}
                />
              )}

              <Button
                variant="contained"
                onClick={() => {
                  setCustomer(
                    customerInput.trim() ||
                      "Walk-in Customer"
                  );
                  setModal(null);
                }}
              >
                Save Customer
              </Button>
            </Box>
          )}


        </DialogContent>

        <DialogActions>
          <Button onClick={() => setModal(null)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
