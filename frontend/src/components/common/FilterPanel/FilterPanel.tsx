
import { useState } from "react";

import {
  Box,
  Button,
  Collapse,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
  Badge,
  IconButton,
  Divider,
} from "@mui/material";

import type { SxProps, Theme } from "@mui/material";

import {
  FilterListOutlined,
  ExpandLessOutlined,
  ExpandMoreOutlined,
  RestartAltOutlined,
} from "@mui/icons-material";

export type FilterValue = string | boolean;

export type FilterValues = Record<string, FilterValue>;

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  name: string;
  label: string;
  type:
    | "text"
    | "select"
    | "number"
    | "date"
    | "switch";
  placeholder?: string;
  options?: FilterOption[];
  defaultValue?: FilterValue;
  disabled?: boolean;
}

export interface FilterPanelProps {
  title?: string;
  fields: FilterField[];

  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onApply: (values: FilterValues) => void;
  onReset: () => void;

  collapsible?: boolean;
  defaultExpanded?: boolean;
  loading?: boolean;

  sx?: SxProps<Theme>;
}

function FilterPanel({
  title = "Filters",
  fields,
  values,
  onChange,
  onApply,
  onReset,
  collapsible = true,
  defaultExpanded = true,
  loading = false,
  sx,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState(
    defaultExpanded
  );

  const getDefaultValue = (
    field: FilterField
  ): FilterValue => {
    if (field.defaultValue !== undefined) {
      return field.defaultValue;
    }

    return field.type === "switch" ? false : "";
  };

  const handleFieldChange = (
    name: string,
    value: FilterValue
  ) => {
    onChange({
      ...values,
      [name]: value,
    });
  };

  const activeFilterCount = fields.filter(
    (field) => {
      const value = values[field.name];
      const defaultValue = getDefaultValue(field);

      return (
        value !== undefined &&
        value !== defaultValue &&
        value !== ""
      );
    }
  ).length;

  const renderField = (field: FilterField) => {
    const value =
      values[field.name] ?? getDefaultValue(field);

    switch (field.type) {
      case "select":
        return (
          <FormControl
            fullWidth
            size="small"
            disabled={field.disabled || loading}
          >
            <InputLabel>{field.label}</InputLabel>

            <Select
              value={String(value)}
              label={field.label}
              onChange={(event) =>
                handleFieldChange(
                  field.name,
                  event.target.value
                )
              }
            >
              {(field.options ?? []).map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case "switch":
        return (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(value)}
                disabled={field.disabled || loading}
                onChange={(event) =>
                  handleFieldChange(
                    field.name,
                    event.target.checked
                  )
                }
              />
            }
            label={field.label}
          />
        );

      case "number":
      case "date":
      case "text":
      default:
        return (
          <TextField
            fullWidth
            size="small"
            type={
              field.type === "number"
                ? "number"
                : field.type === "date"
                  ? "date"
                  : "text"
            }
            label={field.label}
            placeholder={field.placeholder}
            value={String(value)}
            disabled={field.disabled || loading}
            onChange={(event) =>
              handleFieldChange(
                field.name,
                event.target.value
              )
            }
            slotProps={{
              ...(field.type === "number"
                ? {
                    htmlInput: {
                      min: 0,
                      step: "any",
                    },
                  }
                : {}),
              ...(field.type === "date"
                ? {
                    inputLabel: {
                      shrink: true,
                    },
                  }
                : {}),
            }}
          />
        );
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={[
        {
          borderRadius: 2,
          overflow: "hidden",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Badge
            badgeContent={activeFilterCount}
            color="primary"
            invisible={activeFilterCount === 0}
          >
            <FilterListOutlined color="action" />
          </Badge>

          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600 }}
          >
            {title}
          </Typography>
        </Box>

        {collapsible && (
          <IconButton
            size="small"
            aria-label={
              expanded
                ? "Collapse filters"
                : "Expand filters"
            }
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? (
              <ExpandLessOutlined />
            ) : (
              <ExpandMoreOutlined />
            )}
          </IconButton>
        )}
      </Box>

      <Collapse in={!collapsible || expanded}>
        <Divider />

        <Box sx={{ p: 2.5 }}>
          {/* Filter Fields */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {fields.map((field) => (
              <Box
                key={field.name}
                sx={{
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {renderField(field)}
              </Box>
            ))}
          </Box>

          {/* Actions */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              mt: 3,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RestartAltOutlined />}
              onClick={onReset}
              disabled={loading}
            >
              Reset
            </Button>

            <Button
              variant="contained"
              startIcon={<FilterListOutlined />}
              onClick={() => onApply(values)}
              disabled={loading}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}

export default FilterPanel;
