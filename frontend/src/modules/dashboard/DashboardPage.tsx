
import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  AddBoxOutlined,
  ArrowForwardOutlined,
  BoltOutlined,
  CalendarTodayOutlined,
  PaidOutlined,
  PercentOutlined,
  TrendingUpOutlined,
  AssessmentOutlined,
  CalendarMonthOutlined,
  KeyboardArrowDownOutlined,
  GroupsOutlined,
  Inventory2Outlined,
  LocalOfferOutlined,
  ReceiptLongOutlined,
  ShoppingCartOutlined,
  SwapHorizOutlined,
  WarningAmberOutlined,
  WbSunnyOutlined,
} from "@mui/icons-material";

import "./dashboard.css";

const LanguageContext = createContext<"EN" | "SI">("EN");
const translations: Record<string,string> = {
  "Good Morning": "සුබ උදෑසනක්",
  "Good Afternoon": "සුබ දහවලක්",
  "Good Evening": "සුබ සැන්දෑවක්",
  "Admin": "පරිපාලක",
  "Here's what's happening at Priyasaman POS today.": "ඔබේ වෙළඳසැලේ අද දවසේ තොරතුරු මෙන්න.",
  "Today": "අද",
  "Yesterday": "ඊයේ",
  "Last 7 Days": "පසුගිය දින 7",
  "This Month": "මේ මාසය",
  "Custom Range": "වෙනත් දින පරාසයක්",
  "Date Filter": "දිනය තෝරන්න",
  "Specific date or date range": "දිනයක් හෝ දින පරාසයක් තෝරන්න",
  "From date": "ආරම්භක දිනය",
  "To date": "අවසාන දිනය",
  "Reset": "මුල් තත්වයට",
  "Apply": "තහවුරු කරන්න",
  "Today's Sales": "අද දින විකුණුම්",
  "Transactions": "ගනුදෙනු ගණන",
  "Items Sold": "විකුණූ භාණ්ඩ ගණන",
  "New Customers": "නව පාරිභෝගිකයින්",
  "vs yesterday": "ඊයේට සාපේක්ෂව",
  "Quick Actions": "කෙටි මාර්ග",
  "New Sale": "නව බිල්පතක්",
  "Add Product": "භාණ්ඩයක් එක් කරන්න",
  "Purchase Order": "භාණ්ඩ ඇණවුම් කිරීම",
  "Stock Adjustment": "තොග සංශෝධනය",
  "Add Customer": "පාරිභෝගිකයෙකු එක් කරන්න",
  "View Reports": "වාර්තා බලන්න",
  "Today's Summary": "අද දවසේ සාරාංශය",
  "Gross Sales": "දළ විකුණුම්",
  "Gross Profit": "දළ ලාභය",
  "Profit Margin": "ලාභ ප්‍රතිශතය",
  "Avg. Sale Value": "බිලක සාමාන්‍ය වටිනාකම",
  "Low Stock Alerts": "තොග අඩු භාණ්ඩ",
  "View Inventory": "තොග විස්තර බලන්න",
  "Sales Overview": "විකුණුම් සාරාංශය",
  "Sales": "විකුණුම්",
  "Profit": "ලාභය",
  "Products": "භාණ්ඩ",
  "Customers": "පාරිභෝගිකයින්",
  "Sales by Category": "භාණ්ඩ වර්ග අනුව විකුණුම්",
  "Total Sales": "මුළු විකුණුම්",
  "Groceries": "සිල්ලර භාණ්ඩ",
  "Beverages": "බීම වර්ග",
  "Household": "ගෘහ භාණ්ඩ",
  "Personal Care": "පුද්ගලික සනීපාරක්ෂක භාණ්ඩ",
  "Snacks": "කෙටි ආහාර",
  "Others": "වෙනත්",
  "Sunflower Oil (1 L)": "සූරියකාන්ත තෙල් (ලීටර් 1)",
  "Basmati Rice (5 kg)": "බාස්මතී සහල් (කිලෝ 5)",
  "Toothpaste (120 g)": "දත් බෙහෙත් (ග්‍රෑම් 120)",
  "Dashboard date filter": "දිනය තෝරන්න",
  "Sales chart metric": "ප්‍රස්තාරයේ පෙන්වන තොරතුරු",
  "Sales by category distribution": "භාණ්ඩ වර්ග අනුව විකුණුම් ප්‍රස්තාරය",
  "Dismiss message": "පණිවිඩය වසන්න",
  "Open Sales": "විකුණුම් බලන්න",
  "Open Products": "භාණ්ඩ බලන්න",
  "Open Customers": "පාරිභෝගිකයින් බලන්න"
};
function useTranslation() { const language = useContext(LanguageContext); return (value: string) => language === "SI" ? translations[value] ?? value : value; }
function useFormatting() { const si = useContext(LanguageContext) === "SI"; return { money: (v:number) => si ? money(v).replace("Rs.", "රු.") : money(v), compactMoney: (v:number) => si ? compactMoney(v).replace("Rs.", "රු.").replace(/K$/, " දහස").replace(/M$/, " මිලියන") : compactMoney(v), hour: (v:string) => si ? v.replace(/(\d+) AM/, "පෙ.ව. $1").replace(/(\d+) PM/, "ප.ව. $1") : v, si }; }

type Metric = "sales" | "transactions" | "profit";
type Period = "today" | "yesterday" | "week" | "month" | "custom";
type Tone = "green" | "orange" | "blue" | "purple";

interface DashboardPageProps {
  language?: "EN" | "SI";
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

function StatCard({
  label,
  value,
  change,
  icon,
  tone,
  onClick,
  destination,
}: {
  label: string;
  value: string;
  change: string;
  icon: ReactNode;
  tone: Tone;
  onClick: () => void;
  destination: string;
}) {
  const t = useTranslation();
  return (
    <button type="button" className={`pd-stat-card pd-stat-${tone}`} onClick={onClick} aria-label={`${label}: ${value}. ${t(`Open ${destination}`)}`} title={t(`Open ${destination}`)}>
      <div className="pd-stat-main">
        <div className="pd-stat-icon">{icon}</div>
        <div className="pd-stat-body">
          <span className="pd-stat-label">{label}</span>
          <strong className="pd-stat-value">{value}</strong>
          <div className="pd-stat-change">
            <strong>▲ {change}</strong>
            <span>{t("vs yesterday")}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function SalesChart({
  metric,
  factor,
}: {
  metric: Metric;
  factor: number;
}) {
  const t = useTranslation();
  const { money, compactMoney, hour, si } = useFormatting();
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
    if (value === 0) return si ? "රු. 0" : "Rs. 0";
    if (value >= 1_000_000) {
      return si ? `රු. ${(value / 1_000_000).toFixed(1)} මි.` : `Rs. ${(value / 1_000_000).toFixed(1)}M`;
    }
    return si ? `රු. ${Math.round(value / 1000)} ද.` : `Rs. ${Math.round(value / 1000)}K`;
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
        aria-label={si ? `${t(metric.charAt(0).toUpperCase()+metric.slice(1))} ප්‍රස්තාරය` : `Overview chart for ${metric}`}
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
                {`${hour(hours[index])}: ${
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
              {hour(hours[index])}
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
              {hour(hours[hoverIndex])}
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
  const t = useTranslation();
  const { compactMoney } = useFormatting();
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
        aria-label={t("Sales by category distribution")}
      >
        <div className="pd-donut-center">
          <strong>{compactMoney(total)}</strong>
          <span>{t("Total Sales")}</span>
        </div>
      </div>

      <div className="pd-category-legend">
        {categories.map((category) => (
          <div
            className="pd-legend-row"
            key={t(category.name)}
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
  const t = useTranslation();
  return (
    <button
      type="button"
      className={`pd-quick-action pd-action-${tone}`}
      onClick={onClick}
    >
      <span className="pd-quick-icon">{icon}</span>
      <span className="pd-quick-label">{tone === "green" ? <>{t("New Sale")} <span className="pd-quick-shortcut">F2</span></> : label}</span>
    </button>
  );
}

function ViewAll({ onClick }: { onClick: () => void }) {
  const t = useTranslation();
  return (
    <button
      type="button"
      className="pd-view-all"
      onClick={onClick}
    >
      {t("View Inventory")}
      <ArrowForwardOutlined fontSize="small" />
    </button>
  );
}

export default function DashboardPage(props: DashboardPageProps) { return <LanguageContext.Provider value={props.language ?? "EN"}><DashboardContent {...props} /></LanguageContext.Provider>; }

function DashboardContent({
  userName = "Admin",
  onNavigate,
}: DashboardPageProps) {
  const t = useTranslation();
  const { money, si } = useFormatting();
  const [metric, setMetric] = useState<Metric>("sales");
  const [period, setPeriod] = useState<Period>("today");
  const [notice, setNotice] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [draftPeriod, setDraftPeriod] = useState<Period>("today");
  const datePickerRef = useRef<HTMLDivElement>(null);
  const openCustomPicker = () => {
    setDraftPeriod(period);
    setCustomStart(appliedRange?.start ?? "");
    setCustomEnd(appliedRange?.end ?? "");
    setCustomOpen(true);
  };
  const closeCustomPicker = () => setCustomOpen(false);
  useEffect(() => {
    if (!customOpen) return;
    const outside = (event: PointerEvent) => { if (!datePickerRef.current?.contains(event.target as Node)) closeCustomPicker(); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") closeCustomPicker(); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [customOpen]);
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

  const applyDateFilter = () => {
    if (draftPeriod === "custom") {
      if (!customStart || !customEnd || customStart > customEnd) return;
      setAppliedRange({ start: customStart, end: customEnd });
    }
    setPeriod(draftPeriod);
    closeCustomPicker();
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
        si ? "මෙම පිටුව දැනට විවෘත කළ නොහැක." : `Connect your application router to open ${path}.`,
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
                {t(greeting())}, {userName === "Admin" ? t(userName) : userName}!
              </h1>
              <p>
                {t("Here's what's happening at Priyasaman POS today.")}
              </p>
            </div>
          </div>

          <div className="pd-date-picker-wrap" ref={datePickerRef}>
            <button type="button" className="pd-date-trigger" aria-expanded={customOpen} aria-haspopup="dialog" onClick={() => customOpen ? closeCustomPicker() : openCustomPicker()}>
              <CalendarMonthOutlined />
              <span>{t(periodOptions[period])}</span>
              <KeyboardArrowDownOutlined className="pd-date-chevron" aria-hidden="true" />
            </button>
            {customOpen && (
              <div className="pd-date-popover" role="dialog" aria-label={t("Dashboard date filter")}>
                <div className="pd-date-popover-heading">{t("Date Filter")}</div>
                <div className="pd-date-presets">
                  {(Object.entries(periodOptions) as [Period, string][]).map(([value, label]) => (
                    <button type="button" key={value} className={draftPeriod === value ? "selected" : ""} onClick={() => setDraftPeriod(value)}>{t(label)}</button>
                  ))}
                </div>
                {draftPeriod === "custom" && (
                  <>
                    <div className="pd-date-section-title"><CalendarMonthOutlined /> {t("Specific date or date range")}</div>
                    <div className="pd-date-inputs">
                      <label><span>{t("From date")}</span><input type="date" value={customStart} max={customEnd || undefined} onChange={(event) => setCustomStart(event.target.value)} /></label>
                      <label><span>{t("To date")}</span><input type="date" value={customEnd} min={customStart || undefined} onChange={(event) => setCustomEnd(event.target.value)} /></label>
                    </div>
                  </>
                )}
                <div className="pd-date-popover-actions">
                  <button type="button" className="pd-date-cancel" onClick={() => { setDraftPeriod(period); setCustomStart(appliedRange?.start ?? ""); setCustomEnd(appliedRange?.end ?? ""); }}>{t("Reset")}</button>
                  <button type="button" className="pd-date-apply" disabled={draftPeriod === "custom" && (!customStart || !customEnd || customStart > customEnd)} onClick={applyDateFilter}>{t("Apply")}</button>
                </div>
              </div>
            )}
            {period === "custom" && appliedRange && <span className="pd-date-range-caption">{appliedRange.start} – {appliedRange.end}</span>}
          </div>
        </div>

        {notice && (
          <div className="pd-notice" role="status">
            <span>{notice}</span>
            <button
              type="button"
              aria-label={t("Dismiss message")}
              onClick={() => setNotice(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* KPI CARDS */}
        <div className="pd-kpis">
          <StatCard
            label={t("Today's Sales")}
            onClick={() => navigate("/sales")}
            destination="Sales"
            value={money(data.sales)}
            change="+12.8%"
            icon={<ShoppingCartOutlined />}
            tone="green"
          />
          <StatCard
            label={t("Transactions")}
            onClick={() => navigate("/sales")}
            destination="Sales"
            value={data.transactions.toLocaleString()}
            change="+8.3%"
            icon={<ReceiptLongOutlined />}
            tone="orange"
          />
          <StatCard
            label={t("Items Sold")}
            onClick={() => navigate("/products")}
            destination="Products"
            value={data.items.toLocaleString()}
            change="+15.6%"
            icon={<Inventory2Outlined />}
            tone="blue"
          />
          <StatCard
            label={t("New Customers")}
            onClick={() => navigate("/customers")}
            destination="Customers"
            value={data.customers.toLocaleString()}
            change="+33.3%"
            icon={<GroupsOutlined />}
            tone="purple"
          />
        </div>

        {/* ROW TWO: QUICK ACTIONS */}
        <div className="pd-action-row">
            <Panel
              title={t("Quick Actions")}
              icon={<BoltOutlined />}
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
                  label={t("Add Product")}
                  tone="orange"
                  onClick={() => navigate("/products/new")}
                />
                <QuickAction
                  icon={<Inventory2Outlined />}
                  label={t("Purchase Order")}
                  tone="purple"
                  onClick={() => navigate("/purchases/new")}
                />
                <QuickAction
                  icon={<SwapHorizOutlined />}
                  label={t("Stock Adjustment")}
                  tone="blue"
                  onClick={() =>
                    navigate("/inventory/adjustments")
                  }
                />
                <QuickAction
                  icon={<GroupsOutlined />}
                  label={t("Add Customer")}
                  tone="teal"
                  onClick={() => navigate("/customers/new")}
                />
                <QuickAction
                  icon={<AssessmentOutlined />}
                  label={t("View Reports")}
                  tone="pink"
                  onClick={() => navigate("/reports")}
                />
              </div>
            </Panel>

        </div>

        {/* ROW THREE: SUMMARY AND STOCK ALERTS */}
        <div className="pd-insights-row">
            <Panel
              title={t("Today's Summary")}
              icon={<CalendarTodayOutlined />}
              className="pd-summary-panel"
            >
              <div className="pd-summary-list">
                <div className="pd-summary-row">
                  <span className="pd-summary-icon pd-summary-icon-sales"><PaidOutlined /></span>
                  <span className="pd-summary-details"><small>{t("Gross Sales")}</small><strong>{money(data.sales)}</strong></span>
                </div>
                <div className="pd-summary-row">
                  <span className="pd-summary-icon pd-summary-icon-profit"><TrendingUpOutlined /></span>
                  <span className="pd-summary-details"><small>{t("Gross Profit")}</small><strong>{money(data.profit)}</strong></span>
                </div>
                <div className="pd-summary-row">
                  <span className="pd-summary-icon pd-summary-icon-margin"><PercentOutlined /></span>
                  <span className="pd-summary-details"><small>{t("Profit Margin")}</small><strong>{data.sales > 0 ? ((data.profit / data.sales) * 100).toFixed(1) : "0.0"}%</strong></span>
                </div>
                <div className="pd-summary-row">
                  <span className="pd-summary-icon pd-summary-icon-average"><ReceiptLongOutlined /></span>
                  <span className="pd-summary-details"><small>{t("Avg. Sale Value")}</small><strong>{money(data.transactions > 0 ? data.sales / data.transactions : 0)}</strong></span>
                </div>
              </div>
            </Panel>
          <Panel
            title={t("Low Stock Alerts")}
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
                    <strong>{t(item.name)}</strong>
                    <small>{item.id}</small>
                  </span>
                  <span className="pd-stock-quantity">
                    {si ? `තව ${item.quantity} ක් තියෙනවා` : `${item.quantity} left`}
                  </span>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        {/* ROW FOUR: ANALYTICS */}
        <div className="pd-analytics-row">
            <Panel
              title={t("Sales Overview")}
              icon={<AssessmentOutlined />}
              className="pd-sales-panel"
              action={
                <div
                  className="pd-chart-tabs"
                  role="group"
                  aria-label={t("Sales chart metric")}
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
                      {t(item.charAt(0).toUpperCase() + item.slice(1))}
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
              title={t("Sales by Category")}
              icon={<LocalOfferOutlined />}
              className="pd-category-panel"
            >
              <CategoryChart total={data.sales} />
            </Panel>
        </div>
      </div>
    </div>
  );
}
