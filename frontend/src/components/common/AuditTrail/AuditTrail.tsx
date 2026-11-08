
import { useMemo, useState } from "react";

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
  AddCircleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ExpandLessOutlined,
  ExpandMoreOutlined,
  HistoryOutlined,
  SearchOutlined,
  SecurityOutlined,
  UpdateOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "RESTORE";

export type AuditValue =
  | string
  | number
  | boolean
  | null;

export interface AuditChange {
  field: string;
  before?: AuditValue;
  after?: AuditValue;
}

export interface AuditTrailEntry {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  title: string;
  timestamp: string;
  actorId?: string;
  actorName?: string;
  reference?: string;
  reason?: string;
  changes?: AuditChange[];
}

export interface AuditTrailProps {
  entries: AuditTrailEntry[];
  loading?: boolean;
  error?: string | null;
  title?: string;
  pageSize?: number;
  showSearch?: boolean;
  showActionFilter?: boolean;
  emptyMessage?: string;
  onOpenRecord?: (entry: AuditTrailEntry) => void;
}

// ============================================
// ACTION CONFIGURATION
// ============================================

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  APPROVE: "Approved",
  REJECT: "Rejected",
  RESTORE: "Restored",
};

const ACTION_COLORS: Record<
  AuditAction,
  "default" | "info" | "error" | "success" | "warning"
> = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "error",
  APPROVE: "success",
  REJECT: "warning",
  RESTORE: "info",
};

// ============================================
// HELPERS
// ============================================

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatValue(
  value: AuditValue | undefined
): string {
  if (value === undefined) {
    return "Not recorded";
  }

  if (value === null) {
    return "Null";
  }

  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }

  return String(value);
}

function getChangeType(
  change: AuditChange
): "added" | "removed" | "modified" | "unchanged" {
  if (
    change.before === undefined &&
    change.after !== undefined
  ) {
    return "added";
  }

  if (
    change.before !== undefined &&
    change.after === undefined
  ) {
    return "removed";
  }

  if (change.before === change.after) {
    return "unchanged";
  }

  return "modified";
}

// ============================================
// COMPONENT
// ============================================

export default function AuditTrail({
  entries,
  loading = false,
  error = null,
  title = "Audit Trail",
  pageSize = 10,
  showSearch = true,
  showActionFilter = true,
  emptyMessage = "No audit records found.",
  onOpenRecord,
}: AuditTrailProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] =
    useState("all");

  const [expandedIds, setExpandedIds] =
    useState<string[]>([]);

  const [visibleCount, setVisibleCount] =
    useState(pageSize);

  // ==========================================
  // FILTER AND SORT
  // ==========================================

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();

    return entries
      .filter((entry) => {
        const matchesAction =
          actionFilter === "all" ||
          entry.action === actionFilter;

        const searchable = [
          entry.title,
          entry.entityType,
          entry.entityId,
          entry.actorName ?? "",
          entry.actorId ?? "",
          entry.reference ?? "",
          entry.reason ?? "",
          entry.action,
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesAction &&
          (!term || searchable.includes(term))
        );
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      );
  }, [entries, search, actionFilter]);

  const displayedEntries =
    filteredEntries.slice(0, visibleCount);

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
              {filteredEntries.length} audit records
            </Typography>
          </Box>

          <SecurityOutlined color="action" />
        </Box>

        {/* SEARCH AND FILTER */}
        {(showSearch || showActionFilter) && (
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1.5}
          >
            {showSearch && (
              <TextField
                fullWidth
                size="small"
                placeholder="Search audit records..."
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

            {showActionFilter && (
              <FormControl
                size="small"
                sx={{ minWidth: 160 }}
              >
                <Select
                  value={actionFilter}
                  onChange={(event) => {
                    setActionFilter(event.target.value);
                    resetPagination();
                  }}
                  displayEmpty
                  aria-label="Filter audit action"
                >
                  <MenuItem value="all">
                    All Actions
                  </MenuItem>

                  {(
                    Object.entries(
                      ACTION_LABELS
                    ) as [
                      AuditAction,
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
          filteredEntries.length === 0 && (
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

        {/* AUDIT ENTRIES */}
        {!loading &&
          displayedEntries.length > 0 && (
            <Stack
              divider={<Divider flexItem />}
              spacing={0}
            >
              {displayedEntries.map((entry) => {
                const expanded =
                  expandedIds.includes(entry.id);

                return (
                  <Box
                    key={entry.id}
                    sx={{ py: 2 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                      }}
                    >
                      {/* ACTION ICON */}
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "action.hover",
                          flexShrink: 0,
                        }}
                      >
                        {entry.action ===
                          "CREATE" && (
                          <AddCircleOutlined
                            color="success"
                          />
                        )}

                        {entry.action ===
                          "UPDATE" && (
                          <UpdateOutlined
                            color="info"
                          />
                        )}

                        {entry.action ===
                          "DELETE" && (
                          <DeleteOutlined
                            color="error"
                          />
                        )}

                        {entry.action ===
                          "APPROVE" && (
                          <CheckCircleOutlined
                            color="success"
                          />
                        )}

                        {entry.action ===
                          "REJECT" && (
                          <SecurityOutlined
                            color="warning"
                          />
                        )}

                        {entry.action ===
                          "RESTORE" && (
                          <HistoryOutlined
                            color="info"
                          />
                        )}
                      </Box>

                      {/* ENTRY CONTENT */}
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
                              {entry.title}
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {entry.entityType} ·{" "}
                              {entry.entityId}
                            </Typography>
                          </Box>

                          <Chip
                            size="small"
                            variant="outlined"
                            label={
                              ACTION_LABELS[
                                entry.action
                              ]
                            }
                            color={
                              ACTION_COLORS[
                                entry.action
                              ]
                            }
                          />
                        </Box>

                        {/* METADATA */}
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
                            {formatDate(
                              entry.timestamp
                            )}
                          </Typography>

                          {entry.actorName && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              · {entry.actorName}
                            </Typography>
                          )}

                          {entry.reference && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              · {entry.reference}
                            </Typography>
                          )}
                        </Stack>

                        {/* EXPAND DETAILS */}
                        {(entry.reason ||
                          (entry.changes &&
                            entry.changes.length >
                              0)) && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={() =>
                              toggleExpanded(
                                entry.id
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
                              ? "Hide Changes"
                              : "View Changes"}
                          </Button>
                        )}

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
                            {/* REASON */}
                            {entry.reason && (
                              <Typography
                                variant="body2"
                                sx={{ mb: 2 }}
                              >
                                <strong>
                                  Reason:
                                </strong>{" "}
                                {entry.reason}
                              </Typography>
                            )}

                            {/* BEFORE / AFTER */}
                            {entry.changes &&
                              entry.changes.length >
                                0 && (
                                <Stack
                                  spacing={1.5}
                                >
                                  {entry.changes.map(
                                    (
                                      change,
                                      index
                                    ) => {
                                      const type =
                                        getChangeType(
                                          change
                                        );

                                      return (
                                        <Box
                                          key={`${change.field}-${index}`}
                                        >
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              fontWeight:
                                                700,
                                            }}
                                          >
                                            {
                                              change.field
                                            }
                                          </Typography>

                                          <Box
                                            sx={{
                                              display:
                                                "grid",
                                              gridTemplateColumns:
                                                "1fr 1fr",
                                              gap: 2,
                                              mt: 0.5,
                                            }}
                                          >
                                            {/* BEFORE */}
                                            <Box>
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                              >
                                                Before
                                              </Typography>

                                              <Typography
                                                variant="body2"
                                                sx={{
                                                  wordBreak:
                                                    "break-word",
                                                }}
                                              >
                                                {formatValue(
                                                  change.before
                                                )}
                                              </Typography>
                                            </Box>

                                            {/* AFTER */}
                                            <Box>
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                              >
                                                After
                                              </Typography>

                                              <Typography
                                                variant="body2"
                                                sx={{
                                                  fontWeight:
                                                    600,
                                                  wordBreak:
                                                    "break-word",
                                                  color:
                                                    type ===
                                                    "added"
                                                      ? "success.main"
                                                      : type ===
                                                          "removed"
                                                        ? "error.main"
                                                        : "text.primary",
                                                }}
                                              >
                                                {formatValue(
                                                  change.after
                                                )}
                                              </Typography>
                                            </Box>
                                          </Box>

                                          <Divider
                                            sx={{
                                              mt: 1.5,
                                            }}
                                          />
                                        </Box>
                                      );
                                    }
                                  )}
                                </Stack>
                              )}
                          </Box>
                        </Collapse>

                        {/* OPEN RECORD */}
                        {onOpenRecord && (
                          <Button
                            size="small"
                            onClick={() =>
                              onOpenRecord(
                                entry
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
            filteredEntries.length && (
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
