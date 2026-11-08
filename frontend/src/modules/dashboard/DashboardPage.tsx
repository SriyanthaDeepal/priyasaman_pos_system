
import { useId, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  AddBoxOutlined,
  ArrowForwardOutlined,
  AssessmentOutlined,
  CalendarMonthOutlined,
  CheckCircleOutlined,
  CloudDoneOutlined,
  GroupsOutlined,
  Inventory2Outlined,
  LocalOfferOutlined,
  PointOfSaleOutlined,
  PrintOutlined,
  QrCodeScannerOutlined,
  ReceiptLongOutlined,
  ShoppingCartOutlined,
  StorageOutlined,
  SwapHorizOutlined,
  WarningAmberOutlined,
  WbSunnyOutlined,
  WifiOutlined,
} from "@mui/icons-material";

import "./dashboard.css";

type Metric = "sales" | "transactions" | "profit";
type Period = "today" | "yesterday" | "week" | "month" | "custom";
type Tone = "green" | "orange" | "blue" | "purple";

interface DashboardPageProps {
  userName?: string;
  onNavigate?: (path: string) => void;
}

const categories = [
  { name: "Groceries", share: 36.8, color: "#4acc2c" },
  { name: "Beverages", share: 18.4, color: "#0789f8" },
  { name: "Household", share: 14.2, color: "#ff8500" },
  { name: "Personal Care", share: 11.6, color: "#963df0" },
  { name: "Snacks", share: 10.4, color: "#f75b89" },
  { name: "Others", share: 8.6, color: "#a3acba" },
] as const;

const transactions = [
  {
    invoice: "INV-009842",
    customer: "Walk-in Customer",
    time: "08:17 AM",
    total: 3450,
  },
  {
    invoice: "INV-009841",
    customer: "Nishan Perera",
    time: "08:10 AM",
    total: 6280,
  },
  {
    invoice: "INV-009840",
    customer: "Walk-in Customer",
    time: "08:03 AM",
    total: 1920,
  },
] as const;

const lowStock = [
  {
    id: "PRD-00456",
    name: "Sunflower Oil (1 L)",
    quantity: 3,
    image: "🧴",
  },
  {
    id: "PRD-00127",
    name: "Basmati Rice (5 kg)",
    quantity: 5,
    image: "🍚",
  },
  {
    id: "PRD-00389",
    name: "Toothpaste (120 g)",
    quantity: 6,
    image: "🪥",
  },
] as const;

const hours = [
  "8 AM", "9 AM", "10 AM", "11 AM", "12 PM",
  "1 PM", "2 PM", "3 PM", "4 PM", "5 PM",
  "6 PM", "7 PM", "8 PM",
];

const chartData: Record<Metric, number[]> = {
  sales: [
    28000, 73000, 54000, 100000, 125000,
    138000, 190000, 127000, 132000,
    187000, 217000, 201000, 245680,
  ],
  transactions: [
    14, 30, 23, 44, 55, 64, 94,
    62, 68, 105, 126, 117, 156,
  ],
  profit: [
    5000, 15000, 12000, 22000, 28000,
    33000, 46000, 31000, 34000,
    48000, 57000, 53000, 63340,
  ],
};

const periodOptions: Record<Period, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "Last 7 Days",
  month: "This Month",
  custom: "Custom Range",
};

const periodFactors: Record<Period, number> = {
  today: 1,
  yesterday: 0.89,
  week: 6.4,
  month: 26.2,
  custom: 1,
};

function money(value: number): string {
  return `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function compactMoney(value: number): string {
  if (value >= 1_000_000) {
    return `Rs. ${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `Rs. ${(value / 1000).toFixed(1)}K`;
  }
  return money(value);
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function Panel({
  title,
  icon,
  action,
  children,
  className = "",
}: {
  title: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`pd-panel ${className}`}>
      <div className="pd-panel-header">
        <div className="pd-panel-heading">
          <span className="pd-panel-icon">{icon}</span>
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Sparkline() {
  return (
    <svg
      className="pd-sparkline"
      viewBox="0 0 64 40"
      aria-hidden="true"
    >
      <path
        d="M2 34 C11 14 18 13 27 22 S42 28 51 10 S59 6 62 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  change,
  icon,
  tone,
}: {
  label: string;
  value: string;
  change: string;
  icon: ReactNode;
  tone: Tone;
}) {
  return (
    <div className={`pd-stat-card pd-stat-${tone}`}>
      <div className="pd-stat-main">
        <div className="pd-stat-icon">{icon}</div>
        <div className="pd-stat-body">
          <span className="pd-stat-label">{label}</span>
          <strong className="pd-stat-value">{value}</strong>
          <div className="pd-stat-change">
            <strong>▲ {change}</strong>
            <span>vs yesterday</span>
          </div>
        </div>
      </div>
      <Sparkline />
    </div>
  );
}

function SalesChart({
  metric,
  factor,
}: {
  metric: Metric;
  factor: number;
}) {
  const gradientId = useId().replace(/:/g, "");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const values = chartData[metric].map(
    (value) => value * factor,
  );

  const baseMaximum =
    metric === "transactions"
      ? 180
      : metric === "profit"
        ? 80000
        : 300000;

  const maxValue = baseMaximum * factor;

  const width = 900;
  const height = 370;
  const left = 92;
  const right = 24;
  const top = 25;
  const bottom = 48;

  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const points = values.map((value, index) => ({
    x: left + (index / (values.length - 1)) * plotWidth,
    y: top + plotHeight - (value / maxValue) * plotHeight,
    value,
  }));

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
    )
    .join(" ");

  const areaPath = [
    linePath,
    `L ${points[points.length - 1].x} ${top + plotHeight}`,
    `L ${points[0].x} ${top + plotHeight}`,
    "Z",
  ].join(" ");

  const axisLabel = (value: number): string => {
    if (metric === "transactions") {
      return Math.round(value).toLocaleString();
    }
    if (value === 0) return "Rs. 0";
    if (value >= 1_000_000) {
      return `Rs. ${(value / 1_000_000).toFixed(1)}M`;
    }
    return `Rs. ${Math.round(value / 1000)}K`;
  };

  const activePoint =
    hoverIndex === null ? null : points[hoverIndex];

  const tooltipX = activePoint
    ? Math.max(110, Math.min(activePoint.x, width - 110))
    : 0;

  const tooltipY = activePoint
    ? Math.max(2, activePoint.y - 80)
    : 0;

  return (
    <div className="pd-chart-container">
      <svg
        className="pd-chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Overview chart for ${metric}`}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#24cc56"
              stopOpacity="0.48"
            />
            <stop
              offset="100%"
              stopColor="#24cc56"
              stopOpacity="0.04"
            />
          </linearGradient>
        </defs>

        {Array.from({ length: 7 }, (_, index) => {
          const y = top + (index / 6) * plotHeight;
          return (
            <g key={`y-${index}`}>
              <line
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
                stroke="#dfe7ee"
              />
              <text
                x={left - 14}
                y={y + 5}
                textAnchor="end"
                fontSize="15"
                fontWeight="500"
                fill="#475467"
              >
                {axisLabel(maxValue * (1 - index / 6))}
              </text>
            </g>
          );
        })}

        {points.map((point, index) => (
          <line
            key={`x-${index}`}
            x1={point.x}
            x2={point.x}
            y1={top}
            y2={top + plotHeight}
            stroke="#edf1f5"
          />
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke="#008e2d"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point, index) => (
          <g key={`point-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r={hoverIndex === index ? 8 : 6}
              fill="#ffffff"
              stroke="#008e2d"
              strokeWidth="3.5"
              onMouseEnter={() => setHoverIndex(index)}
              style={{ cursor: "pointer" }}
            >
              <title>
                {`${hours[index]}: ${
                  metric === "transactions"
                    ? Math.round(point.value)
                    : money(point.value)
                }`}
              </title>
            </circle>
            <text
              x={point.x}
              y={height - 13}
              textAnchor="middle"
              fontSize="13"
              fontWeight="500"
              fill="#344054"
            >
              {hours[index]}
            </text>
          </g>
        ))}

        {activePoint && hoverIndex !== null && (
          <g pointerEvents="none">
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={activePoint.y}
              y2={top + plotHeight}
              stroke="#008e2d"
              strokeDasharray="5 5"
            />
            <rect
              x={tooltipX - 100}
              y={tooltipY}
              width="200"
              height="66"
              rx="10"
              fill="#006d27"
            />
            <text
              x={tooltipX}
              y={tooltipY + 24}
              textAnchor="middle"
              fontSize="15"
              fill="#ffffff"
            >
              {hours[hoverIndex]}
            </text>
            <text
              x={tooltipX}
              y={tooltipY + 49}
              textAnchor="middle"
              fontSize="18"
              fontWeight="bold"
              fill="#ffffff"
            >
              {metric === "transactions"
                ? Math.round(activePoint.value).toLocaleString()
                : compactMoney(activePoint.value)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function CategoryChart({ total }: { total: number }) {
  const gradient = categories
    .map((category, index) => {
      const start = categories
        .slice(0, index)
        .reduce((sum, item) => sum + item.share, 0);

      return `${category.color} ${start}% ${
        start + category.share
      }%`;
    })
    .join(", ");

  return (
    <div className="pd-category-content">
      <div
        className="pd-donut"
        style={{
          background: `conic-gradient(${gradient})`,
        }}
        role="img"
        aria-label="Sales by category distribution"
      >
        <div className="pd-donut-center">
          <strong>{compactMoney(total)}</strong>
          <span>Total Sales</span>
        </div>
      </div>

      <div className="pd-category-legend">
        {categories.map((category) => (
          <div
            className="pd-legend-row"
            key={category.name}
          >
            <span
              className="pd-legend-dot"
              style={{ backgroundColor: category.color }}
            />
            <span className="pd-legend-name">
              {category.name}
            </span>
            <strong>{category.share}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`pd-quick-action pd-action-${tone}`}
      onClick={onClick}
    >
      <span className="pd-quick-icon">{icon}</span>
      <span className="pd-quick-label">{label}</span>
    </button>
  );
}

function ViewAll({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="pd-view-all"
      onClick={onClick}
    >
      View All
      <ArrowForwardOutlined fontSize="small" />
    </button>
  );
}

function StatusItem({
  icon,
  label,
  status,
}: {
  icon: ReactNode;
  label: string;
  status: string;
}) {
  return (
    <div className="pd-status-item">
      <span className="pd-status-item-icon">{icon}</span>
      <span className="pd-status-item-label">{label}</span>
      <span className="pd-status-badge">
        <CheckCircleOutlined fontSize="inherit" />
        {status}
      </span>
    </div>
  );
}

export default function DashboardPage({
  userName = "Admin",
  onNavigate,
}: DashboardPageProps) {
  const [metric, setMetric] = useState<Metric>("sales");
  const [period, setPeriod] = useState<Period>("today");
  const [notice, setNotice] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [appliedRange, setAppliedRange] = useState<{ start: string; end: string } | null>(null);

  const customDays = useMemo(() => {
    if (!appliedRange) return 1;
    const start = new Date(`${appliedRange.start}T00:00:00`).getTime();
    const end = new Date(`${appliedRange.end}T00:00:00`).getTime();
    return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
  }, [appliedRange]);

  // Placeholder scaling only: replace with real date-filtered API data later.
  const selectedFactor = period === "custom" ? customDays : periodFactors[period];

  const handlePeriodChange = (value: Period) => {
    if (value === "custom") {
      setCustomOpen(true);
      return;
    }
    setCustomOpen(false);
    setPeriod(value);
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd || customStart > customEnd) return;
    setAppliedRange({ start: customStart, end: customEnd });
    setPeriod("custom");
    setCustomOpen(false);
  };

  const data = useMemo(() => {
    const factor = selectedFactor;
    return {
      sales: 245680 * factor,
      transactions: Math.round(156 * factor),
      items: Math.round(482 * factor),
      customers: Math.round(12 * factor),
      cost: 182340 * factor,
      profit: 63340 * factor,
    };
  }, [selectedFactor]);

  const navigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      setNotice(
        `Connect your application router to open ${path}.`,
      );
    }
  };

  return (
    <div className="pd-dashboard">
      <div className="pd-dashboard-content">
        {/* WELCOME */}
        <div className="pd-welcome-row">
          <div className="pd-welcome-left">
            <WbSunnyOutlined className="pd-sun-icon" />
            <div>
              <h1>
                {greeting()}, {userName}!
              </h1>
              <p>
                Here's what's happening at Priyasaman POS today.
              </p>
            </div>
          </div>

          <div className="pd-date-picker-wrap">
            <div className="pd-date-control">
              <button
                type="button"
                className="pd-date-icon-button"
                aria-label="Choose custom date range"
                onClick={() => setCustomOpen((open) => !open)}
              >
                <CalendarMonthOutlined />
              </button>
              <select
                value={period}
                aria-label="Dashboard reporting period"
                onChange={(event) => handlePeriodChange(event.target.value as Period)}
              >
                {(Object.entries(periodOptions) as [Period, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {customOpen && (
              <div className="pd-date-popover" role="group" aria-label="Custom date range">
                <div className="pd-date-popover-heading">Select date range</div>
                <div className="pd-date-inputs">
                  <label>
                    <span>Start Date</span>
                    <input
                      type="date"
                      value={customStart}
                      max={customEnd || undefined}
                      onChange={(event) => setCustomStart(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>End Date</span>
                    <input
                      type="date"
                      value={customEnd}
                      min={customStart || undefined}
                      onChange={(event) => setCustomEnd(event.target.value)}
                    />
                  </label>
                </div>
                <div className="pd-date-popover-actions">
                  <button type="button" className="pd-date-cancel" onClick={() => setCustomOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="pd-date-apply"
                    disabled={!customStart || !customEnd || customStart > customEnd}
                    onClick={applyCustomRange}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
            {period === "custom" && appliedRange && (
              <span className="pd-date-range-caption">
                {appliedRange.start} – {appliedRange.end}
              </span>
            )}
          </div>
        </div>

        {notice && (
          <div className="pd-notice" role="status">
            <span>{notice}</span>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setNotice(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* KPI CARDS */}
        <div className="pd-kpis">
          <StatCard
            label="Today's Sales"
            value={money(data.sales)}
            change="+12.8%"
            icon={<ShoppingCartOutlined />}
            tone="green"
          />
          <StatCard
            label="Transactions"
            value={data.transactions.toLocaleString()}
            change="+8.3%"
            icon={<ReceiptLongOutlined />}
            tone="orange"
          />
          <StatCard
            label="Items Sold"
            value={data.items.toLocaleString()}
            change="+15.6%"
            icon={<Inventory2Outlined />}
            tone="blue"
          />
          <StatCard
            label="New Customers"
            value={data.customers.toLocaleString()}
            change="+33.3%"
            icon={<GroupsOutlined />}
            tone="purple"
          />
        </div>

        {/* MAIN UPPER GRID */}
        <div className="pd-main-columns">
          {/* LEFT COLUMN */}
          <div className="pd-left-column">
            <Panel
              title="Sales Overview"
              icon={<AssessmentOutlined />}
              className="pd-sales-panel"
              action={
                <div
                  className="pd-chart-tabs"
                  role="group"
                  aria-label="Sales chart metric"
                >
                  {(
                    ["sales", "transactions", "profit"] as Metric[]
                  ).map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={
                        metric === item ? "active" : ""
                      }
                      aria-pressed={metric === item}
                      onClick={() => setMetric(item)}
                    >
                      {item.charAt(0).toUpperCase() +
                        item.slice(1)}
                    </button>
                  ))}
                </div>
              }
            >
              <SalesChart
                metric={metric}
                factor={selectedFactor}
              />
            </Panel>

            <Panel
              title="Sales by Category"
              icon={<LocalOfferOutlined />}
              className="pd-category-panel"
            >
              <CategoryChart total={data.sales} />
            </Panel>
          </div>

          {/* RIGHT COLUMN */}
          <div className="pd-right-column">
            <Panel
              title="Quick Actions"
              icon={<PointOfSaleOutlined />}
              className="pd-quick-panel"
            >
              <div className="pd-quick-grid">
                <QuickAction
                  icon={<ShoppingCartOutlined />}
                  label="New Sale (F2)"
                  tone="green"
                  onClick={() => navigate("/pos")}
                />
                <QuickAction
                  icon={<AddBoxOutlined />}
                  label="Add Product"
                  tone="orange"
                  onClick={() => navigate("/products/new")}
                />
                <QuickAction
                  icon={<Inventory2Outlined />}
                  label="Purchase Order"
                  tone="purple"
                  onClick={() => navigate("/purchases/new")}
                />
                <QuickAction
                  icon={<SwapHorizOutlined />}
                  label="Stock Adjustment"
                  tone="blue"
                  onClick={() =>
                    navigate("/inventory/adjustments")
                  }
                />
                <QuickAction
                  icon={<GroupsOutlined />}
                  label="Add Customer"
                  tone="teal"
                  onClick={() => navigate("/customers/new")}
                />
                <QuickAction
                  icon={<AssessmentOutlined />}
                  label="View Reports"
                  tone="pink"
                  onClick={() => navigate("/reports")}
                />
              </div>
            </Panel>

            <Panel
              title="Today's Summary"
              icon={<ReceiptLongOutlined />}
              className="pd-summary-panel"
            >
              <div className="pd-summary-list">
                <div className="pd-summary-row">
                  <span>Total Sales</span>
                  <strong>{money(data.sales)}</strong>
                </div>
                <div className="pd-summary-row">
                  <span>Cost of Goods</span>
                  <strong>{money(data.cost)}</strong>
                </div>
                <div className="pd-summary-row">
                  <span>Gross Profit</span>
                  <strong className="pd-green-text">
                    {money(data.profit)}
                  </strong>
                </div>
                <div className="pd-summary-row pd-margin-row">
                  <span>Profit Margin</span>
                  <strong>
                    {data.sales > 0
                      ? (
                          (data.profit / data.sales) *
                          100
                        ).toFixed(1)
                      : "0.0"}%
                  </strong>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        {/* BOTTOM TWO-COLUMN ROW */}
        <div className="pd-bottom-row">
          {/* LEFT: RECENT TRANSACTIONS */}
          <Panel
            title="Recent Transactions"
            icon={<ReceiptLongOutlined />}
            className="pd-transactions-panel"
            action={
              <ViewAll
                onClick={() => navigate("/sales/history")}
              />
            }
          >
            <div className="pd-transaction-list">
              {transactions.map((transaction) => (
                <button
                  type="button"
                  key={transaction.invoice}
                  className="pd-transaction-row"
                  onClick={() =>
                    navigate(`/sales/${transaction.invoice}`)
                  }
                >
                  <span className="pd-transaction-details">
                    <strong>{transaction.invoice}</strong>
                    <small>
                      {transaction.customer} ·{" "}
                      {transaction.time}
                    </small>
                  </span>
                  <span className="pd-transaction-amount">
                    {money(transaction.total)}
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          {/* RIGHT: LOW STOCK ALERTS */}
          <Panel
            title="Low Stock Alerts"
            icon={<WarningAmberOutlined />}
            className="pd-stock-panel"
            action={
              <ViewAll
                onClick={() =>
                  navigate("/inventory/low-stock")
                }
              />
            }
          >
            <div className="pd-stock-list">
              {lowStock.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="pd-stock-row"
                  onClick={() =>
                    navigate(`/products/${item.id}`)
                  }
                >
                  <span
                    className="pd-stock-image"
                    aria-hidden="true"
                  >
                    {item.image}
                  </span>
                  <span className="pd-stock-info">
                    <strong>{item.name}</strong>
                    <small>{item.id}</small>
                  </span>
                  <span className="pd-stock-quantity">
                    {item.quantity} left
                  </span>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        {/* SYSTEM STATUS */}
        <Panel
          title="System Status"
          icon={<WifiOutlined />}
          className="pd-system-panel"
        >
          <div className="pd-system-grid">
            <StatusItem
              icon={<CloudDoneOutlined />}
              label="Synchronization"
              status="Synced"
            />
            <StatusItem
              icon={<StorageOutlined />}
              label="Local Database"
              status="Online"
            />
            <StatusItem
              icon={<PrintOutlined />}
              label="Receipt Printer"
              status="Ready"
            />
            <StatusItem
              icon={<QrCodeScannerOutlined />}
              label="Barcode Scanner"
              status="Connected"
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}
