
import { useMemo, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  CalendarMonthOutlined,
  ExpandLessOutlined,
  ExpandMoreOutlined,
  HistoryOutlined,
  Inventory2Outlined,
  LoginOutlined,
  LogoutOutlined,
  PaymentsOutlined,
  ReceiptLongOutlined,
  SearchOutlined,
  SyncOutlined,
  UndoOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type UserActivityCategory =
  | "sale"
  | "refund"
  | "inventory"
  | "payment"
  | "day-ending"
  | "login"
  | "logout"
  | "sync"
  | "other";

export interface UserActivity {
  id: string;
  title: string;
  description?: string;
  category: UserActivityCategory;
  timestamp: string;
  reference?: string;
  details?: Record<
    string,
    string | number | boolean | null
  >;
}

export interface TimelineUser {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
}

export interface UserActivityTimelineProps {
  user: TimelineUser;
  activities: UserActivity[];
  loading?: boolean;
  error?: string | null;
  pageSize?: number;
  showSearch?: boolean;
  showFilter?: boolean;
  emptyMessage?: string;
  onOpenActivity?: (activity: UserActivity) => void;
}

// ============================================
// CONFIGURATION
// ============================================

const CATEGORY_LABELS: Record<
  UserActivityCategory,
  string
> = {
  sale: "Sales",
  refund: "Refunds",
  inventory: "Inventory",
  payment: "Payments",
  "day-ending": "Day Ending",
  login: "Login",
  logout: "Logout",
  sync: "Synchronization",
  other: "Other",
};

function getCategoryIcon(
  category: UserActivityCategory
) {
  switch (category) {
    case "sale":
      return <ReceiptLongOutlined fontSize="small" />;

    case "refund":
      return <UndoOutlined fontSize="small" />;

    case "inventory":
      return <Inventory2Outlined fontSize="small" />;

    case "payment":
      return <PaymentsOutlined fontSize="small" />;

    case "day-ending":
      return <CalendarMonthOutlined fontSize="small" />;

    case "login":
      return <LoginOutlined fontSize="small" />;

    case "logout":
      return <LogoutOutlined fontSize="small" />;

    case "sync":
      return <SyncOutlined fontSize="small" />;

    default:
      return <HistoryOutlined fontSize="small" />;
  }
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateKey(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatDetail(
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

export default function UserActivityTimeline({
  user,
  activities,
  loading = false,
  error = null,
  pageSize = 10,
  showSearch = true,
  showFilter = true,
  emptyMessage = "No activities found for this user.",
  onOpenActivity,
}: UserActivityTimelineProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expandedIds, setExpandedIds] =
    useState<string[]>([]);
  const [visibleCount, setVisibleCount] =
    useState(pageSize);

  // ==========================================
  // FILTER AND SORT
  // ==========================================

  const filteredActivities = useMemo(() => {
    const term = search.trim().toLowerCase();

    return activities
      .filter((activity) => {
        const matchesCategory =
          category === "all" ||
          activity.category === category;

        const searchable = [
          activity.title,
          activity.description ?? "",
          activity.reference ?? "",
          CATEGORY_LABELS[activity.category],
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesCategory &&
          (!term || searchable.includes(term))
        );
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      );
  }, [activities, search, category]);

  const displayedActivities =
    filteredActivities.slice(0, visibleCount);

  const groupedActivities = useMemo(() => {
    const groups: Record<string, UserActivity[]> = {};

    for (const activity of displayedActivities) {
      const dateKey = formatDateKey(activity.timestamp);

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(activity);
    }

    return Object.entries(groups);
  }, [displayedActivities]);

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
      sx={{ p: { xs: 2, md: 3 } }}
    >
      <Stack spacing={2.5}>
        {/* USER HEADER */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar
            src={user.avatarUrl}
            alt={user.name}
            sx={{
              width: 52,
              height: 52,
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              {user.name}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {user.id}
              {user.role ? ` · ${user.role}` : ""}
            </Typography>
          </Box>

          <Chip
            size="small"
            variant="outlined"
            label={`${filteredActivities.length} activities`}
          />
        </Box>

        {/* SEARCH AND FILTER */}
        {(showSearch || showFilter) && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
          >
            {showSearch && (
              <TextField
                fullWidth
                size="small"
                placeholder="Search user activities..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPagination();
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <SearchOutlined
                        fontSize="small"
                        sx={{ mr: 1 }}
                      />
                    ),
                  },
                }}
              />
            )}

            {showFilter && (
              <TextField
                select
                size="small"
                label="Category"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  resetPagination();
                }}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="all">
                  All Categories
                </MenuItem>

                {(
                  Object.entries(CATEGORY_LABELS) as [
                    UserActivityCategory,
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
              </TextField>
            )}
          </Stack>
        )}

        {/* ERROR */}
        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        {/* LOADING */}
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

        {/* EMPTY */}
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
                sx={{ textAlign: "center" }}
              >
                {emptyMessage}
              </Typography>
            </Stack>
          )}

        {/* TIMELINE */}
        {!loading &&
          groupedActivities.length > 0 &&
          groupedActivities.map(([date, items]) => (
            <Box key={date}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                {date}
              </Typography>

              <Stack spacing={0}>
                {items.map((activity, index) => {
                  const expanded =
                    expandedIds.includes(activity.id);

                  return (
                    <Box
                      key={activity.id}
                      sx={{
                        display: "flex",
                        gap: 2,
                      }}
                    >
                      {/* TIMELINE INDICATOR */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          width: 36,
                          flexShrink: 0,
                        }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            bgcolor: "action.hover",
                            color: "primary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {getCategoryIcon(
                            activity.category
                          )}
                        </Box>

                        {index < items.length - 1 && (
                          <Box
                            sx={{
                              width: 2,
                              flex: 1,
                              minHeight: 20,
                              bgcolor: "divider",
                            }}
                          />
                        )}
                      </Box>

                      {/* CONTENT */}
                      <Box
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          pb: 3,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {activity.title}
                        </Typography>

                        {activity.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {activity.description}
                          </Typography>
                        )}

                        <Stack
                          direction="row"
                          sx={{
                            mt: 0.5,
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {formatTime(
                              activity.timestamp
                            )}
                          </Typography>

                          {activity.reference && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              · {activity.reference}
                            </Typography>
                          )}
                        </Stack>

                        {/* DETAILS */}
                        {activity.details &&
                          Object.keys(activity.details)
                            .length > 0 && (
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
                                sx={{ mt: 1, px: 0 }}
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
                                            {formatDetail(
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

                        {/* OPEN ACTIVITY */}
                        {onOpenActivity && (
                          <Button
                            size="small"
                            onClick={() =>
                              onOpenActivity(
                                activity
                              )
                            }
                            sx={{ mt: 1, ml: 1 }}
                          >
                            Open Record
                          </Button>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Stack>

              <Divider sx={{ my: 2 }} />
            </Box>
          ))}

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
