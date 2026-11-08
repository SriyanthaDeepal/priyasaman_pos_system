
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  CalendarMonthOutlined,
  ChevronRightOutlined,
  ExpandLessOutlined,
  ExpandMoreOutlined,
  HistoryOutlined,
  Inventory2Outlined,
  LoginOutlined,
  PaymentsOutlined,
  PrintOutlined,
  ReceiptLongOutlined,
  SearchOutlined,
  SyncOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type ActivityCategory =
  | "sale"
  | "refund"
  | "inventory"
  | "payment"
  | "day-ending"
  | "authentication"
  | "printer"
  | "sync"
  | "system"
  | "other";

export type ActivitySeverity =
  | "info"
  | "success"
  | "warning"
  | "error";

export interface ActivityLogEntry {
  id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  severity?: ActivitySeverity;
  timestamp: string;
  actor?: string;
  reference?: string;
  details?: Record<
    string,
    string | number | boolean | null
  >;
}

export interface ActivityLogProps {
  activities: ActivityLogEntry[];
  loading?: boolean;
  error?: string | null;
  title?: string;
  pageSize?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  emptyMessage?: string;
  onActivityClick?: (
    activity: ActivityLogEntry
  ) => void;
}

// ============================================
// CATEGORY CONFIGURATION
// ============================================

const CATEGORY_LABELS: Record<
  ActivityCategory,
  string
> = {
  sale: "Sales",
  refund: "Refunds",
  inventory: "Inventory",
  payment: "Payments",
  "day-ending": "Day Ending",
  authentication: "Authentication",
  printer: "Printer",
  sync: "Synchronization",
  system: "System",
  other: "Other",
};

const CATEGORY_ICONS: Record<
  ActivityCategory,
  ReactNode
> = {
  sale: <ReceiptLongOutlined fontSize="small" />,
  refund: <ChevronRightOutlined fontSize="small" />,
  inventory: <Inventory2Outlined fontSize="small" />,
  payment: <PaymentsOutlined fontSize="small" />,
  "day-ending": (
    <CalendarMonthOutlined fontSize="small" />
  ),
  authentication: <LoginOutlined fontSize="small" />,
  printer: <PrintOutlined fontSize="small" />,
  sync: <SyncOutlined fontSize="small" />,
  system: <HistoryOutlined fontSize="small" />,
  other: <HistoryOutlined fontSize="small" />,
};

const SEVERITY_COLORS: Record<
  ActivitySeverity,
  "info" | "success" | "warning" | "error"
> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
};

// ============================================
// HELPERS
// ============================================

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDetailValue(
  value: string | number | boolean | null
): string {
  if (value === null) return "—";

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

// ============================================
// COMPONENT
// ============================================

export default function ActivityLog({
  activities,
  loading = false,
  error = null,
  title = "Activity History",
  pageSize = 10,
  showSearch = true,
  showFilters = true,
  emptyMessage = "No activities found.",
  onActivityClick,
}: ActivityLogProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");

  const [expandedIds, setExpandedIds] =
    useState<string[]>([]);

  const [visibleCount, setVisibleCount] =
    useState(pageSize);

  // ==========================================
  // FILTER AND SORT ACTIVITIES
  // ==========================================

  const filteredActivities = useMemo(() => {
    const term = search.trim().toLowerCase();

    return activities
      .filter((activity) => {
        const matchesCategory =
          category === "all" ||
          activity.category === category;

        const matchesSeverity =
          severity === "all" ||
          (activity.severity ?? "info") === severity;

        const searchable = [
          activity.title,
          activity.description ?? "",
          activity.actor ?? "",
          activity.reference ?? "",
          CATEGORY_LABELS[activity.category],
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesCategory &&
          matchesSeverity &&
          (!term || searchable.includes(term))
        );
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      );
  }, [activities, search, category, severity]);

  const displayedActivities =
    filteredActivities.slice(0, visibleCount);

  // ==========================================
  // HANDLERS
  // ==========================================

  const toggleExpanded = (id: string) => {
    setExpandedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const resetPagination = () => {
    setVisibleCount(pageSize);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: 2,
          md: 3,
        },
      }}
    >
      <Stack spacing={2.5}>
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              {title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {filteredActivities.length} activity records
            </Typography>
          </Box>

          <HistoryOutlined color="action" />
        </Box>

        {/* SEARCH AND FILTERS */}
        {(showSearch || showFilters) && (
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1.5}
          >
            {showSearch && (
              <TextField
                size="small"
                fullWidth
                placeholder="Search activities..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPagination();
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}

            {showFilters && (
              <>
                {/* CATEGORY FILTER */}
                <FormControl
                  size="small"
                  sx={{ minWidth: 150 }}
                >
                  <Select
                    value={category}
                    onChange={(event) => {
                      setCategory(event.target.value);
                      resetPagination();
                    }}
                    displayEmpty
                    aria-label="Filter activity category"
                  >
                    <MenuItem value="all">
                      All Categories
                    </MenuItem>

                    {(
                      Object.entries(
                        CATEGORY_LABELS
                      ) as [
                        ActivityCategory,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <MenuItem
                        key={value}
                        value={value}
                      >
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* SEVERITY FILTER */}
                <FormControl
                  size="small"
                  sx={{ minWidth: 135 }}
                >
                  <Select
                    value={severity}
                    onChange={(event) => {
                      setSeverity(event.target.value);
                      resetPagination();
                    }}
                    displayEmpty
                    aria-label="Filter activity severity"
                  >
                    <MenuItem value="all">
                      All Statuses
                    </MenuItem>

                    <MenuItem value="info">
                      Info
                    </MenuItem>

                    <MenuItem value="success">
                      Success
                    </MenuItem>

                    <MenuItem value="warning">
                      Warning
                    </MenuItem>

                    <MenuItem value="error">
                      Error
                    </MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </Stack>
        )}

        {/* ERROR STATE */}
        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        {/* LOADING STATE */}
        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 4,
            }}
          >
            <CircularProgress size={30} />
          </Box>
        )}

        {/* EMPTY STATE */}
        {!loading &&
          filteredActivities.length === 0 && (
            <Stack
              spacing={1}
              sx={{
                py: 5,
                alignItems: "center",
              }}
            >
              <HistoryOutlined
                sx={{
                  fontSize: 42,
                  color: "text.disabled",
                }}
              />

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  textAlign: "center",
                }}
              >
                {emptyMessage}
              </Typography>
            </Stack>
          )}

        {/* ACTIVITY LIST */}
        {!loading &&
          displayedActivities.length > 0 && (
            <Stack
              divider={<Divider flexItem />}
              spacing={0}
            >
              {displayedActivities.map((activity) => {
                const expanded =
                  expandedIds.includes(activity.id);

                const severityValue =
                  activity.severity ?? "info";

                return (
                  <Box
                    key={activity.id}
                    sx={{ py: 2 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                      }}
                    >
                      {/* ACTIVITY ICON */}
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: `${severityValue}.light`,
                          color: `${severityValue}.dark`,
                          flexShrink: 0,
                        }}
                      >
                        {
                          CATEGORY_ICONS[
                            activity.category
                          ]
                        }
                      </Box>

                      {/* ACTIVITY CONTENT */}
                      <Box
                        sx={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "flex-start",
                            gap: 1,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                              }}
                            >
                              {activity.title}
                            </Typography>

                            {activity.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {
                                  activity.description
                                }
                              </Typography>
                            )}
                          </Box>

                          <Chip
                            label={severityValue}
                            size="small"
                            color={
                              SEVERITY_COLORS[
                                severityValue
                              ]
                            }
                            variant="outlined"
                          />
                        </Box>

                        {/* ACTIVITY METADATA */}
                        <Stack
                          direction="row"
                          sx={{
                            mt: 1,
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {formatTimestamp(
                              activity.timestamp
                            )}
                          </Typography>

                          {activity.actor && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              · {activity.actor}
                            </Typography>
                          )}

                          {activity.reference && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              · {activity.reference}
                            </Typography>
                          )}
                        </Stack>

                        {/* EXPANDABLE DETAILS */}
                        {activity.details &&
                          Object.keys(
                            activity.details
                          ).length > 0 && (
                            <>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() =>
                                  toggleExpanded(
                                    activity.id
                                  )
                                }
                                endIcon={
                                  expanded ? (
                                    <ExpandLessOutlined />
                                  ) : (
                                    <ExpandMoreOutlined />
                                  )
                                }
                                sx={{
                                  mt: 1,
                                  px: 0,
                                }}
                              >
                                {expanded
                                  ? "Hide Details"
                                  : "View Details"}
                              </Button>

                              <Collapse in={expanded}>
                                <Box
                                  sx={{
                                    mt: 1,
                                    p: 2,
                                    bgcolor:
                                      "action.hover",
                                    borderRadius: 1,
                                  }}
                                >
                                  <Stack spacing={1}>
                                    {Object.entries(
                                      activity.details
                                    ).map(
                                      ([key, value]) => (
                                        <Box
                                          key={key}
                                          sx={{
                                            display:
                                              "flex",
                                            justifyContent:
                                              "space-between",
                                            gap: 2,
                                          }}
                                        >
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {key}
                                          </Typography>

                                          <Typography
                                            variant="caption"
                                          >
                                            {formatDetailValue(
                                              value
                                            )}
                                          </Typography>
                                        </Box>
                                      )
                                    )}
                                  </Stack>
                                </Box>
                              </Collapse>
                            </>
                          )}

                        {/* OPEN RECORD */}
                        {onActivityClick && (
                          <Button
                            size="small"
                            onClick={() =>
                              onActivityClick(
                                activity
                              )
                            }
                            sx={{
                              mt: 1,
                              ml: 1,
                            }}
                          >
                            Open Record
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}

        {/* LOAD MORE */}
        {!loading &&
          visibleCount <
            filteredActivities.length && (
            <Button
              variant="outlined"
              onClick={() =>
                setVisibleCount(
                  (previous) =>
                    previous + pageSize
                )
              }
            >
              Load More
            </Button>
          )}
      </Stack>
    </Paper>
  );
}
