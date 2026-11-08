
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
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
  FileDownloadOutlined,
  HistoryOutlined,
  SearchOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type CashMovementType = "cash-in" | "cash-out";

export type CashTrackingMode = "standard" | "advanced";

export interface CashMovementDenomination {
  value: number;
  type: "note" | "coin";
  quantity: number;
  total: number;
}

export interface CashMovementRecord {
  id: string;
  reference: string;
  type: CashMovementType;
  amount: number;
  reason: string;

  createdAt: string;
  createdBy: string;
  cashierId?: string;

  shiftId: string;
  terminalId: string;
  terminalName?: string;

  balanceBefore?: number;
  balanceAfter?: number;

  trackingMode: CashTrackingMode;
  denominations?: CashMovementDenomination[];

  notes?: string;
}

export interface CashMovementHistoryProps {
  movements: CashMovementRecord[];

  loading?: boolean;
  error?: string | null;

  title?: string;
  shiftId?: string;

  canViewBalances?: boolean;
  canExport?: boolean;

  onExport?: (
    records: CashMovementRecord[]
  ) => void | Promise<void>;

  onViewMovement?: (
    record: CashMovementRecord
  ) => void;
}

// ============================================
// HELPERS
// ============================================

const formatMoney = (value: number): string =>
  `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-LK");
};

// ============================================
// COMPONENT
// ============================================

export default function CashMovementHistory({
  movements,
  loading = false,
  error = null,
  title = "Cash Movement History",
  shiftId,
  canViewBalances = true,
  canExport = true,
  onExport,
  onViewMovement,
}: CashMovementHistoryProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<"all" | CashMovementType>("all");

  const [selectedShift, setSelectedShift] =
    useState(shiftId ?? "all");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedMovement, setSelectedMovement] =
    useState<CashMovementRecord | null>(null);

  const [exporting, setExporting] = useState(false);
  const [localError, setLocalError] =
    useState<string | null>(null);

  // ==========================================
  // SHIFT OPTIONS
  // ==========================================

  const shiftOptions = useMemo(
    () =>
      Array.from(
        new Set(movements.map((movement) => movement.shiftId))
      ).sort(),
    [movements]
  );

  // ==========================================
  // FILTERING
  // ==========================================

  const filteredMovements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return movements
      .filter((movement) => {
        if (
          typeFilter !== "all" &&
          movement.type !== typeFilter
        ) {
          return false;
        }

        if (
          selectedShift !== "all" &&
          movement.shiftId !== selectedShift
        ) {
          return false;
        }

        if (startDate || endDate) {
          const timestamp = new Date(
            movement.createdAt
          ).getTime();

          if (Number.isNaN(timestamp)) return false;

          if (startDate) {
            const start = new Date(
              `${startDate}T00:00:00`
            ).getTime();

            if (timestamp < start) return false;
          }

          if (endDate) {
            const end = new Date(
              `${endDate}T23:59:59.999`
            ).getTime();

            if (timestamp > end) return false;
          }
        }

        if (!query) return true;

        const searchable = [
          movement.reference,
          movement.reason,
          movement.createdBy,
          movement.shiftId,
          movement.terminalId,
          movement.terminalName ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  }, [
    movements,
    search,
    typeFilter,
    selectedShift,
    startDate,
    endDate,
  ]);

  // ==========================================
  // SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    const cashIn = filteredMovements
      .filter((movement) => movement.type === "cash-in")
      .reduce((sum, movement) => sum + movement.amount, 0);

    const cashOut = filteredMovements
      .filter((movement) => movement.type === "cash-out")
      .reduce((sum, movement) => sum + movement.amount, 0);

    return {
      cashIn,
      cashOut,
      net: cashIn - cashOut,
      count: filteredMovements.length,
    };
  }, [filteredMovements]);

  const paginatedMovements = filteredMovements.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // ==========================================
  // EXPORT
  // ==========================================

  const handleExport = async () => {
    if (!onExport || exporting) return;

    setExporting(true);
    setLocalError(null);

    try {
      await onExport(filteredMovements);
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to export records."
      );
    } finally {
      setExporting(false);
    }
  };

  // ==========================================
  // RESET FILTERS
  // ==========================================

  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setSelectedShift(shiftId ?? "all");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, borderRadius: 2 }}
    >
      <Stack spacing={3}>
        {/* HEADER */}

        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={1.5}>
            <HistoryOutlined color="primary" />

            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              {title}
            </Typography>
          </Stack>

          <Button
            variant="outlined"
            startIcon={
              exporting ? (
                <CircularProgress size={16} />
              ) : (
                <FileDownloadOutlined />
              )
            }
            disabled={
              !canExport ||
              !onExport ||
              exporting ||
              loading
            }
            onClick={() => {
              void handleExport();
            }}
          >
            Export
          </Button>
        </Stack>

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
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          {[
            {
              label: "Cash In",
              value: formatMoney(summary.cashIn),
              color: "success.main",
            },
            {
              label: "Cash Out",
              value: formatMoney(summary.cashOut),
              color: "error.main",
            },
            {
              label: "Net Movement",
              value: `${summary.net >= 0 ? "+" : "−"} ${formatMoney(Math.abs(summary.net))}`,
              color:
                summary.net >= 0
                  ? "success.main"
                  : "error.main",
            },
            {
              label: "Transactions",
              value: String(summary.count),
              color: "text.primary",
            },
          ].map((item) => (
            <Paper
              key={item.label}
              variant="outlined"
              sx={{ p: 2, borderRadius: 2 }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {item.label}
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: item.color,
                }}
              >
                {item.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* FILTERS */}

        <Stack
          direction={{ xs: "column", md: "row" }}
          sx={{ gap: 2 }}
        >
          <TextField
            size="small"
            label="Search"
            placeholder="Reference, reason, cashier..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <SearchOutlined
                    fontSize="small"
                    sx={{ mr: 1, color: "text.secondary" }}
                  />
                ),
              },
            }}
            sx={{ flex: 2 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Movement Type</InputLabel>

            <Select
              value={typeFilter}
              label="Movement Type"
              onChange={(event) => {
                setTypeFilter(
                  event.target.value as
                    | "all"
                    | CashMovementType
                );
                setPage(0);
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="cash-in">Cash In</MenuItem>
              <MenuItem value="cash-out">Cash Out</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Shift</InputLabel>

            <Select
              value={selectedShift}
              label="Shift"
              onChange={(event) => {
                setSelectedShift(event.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="all">All Shifts</MenuItem>

              {shiftOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ gap: 2 }}
        >
          <TextField
            label="From Date"
            type="date"
            size="small"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPage(0);
            }}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />

          <TextField
            label="To Date"
            type="date"
            size="small"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPage(0);
            }}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />

          <Button
            variant="text"
            onClick={handleResetFilters}
          >
            Reset Filters
          </Button>
        </Stack>

        {/* TABLE */}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Cashier</TableCell>
                <TableCell align="center">Details</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : paginatedMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography
                      color="text.secondary"
                      sx={{ py: 3 }}
                    >
                      No cash movements found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMovements.map((movement) => (
                  <TableRow
                    key={movement.id}
                    hover
                  >
                    <TableCell>
                      {movement.reference}
                    </TableCell>

                    <TableCell>
                      {formatDateTime(
                        movement.createdAt
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        color={
                          movement.type === "cash-in"
                            ? "success"
                            : "warning"
                        }
                        icon={
                          movement.type === "cash-in" ? (
                            <ArrowDownwardOutlined />
                          ) : (
                            <ArrowUpwardOutlined />
                          )
                        }
                        label={
                          movement.type === "cash-in"
                            ? "Cash In"
                            : "Cash Out"
                        }
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color:
                            movement.type === "cash-in"
                              ? "success.main"
                              : "error.main",
                        }}
                      >
                        {movement.type === "cash-in"
                          ? "+"
                          : "−"}{" "}
                        {formatMoney(movement.amount)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {movement.reason}
                    </TableCell>

                    <TableCell>
                      {movement.createdBy}
                    </TableCell>

                    <TableCell align="center">
                      <Button
                        size="small"
                        startIcon={<VisibilityOutlined />}
                        onClick={() => {
                          setSelectedMovement(movement);
                          onViewMovement?.(movement);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredMovements.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) =>
            setPage(newPage)
          }
          onRowsPerPageChange={(event) => {
            setRowsPerPage(
              Number(event.target.value)
            );
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Stack>

      {/* DETAILS DIALOG */}

      <Dialog
        open={Boolean(selectedMovement)}
        onClose={() => setSelectedMovement(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Cash Movement Details
        </DialogTitle>

        <DialogContent>
          {selectedMovement && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography>
                <strong>Reference:</strong>{" "}
                {selectedMovement.reference}
              </Typography>

              <Typography>
                <strong>Type:</strong>{" "}
                {selectedMovement.type === "cash-in"
                  ? "Cash In"
                  : "Cash Out"}
              </Typography>

              <Typography>
                <strong>Amount:</strong>{" "}
                {formatMoney(selectedMovement.amount)}
              </Typography>

              <Typography>
                <strong>Date:</strong>{" "}
                {formatDate(
                  selectedMovement.createdAt
                )}
              </Typography>

              <Typography>
                <strong>Time:</strong>{" "}
                {formatDateTime(
                  selectedMovement.createdAt
                )}
              </Typography>

              <Typography>
                <strong>Cashier:</strong>{" "}
                {selectedMovement.createdBy}
              </Typography>

              <Typography>
                <strong>Shift:</strong>{" "}
                {selectedMovement.shiftId}
              </Typography>

              <Typography>
                <strong>Terminal:</strong>{" "}
                {selectedMovement.terminalName ||
                  selectedMovement.terminalId}
              </Typography>

              <Typography>
                <strong>Reason:</strong>{" "}
                {selectedMovement.reason}
              </Typography>

              {canViewBalances &&
                selectedMovement.balanceBefore !==
                  undefined &&
                selectedMovement.balanceAfter !==
                  undefined && (
                  <>
                    <Divider />

                    <Typography>
                      <strong>Balance Before:</strong>{" "}
                      {formatMoney(
                        selectedMovement.balanceBefore
                      )}
                    </Typography>

                    <Typography>
                      <strong>Balance After:</strong>{" "}
                      {formatMoney(
                        selectedMovement.balanceAfter
                      )}
                    </Typography>
                  </>
                )}

              {selectedMovement.denominations &&
                selectedMovement.denominations.length > 0 && (
                  <>
                    <Divider />

                    <Typography
                      sx={{ fontWeight: 700 }}
                    >
                      Denomination Breakdown
                    </Typography>

                    {selectedMovement.denominations.map(
                      (line) => (
                        <Stack
                          key={`${line.type}-${line.value}`}
                          direction="row"
                          sx={{
                            justifyContent:
                              "space-between",
                          }}
                        >
                          <Typography variant="body2">
                            {formatMoney(line.value)} ×{" "}
                            {line.quantity}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600 }}
                          >
                            {formatMoney(line.total)}
                          </Typography>
                        </Stack>
                      )
                    )}
                  </>
                )}

              {selectedMovement.notes && (
                <>
                  <Divider />

                  <Typography>
                    <strong>Notes:</strong>{" "}
                    {selectedMovement.notes}
                  </Typography>
                </>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setSelectedMovement(null)
            }
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
