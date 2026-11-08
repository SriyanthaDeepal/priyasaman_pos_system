
import { useState } from "react";
import type { FormEvent } from "react";

import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import type { SxProps, Theme } from "@mui/material";

import {
  CalendarMonthOutlined,
  CheckOutlined,
  ClearOutlined,
} from "@mui/icons-material";

export interface DateRangeValue {
  startDate: string;
  endDate: string;
}

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "custom";

export interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  onApply: (value: DateRangeValue) => void;
  onClear: () => void;

  title?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  loading?: boolean;
  showPresets?: boolean;

  sx?: SxProps<Theme>;
}

const emptyRange: DateRangeValue = {
  startDate: "",
  endDate: "",
};

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPresetRange(
  preset: DateRangePreset
): DateRangeValue {
  const today = new Date();

  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const end = new Date(start);

  switch (preset) {
    case "today":
      break;

    case "yesterday":
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      break;

    case "last7days":
      start.setDate(start.getDate() - 6);
      break;

    case "last30days":
      start.setDate(start.getDate() - 29);
      break;

    case "thisMonth":
      start.setDate(1);
      break;

    case "lastMonth":
      start.setMonth(start.getMonth() - 1, 1);
      end.setDate(0);
      break;

    case "custom":
      return emptyRange;
  }

  return {
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(end),
  };
}

function DateRangePicker({
  value,
  onChange,
  onApply,
  onClear,
  title = "Date Range",
  minDate,
  maxDate,
  disabled = false,
  loading = false,
  showPresets = true,
  sx,
}: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] =
    useState<DateRangePreset>("custom");

  const isDisabled = disabled || loading;

  const hasBothDates = Boolean(
    value.startDate && value.endDate
  );

  const invalidOrder =
    hasBothDates && value.startDate > value.endDate;

  const outsideBounds =
    Boolean(
      minDate &&
        ((value.startDate && value.startDate < minDate) ||
          (value.endDate && value.endDate < minDate))
    ) ||
    Boolean(
      maxDate &&
        ((value.startDate && value.startDate > maxDate) ||
          (value.endDate && value.endDate > maxDate))
    );

  const isValid =
    hasBothDates && !invalidOrder && !outsideBounds;

  const handlePresetChange = (
    preset: DateRangePreset
  ) => {
    setSelectedPreset(preset);

    if (preset !== "custom") {
      onChange(getPresetRange(preset));
    }
  };

  const handleDateChange = (
    field: keyof DateRangeValue,
    date: string
  ) => {
    setSelectedPreset("custom");

    onChange({
      ...value,
      [field]: date,
    });
  };

  const handleClear = () => {
    setSelectedPreset("custom");
    onClear();
  };

  const handleApply = (event?: FormEvent) => {
    event?.preventDefault();

    if (isValid && !isDisabled) {
      onApply(value);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={[
        {
          borderRadius: 2,
          p: 2.5,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box
        component="form"
        onSubmit={handleApply}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <CalendarMonthOutlined color="primary" />

          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600 }}
          >
            {title}
          </Typography>
        </Box>

        {/* Preset Selector */}
        {showPresets && (
          <FormControl
            fullWidth
            size="small"
            disabled={isDisabled}
          >
            <Typography
              variant="body2"
              sx={{ mb: 1, fontWeight: 500 }}
            >
              Quick Selection
            </Typography>

            <Select
              value={selectedPreset}
              onChange={(event) =>
                handlePresetChange(
                  event.target.value as DateRangePreset
                )
              }
            >
              <MenuItem value="custom">Custom Range</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="last7days">
                Last 7 Days
              </MenuItem>
              <MenuItem value="last30days">
                Last 30 Days
              </MenuItem>
              <MenuItem value="thisMonth">
                This Month
              </MenuItem>
              <MenuItem value="lastMonth">
                Last Month
              </MenuItem>
            </Select>
          </FormControl>
        )}

        {/* Date Fields */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Start Date"
            value={value.startDate}
            disabled={isDisabled}
            onChange={(event) =>
              handleDateChange(
                "startDate",
                event.target.value
              )
            }
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: {
                min: minDate,
                max: value.endDate || maxDate,
              },
            }}
          />

          <TextField
            fullWidth
            size="small"
            type="date"
            label="End Date"
            value={value.endDate}
            disabled={isDisabled}
            onChange={(event) =>
              handleDateChange(
                "endDate",
                event.target.value
              )
            }
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: {
                min: value.startDate || minDate,
                max: maxDate,
              },
            }}
          />
        </Box>

        {/* Validation */}
        {invalidOrder && (
          <Typography
            variant="caption"
            color="error"
          >
            End date cannot be earlier than start date.
          </Typography>
        )}

        {!invalidOrder && outsideBounds && (
          <Typography
            variant="caption"
            color="error"
          >
            The selected dates are outside the allowed range.
          </Typography>
        )}

        {/* Actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Button
            type="button"
            variant="outlined"
            color="inherit"
            startIcon={<ClearOutlined />}
            onClick={handleClear}
            disabled={isDisabled}
          >
            Clear
          </Button>

          <Button
            type="submit"
            variant="contained"
            startIcon={<CheckOutlined />}
            disabled={!isValid || isDisabled}
          >
            Apply Range
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

export default DateRangePicker;
