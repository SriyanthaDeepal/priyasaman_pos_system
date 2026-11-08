
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from "@mui/material";

import LoadingSpinner from "../../common/LoadingSpinner";
import EmptyState from "../../common/EmptyState";

export interface DataTableColumn<T> {
  field: keyof T;
  headerName: string;
  width?: number | string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;

  // Unique identifier for each row
  getRowId: (row: T) => string | number;

  // Optional row actions
  renderActions?: (row: T) => ReactNode;

  // Pagination settings
  rowsPerPageOptions?: number[];
  initialRowsPerPage?: number;
}

type SortDirection = "asc" | "desc";

function DataTable<T>({
  columns,
  rows,
  loading = false,
  emptyTitle = "No data found",
  emptyMessage = "There is currently no data to display.",
  getRowId,
  renderActions,
  rowsPerPageOptions = [5, 10, 25],
  initialRowsPerPage = 5,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(
    initialRowsPerPage
  );

  const [sortField, setSortField] = useState<keyof T | null>(
    null
  );
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  // Handle sorting
  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }

    setPage(0);
  };

  // Sort records without modifying original data
  const sortedRows = useMemo(() => {
    if (sortField === null) {
      return rows;
    }

    return [...rows].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const comparison =
        typeof aValue === "number" &&
        typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(
              String(bValue),
              undefined,
              { numeric: true, sensitivity: "base" }
            );

      return sortDirection === "asc"
        ? comparison
        : -comparison;  
    });
  }, [rows, sortField, sortDirection]);

  // Keep page within valid range when rows change
  const maxPage = Math.max(
    0,
    Math.ceil(sortedRows.length / rowsPerPage) - 1
  );
  const currentPage = Math.min(page, maxPage);

  // Get records for current page
  const paginatedRows = useMemo(() => {
    const start = currentPage * rowsPerPage;

    return sortedRows.slice(
      start,
      start + rowsPerPage
    );
  }, [sortedRows, currentPage, rowsPerPage]);

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <LoadingSpinner fullScreen />
      </Paper>
    );
  }

  if (rows.length === 0) {
    return (
      <Paper>
        <EmptyState
          title={emptyTitle}
          message={emptyMessage}
        />
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "action.hover" }}>
              {columns.map((column, index) => (
                <TableCell
                  key={`${String(column.field)}-${index}`}
                  sx={{
                    width: column.width,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortField === column.field}
                      direction={
                        sortField === column.field
                          ? sortDirection
                          : "asc"
                      }
                      onClick={() =>
                        handleSort(column.field)
                      }
                    >
                      {column.headerName}
                    </TableSortLabel>
                  ) : (
                    column.headerName
                  )}
                </TableCell>
              ))}

              {renderActions && (
                <TableCell sx={{ fontWeight: 600 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow
                key={getRowId(row)}
                hover
                sx={{
                  "&:last-child td": {
                    borderBottom: 0,
                  },
                }}
              >
                {columns.map((column, index) => {
                  const value = row[column.field];

                  return (
                    <TableCell
                      key={`${String(column.field)}-${index}`}
                    >
                      {column.render
                        ? column.render(value, row)
                        : String(value ?? "")}
                    </TableCell>
                  );
                })}

                {renderActions && (
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                      }}
                    >
                      {renderActions(row)}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={rows.length}
        page={currentPage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
        onPageChange={(_, newPage) => {
          setPage(newPage);
        }}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(
            parseInt(event.target.value, 10)
          );
          setPage(0);
        }}
      />
    </Paper>
  );
}

export default DataTable;
